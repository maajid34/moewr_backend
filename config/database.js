function databaseUri(env = process.env) {
  const uri = (env.db_url || env.MONGODB_URI || env.MONGO_URI || env.MONGO_URL || '').trim();
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) {
    throw new Error('Set db_url (or MONGODB_URI) to a valid MongoDB connection URI.');
  }
  return uri;
}

// Never log driver messages: they can contain connection credentials.
function failureCategory(error) {
  if (error.code === 18 || /authentication failed|bad auth/i.test(error.message || '')) return 'AUTHENTICATION';
  if (/ENOTFOUND|querySrv|EAI_AGAIN/i.test(error.message || '')) return 'DNS';
  return 'CONNECTION_UNAVAILABLE';
}

function startDatabase(mongoose, uri, { logger = console, retryMs = 5000, schedule = setTimeout, cancel = clearTimeout } = {}) {
  let stopped = false;
  let timer;
  async function connect() {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, connectTimeoutMS: 10000 });
      logger.info('MongoDB connected');
      // After a successful initial connection, the MongoDB driver handles reconnection.
    } catch (error) {
      logger.error(`MongoDB connection failed: ${failureCategory(error)}; retrying in ${retryMs}ms`);
      if (!stopped) timer = schedule(connect, retryMs);
    }
  }
  void connect();
  return () => { stopped = true; if (timer !== undefined) cancel(timer); };
}

function healthHandler(mongoose) {
  return (_req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.set('Cache-Control', 'no-store');
    res.status(ready ? 200 : 503).json({ status: ready ? 'OK' : 'UNAVAILABLE', database: ready ? 'connected' : 'unavailable' });
  };
}

module.exports = { databaseUri, failureCategory, startDatabase, healthHandler };
