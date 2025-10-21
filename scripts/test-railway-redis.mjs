#!/usr/bin/env node

import { Redis } from 'ioredis';

console.log('Testing Railway Redis connection...\n');
console.log('Environment variables:');
console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);
console.log('REDIS_URL:', process.env.REDIS_URL ? process.env.REDIS_URL.substring(0, 30) + '...' : 'not set');
console.log('REDISHOST:', process.env.REDISHOST);
console.log('REDISPORT:', process.env.REDISPORT);
console.log('\n');

const connections = [];

// Test TCP Proxy connection
if (process.env.REDIS_HOST === 'mainline.proxy.rlwy.net') {
  connections.push({
    name: 'TCP Proxy (Public)',
    config: {
      host: 'mainline.proxy.rlwy.net',
      port: 59608,
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Retry attempt ${times}, delay: ${delay}ms`);
        return delay;
      }
    }
  });
}

// Test Private Network connection
connections.push({
  name: 'Private Network',
  config: {
    host: 'redis.railway.internal',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`Retry attempt ${times}, delay: ${delay}ms`);
      return delay;
    }
  }
});

// Test with URL if provided
if (process.env.REDIS_URL) {
  connections.push({
    name: 'REDIS_URL',
    config: process.env.REDIS_URL
  });
}

async function testConnection(connection) {
  console.log(`\nTesting ${connection.name}...`);
  console.log('Config:', typeof connection.config === 'string'
    ? connection.config.substring(0, 40) + '...'
    : { ...connection.config, password: '***' });

  const redis = new Redis(connection.config);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log(`❌ Timeout after 5 seconds`);
      redis.disconnect();
      resolve(false);
    }, 5000);

    redis.on('connect', async () => {
      console.log(`✅ Connected successfully!`);
      clearTimeout(timeout);

      try {
        await redis.ping();
        console.log(`✅ PING successful`);

        const key = `test:${Date.now()}`;
        await redis.set(key, 'Railway Redis Test');
        const value = await redis.get(key);
        console.log(`✅ SET/GET successful: ${value}`);
        await redis.del(key);

        redis.disconnect();
        resolve(true);
      } catch (error) {
        console.log(`❌ Operation failed:`, error.message);
        redis.disconnect();
        resolve(false);
      }
    });

    redis.on('error', (err) => {
      console.log(`❌ Connection error:`, err.message);
      if (err.message.includes('Protocol error, got "H"')) {
        console.log('⚠️  This error means you are connecting to an HTTP endpoint, not Redis TCP port!');
        console.log('    Make sure you are using the TCP proxy endpoint, not an HTTP URL.');
      }
      clearTimeout(timeout);
      redis.disconnect();
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('=' .repeat(50));

  for (const connection of connections) {
    await testConnection(connection);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('\n✅ Correct configuration for Railway:');
  console.log('\nOption 1 - TCP Proxy (Public):');
  console.log('  REDIS_HOST=mainline.proxy.rlwy.net');
  console.log('  REDIS_PORT=59608');
  console.log('  REDIS_PASSWORD=<your-password>');

  console.log('\nOption 2 - Private Network (Recommended):');
  console.log('  REDIS_HOST=redis.railway.internal');
  console.log('  REDIS_PORT=6379');
  console.log('  REDIS_PASSWORD=<your-password>');

  console.log('\n⚠️  Do NOT use REDISHOST/REDISPORT variables');
  console.log('    These might point to the wrong endpoint!\n');
}

runTests();