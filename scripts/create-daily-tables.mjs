import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sql = neon(process.env.DATABASE_URL);

async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS daily_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      subscribed_at TIMESTAMP DEFAULT NOW(),
      unsubscribed_at TIMESTAMP,
      active BOOLEAN DEFAULT true
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS daily_challenges (
      id SERIAL PRIMARY KEY,
      date DATE UNIQUE NOT NULL,
      challenge_type TEXT NOT NULL,
      celebrity_id INT,
      matchup_id INT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log("Daily tables created.");
}

createTables().catch(console.error);
