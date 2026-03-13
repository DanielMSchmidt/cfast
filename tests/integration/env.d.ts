import "cloudflare:test";

declare module "cloudflare:test" {
  interface ProvidedEnv {
    DB: D1Database;
    KV: KVNamespace;
    R2: R2Bucket;
    UPLOADS: R2Bucket;
    APP_URL: string;
    MAILGUN_API_KEY: string;
    MAILGUN_DOMAIN: string;
    ENVIRONMENT: string;
    APP_NAME: string;
  }
}
