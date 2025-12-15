import { defineConfig, env } from 'prisma/config';
import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific file

const envFile =
  process.env.NODE_ENV === 'prod'
    ? '.env.prod'
    : process.env.NODE_ENV === 'test'
      ? '.env.test'
      : '.env.dev';

dotenv.config({ path: path.resolve(__dirname, `./${envFile}`) });

console.log(process.env.DATABASE_URL);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
