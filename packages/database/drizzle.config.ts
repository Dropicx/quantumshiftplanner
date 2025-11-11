import { resolve } from 'path';

import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../../.env') });

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/planday',
  },
} satisfies Config;
