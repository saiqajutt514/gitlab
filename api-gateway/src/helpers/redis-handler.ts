import { Injectable } from '@nestjs/common';
import { RedisClient } from 'redis';
import { promisify } from 'util';
import appConfig from 'config/appConfig';

@Injectable()
export class RedisHandler {
  client: RedisClient;
  getRedisKey: Function;
  scanRedisKey: Function;

  constructor() {
    try {
      this.client = new RedisClient({
        host: appConfig().RedisHost,
        port: appConfig().RedisPort,
      });
      this.getRedisKey = promisify(this.client.get).bind(this.client);
      this.scanRedisKey = promisify(this.client.scan).bind(this.client);
    } catch (err) {
      console.log(err?.message);
    }
  }

  async getMatchedClients(pattern: string) {
    try {
      const scanList = [];
      let cursor = '0';
      do {
        const reply = await this.scanRedisKey(cursor, 'MATCH', pattern);
        cursor = reply[0];
        scanList.push(...reply[1]);
      } while (cursor !== '0');
      return scanList;
    } catch (err) {}
  }
}
