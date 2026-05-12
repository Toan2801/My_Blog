// Vitest setup: pin a deterministic READER_TOKEN_SECRET for the test process.
process.env.READER_TOKEN_SECRET = 'test-secret-do-not-use-in-production';
process.env.ADMIN_EMAILS = 'admin@abc.com';
