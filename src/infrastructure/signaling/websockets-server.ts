import * as http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { z } from 'zod';

const SIGNALLING_PATH = '/ws';

const logger = new Logger('WebSocket');

/* ---------- Zod schemas ---------- */

const peerIdSchema = z.string().min(7).max(128);
const sdpSchema = z.string().min(1).max(64 * 1024);
const peerTypeSchema = z.enum(['title', 'qos']);

/** Incoming: register */
const registerSchema = z.object({
    type: z.literal('register'),
    peer_id: peerIdSchema,
});

/** Incoming: offer (from offerer) */
const offerInSchema = z.object({
    type: z.literal('offer'),
    target_peer_id: peerIdSchema,
    target_peer_type: peerTypeSchema,
    local_peer_id: peerIdSchema.optional(),
    sdp: sdpSchema,
});

/** Incoming: answer (from answerer) */
const answerInSchema = z.object({
    type: z.literal('answer'),
    target_peer_id: peerIdSchema,
    target_peer_type: peerTypeSchema,
    sdp: sdpSchema,
});

/** Incoming: ICE candidate (trickle) */
const iceCandidateInSchema = z.object({
    type: z.literal('ice_candidate'),
    target_peer_id: peerIdSchema,
    target_peer_type: peerTypeSchema,
    candidate: z.string().min(1).max(1024),
    mid: z.string().max(32).optional(),
});

/** Incoming: ICE gathering complete (trickle end-of-candidates) */
const iceGatheringCompleteInSchema = z.object({
    type: z.literal('ice_gathering_complete'),
    target_peer_id: peerIdSchema,
    target_peer_type: peerTypeSchema,
});

/** Discriminated union of all incoming message types */
const incomingMessageSchema = z.discriminatedUnion('type', [
    registerSchema,
    offerInSchema,
    answerInSchema,
    iceCandidateInSchema,
    iceGatheringCompleteInSchema,
]);

type RegisterMessage = z.infer<typeof registerSchema>;
type OfferInMessage = z.infer<typeof offerInSchema>;
type AnswerInMessage = z.infer<typeof answerInSchema>;
type IncomingMessage = z.infer<typeof incomingMessageSchema>;

function parseIncomingMessage(data: Buffer | string): { success: true; data: IncomingMessage } | { success: false; error: string } {
    try {
        const raw = typeof data === 'string' ? data : data.toString('utf8');
        const parsed = JSON.parse(raw);
        const result = incomingMessageSchema.safeParse(parsed);
        if (result.success) {
            return { success: true, data: result.data };
        }
        const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        return { success: false, error: issues };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
}

function send(ws: WebSocket, obj: object, logLabel: string, ip: string, peerId?: string): void {
    if (ws.readyState !== WebSocket.OPEN) return;
    const payload = JSON.stringify(obj);
    const type = (obj as { type?: string }).type ?? 'unknown';
    if (peerId) {
        logger.log(`send ${logLabel} type=${type} peer_id=${peerId} - ${ip} (${payload.length} bytes)`);
    } else {
        logger.log(`send ${logLabel} type=${type} - ${ip} (${payload.length} bytes)`);
    }
    ws.send(payload);
}

export function attachSignallingWebSocket(httpServer: http.Server): void {
    const wss = new WebSocketServer({ noServer: true });
    const peerToWs = new Map<string, WebSocket>();
    const wsToPeer = new Map<WebSocket, string>();

    function unregister(ws: WebSocket): void {
        const peerId = wsToPeer.get(ws);
        if (peerId) {
            peerToWs.delete(peerId);
            wsToPeer.delete(ws);
        }
    }

    function clientIp(request: http.IncomingMessage): string {
        return request.socket?.remoteAddress ?? 'unknown';
    }

    httpServer.on('upgrade', (request, socket, head) => {
        const path = request.url?.split('?')[0] ?? '';
        if (path !== SIGNALLING_PATH) {
            socket.destroy();
            return;
        }
        logger.log(`connection upgrade path=${path} - ${clientIp(request)}`);
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });

    wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
        const ip = clientIp(request);
        logger.log(`connection open - ${ip}`);

        ws.on('message', (data: Buffer | Buffer[] | ArrayBuffer) => {
            const buf = Buffer.isBuffer(data) ? data : Buffer.concat(Array.isArray(data) ? data : [Buffer.from(data)]);
            const result = parseIncomingMessage(buf);

            if (result.success === false) {
                logger.warn(`message parse_error - ${ip} error=${result.error}`);
                send(ws, { type: 'error', error: 'invalid_message' }, 'parse_error', ip);
                return;
            }

            const msg = result.data;

            if (msg.type === 'register') {
                const peerId = msg.peer_id.trim();
                const existing = peerToWs.get(peerId);
                if (existing && existing !== ws) {
                    logger.log(`register replace existing peer_id=${peerId} - ${ip}`);
                    existing.close();
                    peerToWs.delete(peerId);
                    wsToPeer.delete(existing);
                }
                peerToWs.set(peerId, ws);
                wsToPeer.set(ws, peerId);
                logger.log(`message register peer_id=${peerId} - ${ip}`);
                send(ws, { type: 'registered', peer_id: peerId }, 'registered', ip, peerId);
                return;
            }

            const senderPeerId = wsToPeer.get(ws);
            if (!senderPeerId) {
                logger.warn(`message register_first - ${ip}`);
                send(ws, { type: 'error', error: 'register_first' }, 'error', ip);
                return;
            }

            if (msg.type === 'offer') {
                const target = msg.target_peer_id.trim();
                const targetWs = peerToWs.get(target);
                if (!targetWs || targetWs.readyState !== WebSocket.OPEN) {
                    logger.warn(`message offer peer_unavailable from=${senderPeerId} target=${target} - ${ip}`);
                    send(ws, { type: 'error', error: 'peer_unavailable', target_peer_id: target, target_peer_type: msg.target_peer_type }, 'error', ip, senderPeerId);
                    return;
                }
                const fromPeerId =
                    msg.local_peer_id && peerIdSchema.safeParse(msg.local_peer_id.trim()).success
                        ? msg.local_peer_id.trim()
                        : senderPeerId;
                logger.log(`message offer from=${fromPeerId} target=${target} - ${ip}`);
                send(
                    targetWs,
                    { type: 'offer', from_peer_id: fromPeerId, from_peer_type: msg.target_peer_type, sdp: msg.sdp },
                    'offer_forward',
                    ip,
                    target,
                );
                return;
            }

            if (msg.type === 'answer') {
                const target = msg.target_peer_id.trim();
                const targetWs = peerToWs.get(target);
                if (!targetWs || targetWs.readyState !== WebSocket.OPEN) {
                    logger.warn(`message answer peer_unavailable from=${senderPeerId} target=${target} - ${ip}`);
                    send(ws, { type: 'error', error: 'peer_unavailable', target_peer_id: target, target_peer_type: msg.target_peer_type }, 'error', ip, senderPeerId);
                    return;
                }
                logger.log(`message answer from=${senderPeerId} target=${target} - ${ip}`);
                send(
                    targetWs,
                    { type: 'answer', from_peer_id: senderPeerId, from_peer_type: msg.target_peer_type, sdp: msg.sdp },
                    'answer_forward',
                    ip,
                    target,
                );
                return;
            }

            if (msg.type === 'ice_candidate') {
                const target = msg.target_peer_id.trim();
                const targetWs = peerToWs.get(target);
                if (!targetWs || targetWs.readyState !== WebSocket.OPEN) {
                    logger.warn(`message ice_candidate peer_unavailable from=${senderPeerId} target=${target} - ${ip}`);
                    send(ws, { type: 'error', error: 'peer_unavailable', target_peer_id: target, target_peer_type: msg.target_peer_type }, 'error', ip, senderPeerId);
                    return;
                }
                send(
                    targetWs,
                    {
                        type: 'ice_candidate',
                        from_peer_id: senderPeerId,
                        from_peer_type: msg.target_peer_type,
                        candidate: msg.candidate,
                        mid: msg.mid ?? '',
                    },
                    'ice_candidate_forward',
                    ip,
                    target,
                );
                return;
            }

            if (msg.type === 'ice_gathering_complete') {
                const target = msg.target_peer_id.trim();
                const targetWs = peerToWs.get(target);
                if (!targetWs || targetWs.readyState !== WebSocket.OPEN) {
                    logger.warn(`message ice_gathering_complete peer_unavailable from=${senderPeerId} target=${target} - ${ip}`);
                    send(ws, { type: 'error', error: 'peer_unavailable', target_peer_id: target, target_peer_type: msg.target_peer_type }, 'error', ip, senderPeerId);
                    return;
                }
                logger.log(`message ice_gathering_complete from=${senderPeerId} target=${target} - ${ip}`);
                send(
                    targetWs,
                    { type: 'ice_gathering_complete', from_peer_id: senderPeerId, from_peer_type: msg.target_peer_type },
                    'ice_gathering_complete_forward',
                    ip,
                    target,
                );
                return;
            }
        });

        ws.on('close', (code?: number, reason?: Buffer) => {
            const peerId = wsToPeer.get(ws);
            const reasonStr = reason?.length ? reason.toString('utf8') : '';
            if (peerId) {
                logger.log(`connection close peer_id=${peerId} code=${code ?? 'n/a'} reason=${reasonStr || 'n/a'} - ${ip}`);
            } else {
                logger.log(`connection close (unregistered) code=${code ?? 'n/a'} - ${ip}`);
            }
            unregister(ws);
        });
        ws.on('error', (err: Error) => {
            const peerId = wsToPeer.get(ws);
            if (peerId) {
                logger.warn(`connection error peer_id=${peerId} - ${ip} error=${err.message}`);
            } else {
                logger.warn(`connection error (unregistered) - ${ip} error=${err.message}`);
            }
            unregister(ws);
        });
    });
}
