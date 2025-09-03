import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
  throw new Error("Please define the MONGO_URI environment variable");
}

let cached = global.mongoose || { conn: null, promise: null };

export default async function connect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(`${MONGODB_URI}/rzrwallet`)
      .then((mongoose) => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  global.mongoose = cached;
  return cached.conn;
}
