import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/reputation_manager_dev?schema=public',
  },
});
