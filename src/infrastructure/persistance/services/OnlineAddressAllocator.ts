import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../models/PlayerSchema';
import IpAddress from 'src/domain/value-objects/IpAddress';

@Injectable()
export default class OnlineAddressAllocator {
  constructor(
    @InjectModel(Player.name)
    private readonly playerModel: Model<PlayerDocument>,
  ) {}

  async allocate(): Promise<IpAddress> {
    const players = await this.playerModel
      .find({ onlineAddress: { $exists: true, $ne: null } })
      .select('onlineAddress')
      .lean();

    const used = new Set(
      players
        .map((p) => p.onlineAddress)
        .filter((a): a is string => !!a && a.startsWith('0.')),
    );

    // 0.0.0.1 .. 0.255.255.254
    for (let n = 1; n <= 0x00ffffff; n++) {
      const a = (n >>> 16) & 0xff;
      const b = (n >>> 8) & 0xff;
      const c = n & 0xff;
      const candidate = `0.${a}.${b}.${c}`;
      if (!used.has(candidate)) {
        return new IpAddress(candidate);
      }
    }

    throw new Error('online address space exhausted');
  }
}
