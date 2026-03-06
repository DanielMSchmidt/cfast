import { resetDatabase, seedData, createTestSessions } from "./setup";

const BASE_URL = "http://localhost:5173";

export default async function globalSetup() {
  console.log("Resetting database...");
  resetDatabase();

  // Wait for the dev server to be ready
  let retries = 0;
  while (retries < 30) {
    try {
      const res = await fetch(BASE_URL);
      if (res.ok || res.status < 500) break;
    } catch {
      // server not ready
    }
    await new Promise(r => setTimeout(r, 1000));
    retries++;
  }

  console.log("Creating test users and sessions via Better Auth API...");
  await createTestSessions(BASE_URL);

  console.log("Seeding roles, posts, and comments...");
  seedData();

  console.log("Setup complete.");
}
