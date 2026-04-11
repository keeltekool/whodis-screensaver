import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Load .env.local manually (no dotenv dependency)
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sql = neon(process.env.DATABASE_URL);

async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS matchups (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      fighter_a_id INT NOT NULL,
      fighter_b_id INT NOT NULL,
      fighter_a_nickname TEXT,
      fighter_b_nickname TEXT,
      tagline TEXT NOT NULL,
      matchup_type TEXT NOT NULL,
      difficulty INT DEFAULT 2,
      sort_order INT DEFAULT 0,
      active BOOLEAN DEFAULT true
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS matchup_rounds (
      id SERIAL PRIMARY KEY,
      matchup_id INT REFERENCES matchups(id) ON DELETE CASCADE,
      round_number INT NOT NULL,
      round_label TEXT NOT NULL,
      question_text TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      fun_fact TEXT,
      UNIQUE(matchup_id, round_number)
    )
  `;

  console.log("Deathmatch tables created.");
}

createTables().catch(console.error);
