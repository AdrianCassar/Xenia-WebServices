const REFRESH_INTERVAL = 30;

let time = REFRESH_INTERVAL;
let serverStartTime: Date | null = null;
let table_loaded = false;

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setText(id: string, text: string | number): void {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = String(text);
  }
}

function updateMetadata(metadata: SessionsMetadata): void {
  const Build_Commit = metadata.HEROKU_BUILD_COMMIT;
  const Released_At = metadata.HEROKU_RELEASE_CREATED_AT;

  if (!serverStartTime && metadata.START_TIME) {
    serverStartTime = new Date(metadata.START_TIME);
    updateUptime();
  }

  setText(
    'RELEASE_CREATED_AT',
    Released_At ? new Date(Released_At).toDateString() : 'N/A',
  );

  const BUILD_COMMIT = document.getElementById('BUILD_COMMIT');

  if (!BUILD_COMMIT) {
    return;
  }

  if (Build_Commit) {
    BUILD_COMMIT.setAttribute(
      'href',
      `https://github.com/AdrianCassar/Xenia-WebServices/commit/${Build_Commit}`,
    );
    BUILD_COMMIT.textContent = Build_Commit.substring(0, 7);
  } else {
    BUILD_COMMIT.removeAttribute('target');
    BUILD_COMMIT.setAttribute('href', '#');
    BUILD_COMMIT.textContent = 'N/A';
  }
}

function updateStats(sessionsData: SessionsResponse): void {
  const titles = sessionsData?.Titles ?? [];
  const sessions = titles.flatMap((titleInfo) => titleInfo.sessions ?? []);
  const players = sessions.reduce(
    (count, session) => count + (session.players?.length || 1),
    0,
  );

  setText('session_count', sessions.length);
  setText('player_count', players);
  setText('game_count', titles.length);
}

function renderSession(titleInfo: TitleSessions, session: SessionInfo): string {
  const title = titleInfo?.name || 'N/A';

  const Version_Text =
    session.version && isValidVersion(session.version)
      ? session.version
      : 'N/A';
  const MediaID_Text =
    session.mediaId &&
    !isZero(session.mediaId) &&
    isHexadecimal(session.mediaId)
      ? session.mediaId
      : 'N/A';

  const icon_asset = titleInfo.icon || 'assets/xbox.svg';
  const icon_class = titleInfo.icon ? 'game-icon' : 'game-icon placeholder';
  const compatibility_url = `https://github.com/xenia-project/game-compatibility/issues?q=${encodeURIComponent(`is:issue is:open ${titleInfo.titleId}`)}`;

  const HOST_GAMERTAG = session.host_gamertag;
  const HOST_PRESENCE = session.host_presence;
  const HOST_XUID = session.host_xuid;

  const players = Array.isArray(session.players) ? session.players : [];
  const player_count = players.length || 1;
  const fill = session.total
    ? Math.min(100, (player_count / session.total) * 100)
    : 0;

  const player_items = players.length
    ? players
        .map(
          (player, index) =>
            `<li class="player${index == 0 ? ' is-host' : ''}">
              <img src="${escapeHtml(player.gamerpic)}" alt="" width="32" height="32">
              <span title="${escapeHtml(player.gamertag)}${index == 0 ? ' (host)' : ''}">${escapeHtml(player.gamertag)}</span>
            </li>`,
        )
        .join('')
    : '<li class="player is-host"><span>Player 1</span></li>';

  return `<article class="session-card">
    <div class="game">
      <img class="${icon_class}" src="${escapeHtml(icon_asset)}" width="64" height="64" alt="${escapeHtml(title)}" title="${escapeHtml(title)}">
      <div class="game-info">
        <h2 class="game-title"><a href="${compatibility_url}" target="_blank" rel="noopener">${escapeHtml(title)}</a></h2>
        ${HOST_GAMERTAG ? `<div class="host">${escapeHtml(HOST_GAMERTAG)}</div>` : ''}
        ${HOST_PRESENCE ? `<div class="presence">${escapeHtml(HOST_PRESENCE)}</div>` : ''}
        <div class="meta">
          <span class="chip">Title ID <b>${escapeHtml(titleInfo.titleId)}</b></span>
          <span class="chip">Media ID <b>${escapeHtml(MediaID_Text)}</b></span>
          <span class="chip">Version <b>${escapeHtml(Version_Text)}</b></span>
        </div>
        ${HOST_XUID ? `<button class="copy-xuid-btn" data-xuid="${escapeHtml(HOST_XUID)}">Copy host XUID</button>` : ''}
      </div>
    </div>
    <div class="players">
      <div class="players-header">
        <span>Players</span>
        <span class="slots">${player_count} / ${escapeHtml(session.total)}</span>
      </div>
      <div class="slot-track"><div class="slot-bar" style="width: ${fill}%"></div></div>
      <ul class="player-list">${player_items}</ul>
    </div>
  </article>`;
}

function renderSessions(sessionsData: SessionsResponse): string {
  const cards = (sessionsData?.Titles ?? []).flatMap((titleInfo) =>
    (titleInfo?.sessions ?? []).map((session) =>
      renderSession(titleInfo, session),
    ),
  );

  if (!cards.length) {
    return `<div class="empty">
      <img src="assets/xbox.svg" alt="" width="48" height="48">
      <h2>No active sessions</h2>
      <p>Sessions appear here when players host a game online.</p>
    </div>`;
  }

  return cards.join('\n');
}

function isZero(s: string): boolean {
  return Number(s) === 0;
}

function isHexadecimal(s: string): boolean {
  return !isNaN(parseInt(s, 16));
}

function isValidVersion(version: string): boolean {
  return /^(\d+\.)?(\d+\.)?(\d+\.)(\d+)$/.test(version);
}

function setSessionsHtml(html: string): void {
  const sessions = document.getElementById('sessions');

  if (sessions) {
    sessions.innerHTML = html;
  }
}

function setRefreshError(error: boolean): void {
  document.querySelector('.refresh')?.classList.toggle('error', error);
}

async function refreshSessionTable(): Promise<void> {
  let sessionData: SessionsResponse;

  try {
    const response = await fetch(window.origin + '/sessions');

    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }

    sessionData = await response.json();
  } catch (error) {
    console.log(error instanceof Error ? error.message : error);
    setRefreshError(true);

    if (!table_loaded) {
      setSessionsHtml(`<div class="empty">
        <h2>Unable to reach the server</h2>
        <p>Retrying in ${REFRESH_INTERVAL} seconds.</p>
      </div>`);
    }

    return;
  }

  setRefreshError(false);

  if (sessionData?.Metadata) {
    updateMetadata(sessionData.Metadata);
  }

  const sessions = renderSessions(sessionData);
  const show = () => {
    setSessionsHtml(sessions);
    updateStats(sessionData);
  };

  if (table_loaded) {
    show();
  } else {
    // Animate skeleton loader for 2s on first load
    setTimeout(() => {
      show();
      table_loaded = true;
    }, 2000);
  }
}

function formatUTCToDDHHMMSS(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');

  return `${days}d ${hh}:${mm}:${ss}`;
}

function updateUptime(): void {
  if (serverStartTime) {
    const diffMs = Date.now() - serverStartTime.getTime();

    setText('UPTIME', formatUTCToDDHHMMSS(diffMs));
  }
}

function refreshTimer(): void {
  if (time <= 0) {
    time = REFRESH_INTERVAL;
    void refreshSessionTable();
  }

  if (document.readyState === 'complete') {
    setText('countdown', `Refreshing in ${time}s`);
    document
      .getElementById('refresh_bar')
      ?.style.setProperty('--progress', String(time / REFRESH_INTERVAL));
    updateUptime();

    time -= 1;
  }
}

function setIntervalImmediately(func: () => void, interval: number): number {
  func();
  return window.setInterval(func, interval);
}

document.addEventListener('DOMContentLoaded', () => {
  setIntervalImmediately(refreshTimer, 1000);
  void refreshSessionTable();
});

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const btn = event.target.closest<HTMLButtonElement>('.copy-xuid-btn');

  if (!btn || btn.matches('.copied, .failed')) {
    return;
  }

  const xuid = btn.dataset.xuid ?? '';
  const label = btn.textContent;

  const flash = (className: string, text: string) => {
    btn.classList.add(className);
    btn.textContent = text;

    setTimeout(() => {
      btn.classList.remove(className);
      btn.textContent = label;
    }, 2000);
  };

  navigator.clipboard
    .writeText(xuid)
    .then(() => flash('copied', 'Copied!'))
    .catch(() => flash('failed', 'Copy failed'));
});
