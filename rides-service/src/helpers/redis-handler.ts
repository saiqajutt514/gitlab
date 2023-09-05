import { Injectable } from '@nestjs/common';
import { RedisClient } from 'redis';
import { promisify } from 'util';
import appConfig from 'config/appConfig';

@Injectable()
export class RedisHandler {
  client: RedisClient;
  getRedisKey: Function;
  scanRedisKey: Function;
  getAllKeys: Function;
  hgetall: Function;
  hget: Function;
  mget: Function;
  lrange: Function;

  constructor() {
    this.client = new RedisClient({
      host: appConfig().RedisHost,
      port: appConfig().RedisPort,
    });
    this.getRedisKey = promisify(this.client.get).bind(this.client);
    this.scanRedisKey = promisify(this.client.scan).bind(this.client);
    this.getAllKeys = promisify(this.client.keys).bind(this.client);
    this.hgetall = promisify(this.client.hgetall).bind(this.client);
    this.hget = promisify(this.client.hget).bind(this.client);
    this.mget = promisify(this.client.mget).bind(this.client);
    this.lrange = promisify(this.client.lrange).bind(this.client);
  }

  async getMatchedClients(pattern: string) {
    const scanList = [];
    let cursor = '0';
    do {
      const reply = await this.scanRedisKey(cursor, 'MATCH', pattern);
      cursor = reply[0];
      scanList.push(...reply[1]);
    } while (cursor !== '0');
    return scanList;
  }
}