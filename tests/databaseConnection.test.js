const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const { databaseUri, startDatabase, healthHandler, failureCategory } = require('../config/database');

test('configuration preserves legacy URI precedence and rejects missing/invalid configuration', () => {
  assert.equal(databaseUri({ db_url: 'mongodb://legacy/db', MONGODB_URI: 'mongodb://other/db' }), 'mongodb://legacy/db');
  assert.equal(databaseUri({ MONGODB_URI: 'mongodb+srv://example/db' }), 'mongodb+srv://example/db');
  assert.throws(() => databaseUri({}), /Set db_url/);
  assert.throws(() => databaseUri({ db_url: 'https://example' }), /Set db_url/);
});

test('initial connection failure retries and recovers without leaking credentials', async () => {
  let attempts = 0; let retry; const logs = [];
  const fake = { connect: async () => { if (++attempts === 1) throw new Error('secret credentials'); } };
  startDatabase(fake, 'mongodb://example/db', {
    logger: { error: message => logs.push(message), info: message => logs.push(message) },
    schedule: fn => { retry = fn; return 1; },
  });
  await new Promise(setImmediate);
  assert.equal(attempts, 1); assert.equal(typeof retry, 'function');
  await retry(); assert.equal(attempts, 2);
  assert.ok(logs.includes('MongoDB connected')); assert.ok(!logs.join().includes('secret'));
});

test('readiness reflects connection failure and recovery; liveness stays available', async () => {
  const fake = { connection: { readyState: 0 } }; const app = express();
  app.get('/', (_req, res) => res.send('OK')); app.get('/health', healthHandler(fake));
  assert.equal((await request(app).get('/')).status, 200);
  assert.equal((await request(app).get('/health')).status, 503);
  fake.connection.readyState = 1;
  const result = await request(app).get('/health');
  assert.equal(result.status, 200); assert.equal(result.body.database, 'connected');
  assert.equal(result.headers['cache-control'], 'no-store');
});

test('safe connection diagnostics classify authentication and DNS failures', () => {
  assert.equal(failureCategory({ code: 18 }), 'AUTHENTICATION');
  assert.equal(failureCategory({ message: 'querySrv ENOTFOUND' }), 'DNS');
});
