#!/usr/bin/env node

import { Redis } from 'ioredis';

console.log('Testing Redis connection...\n');

// Try different connection methods
const connectionMethods = [];

// Method 1: Using REDIS_URL if available
if (process.env.REDIS_URL) {
  connectionMethods.push({
    name: 'REDIS_URL',
    config: process.env.REDIS_URL
  });
}

// Method 2: Using individual variables
if (process.env.REDIS_HOST) {
  connectionMethods.push({
    name: 'Individual vars',
    config: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    }
  });
}

// Method 3: Using REDISHOST/REDISPORT/REDISPASSWORD (Railway format)
if (process.env.REDISHOST) {
  connectionMethods.push({
    name: 'Railway vars',
    config: {
      host: process.env.REDISHOST,
      port: parseInt(process.env.REDISPORT || '6379'),
      password: process.env.REDISPASSWORD,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    }
  });
}

if (connectionMethods.length === 0) {
  console.log('No Redis configuration found in environment variables.');
  console.log('Available environment variables:', Object.keys(process.env).filter(k => k.includes('REDIS')).join(', '));
  process.exit(1);
}

async function testConnection(method) {
  console.log(`\nTesting ${method.name}...`);
  console.log('Config:', typeof method.config === 'string'
    ? method.config.substring(0, 30) + '...'
    : JSON.stringify({ ...method.config, password: method.config.password ? '***' : undefined }, null, 2));

  const redis = new Redis(method.config);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.log(`❌ ${method.name}: Connection timeout`);
      redis.disconnect();
      resolve(false);
    }, 5000);

    redis.on('connect', () => {
      console.log(`✅ ${method.name}: Connected successfully!`);
      clearTimeout(timeout);

      // Test basic operations
      redis.ping()
        .then(() => {
          console.log(`✅ ${method.name}: PING successful`);
          return redis.set('test:connection', new Date().toISOString());
        })
        .then(() => {
          console.log(`✅ ${method.name}: SET successful`);
          return redis.get('test:connection');
        })
        .then((value) => {
          console.log(`✅ ${method.name}: GET successful - ${value}`);
          redis.disconnect();
          resolve(true);
        })
        .catch((err) => {
          console.log(`❌ ${method.name}: Operation failed -`, err.message);
          redis.disconnect();
          resolve(false);
        });
    });

    redis.on('error', (err) => {
      console.log(`❌ ${method.name}: Connection error -`, err.message);
      clearTimeout(timeout);
      redis.disconnect();
      resolve(false);
    });
  });
}

// Test all methods
async function runTests() {
  const results = [];

  for (const method of connectionMethods) {
    const success = await testConnection(method);
    results.push({ method: method.name, success });
  }

  console.log('\n========== RESULTS ==========');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.method}`);
  });

  const anySuccess = results.some(r => r.success);
  if (anySuccess) {
    console.log('\n✅ At least one connection method works!');
  } else {
    console.log('\n❌ All connection methods failed.');
    console.log('\nTroubleshooting tips:');
    console.log('1. Check if Redis service is running in Railway');
    console.log('2. Verify TCP Proxy is enabled for Redis');
    console.log('3. Check environment variables are correctly referenced');
    console.log('4. Try using REDIS_URL instead of individual variables');
  }

  process.exit(anySuccess ? 0 : 1);
}

runTests();