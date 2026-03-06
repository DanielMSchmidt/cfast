export interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
  CACHE: KVNamespace;
  APP_URL: string;
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
}
