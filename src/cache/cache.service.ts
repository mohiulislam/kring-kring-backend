import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis();
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.redis.get(key);
      return JSON.parse(value || '{}');
    } catch (error) {
      this.logger.error(`Error getting cache item ${key}: `, error);
      throw error;
    }
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      this.logger.error(`Error setting cache item ${key}: `, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error removing cache item ${key}: `, error);
      throw error;
    }
  }
}