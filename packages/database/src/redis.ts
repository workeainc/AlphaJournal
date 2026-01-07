import { Redis } from "@upstash/redis";

const globalForRedis = global as unknown as { redis: Redis };

function createRedisClient(): Redis | null {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        console.warn("⚠️ Redis environment variables missing. Caching disabled.");
        return null;
    }

    return new Redis({
        url,
        token,
    });
}

export const redis = globalForRedis.redis || createRedisClient();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis as any;
