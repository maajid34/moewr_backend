// Read-only diagnostic; safe to run on the API host. Never prints the URI.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
const { MongoClient } = require('mongodb');
const { databaseUri, failureCategory } = require('../config/database');
(async () => {
  let client;
  try {
    client = new MongoClient(databaseUri(), { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
    await client.connect();
    await client.db().command({ ping: 1 });
    console.log(JSON.stringify({ database: 'connected', ping: 'PASS' }));
  } catch (error) {
    console.error(JSON.stringify({ database: 'unavailable', reason: client ? failureCategory(error) : 'MISSING_OR_INVALID_URI' }));
    process.exitCode = 1;
  } finally { if (client) await client.close(); }
})();
