import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const options = {};

if (!uri && process.env.NODE_ENV === 'production') {
  // During build on Vercel without env vars, we export a dummy promise
  // that will fail if actually awaited, but won't crash the build evaluation.
  const clientPromise = Promise.resolve(null as any);
  export default clientPromise;
} else {
  if (!uri) {
    throw new Error('Please define MONGODB_URI in .env.local');
  }

  let clientPromise: Promise<MongoClient>;
  
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    clientPromise = new MongoClient(uri, options).connect();
  }
  
  export default clientPromise;
}
