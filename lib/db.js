import { MongoClient } from 'mongodb';

if (!process.env.DB_URI) {
  throw new Error('MongoDB URI not found. Please set DB_URI in your .env.local file.');
}

const uri = process.env.DB_URI;
const options = {
  tls: true,
  tlsAllowInvalidCertificates: false,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

async function getDB(dbName) {
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(dbName);
  } catch (err) {
    console.error('[MongoDB] Connection error:', err);
    throw new Error('Failed to connect to database.');
  }
}

export async function getCollection(collectionName) {
  const db = await getDB('smartFridge_DB');
  if (!db) return null;
  return db.collection(collectionName);
}
