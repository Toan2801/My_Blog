import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let clientPromise: Promise<MongoClient>;

if (!uri && process.env.NODE_ENV === 'production') {
  // During build on Vercel without env vars, we export a dummy promise
  // that will fail if actually awaited, but won't crash the build evaluation.
  clientPromise = Promise.resolve(null as any);
} else {
  if (!uri) {
    throw new Error('Please define MONGODB_URI in .env.local');
  }

  if (process.env.NODE_ENV === 'development') {
    if (!(global as any)._mongoClientPromise) {
      (global as any)._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    clientPromise = (global as any)._mongoClientPromise;
  } else {
    clientPromise = new MongoClient(uri, options).connect();
  }
}

export default clientPromise;
