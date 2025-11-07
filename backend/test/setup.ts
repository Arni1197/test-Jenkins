import { connect, connection } from 'mongoose';
// test/setup.ts
import 'dotenv/config';

export const connectTestDB = async () => {
  await connect(process.env.MONGO_URI || 'mongodb://localhost:27017/game-db-test');
};

export const clearTestDB = async () => {
  const collections = connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeTestDB = async () => {
  await connection.dropDatabase();
  await connection.close();
};