import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Load .env.local manually
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sql = neon(process.env.DATABASE_URL);
const matchups = JSON.parse(readFileSync("content/deathmatch-matchups.json", "utf-8"));

async function seed() {
  for (const m of matchups) {
    // Look up fighter IDs — try bw first, then any type
    let [fighterA] = await sql`
      SELECT id FROM celebrities WHERE name = ${m.fighter_a_name} AND photo_type = 'bw' LIMIT 1
    `;
    if (!fighterA) {
      [fighterA] = await sql`SELECT id FROM celebrities WHERE name = ${m.fighter_a_name} LIMIT 1`;
    }

    let [fighterB] = await sql`
      SELECT id FROM celebrities WHERE name = ${m.fighter_b_name} AND photo_type = 'bw' LIMIT 1
    `;
    if (!fighterB) {
      [fighterB] = await sql`SELECT id FROM celebrities WHERE name = ${m.fighter_b_name} LIMIT 1`;
    }

    if (!fighterA?.id || !fighterB?.id) {
      console.warn(`SKIP: ${m.slug} — fighter not found (a=${m.fighter_a_name}:${fighterA?.id}, b=${m.fighter_b_name}:${fighterB?.id})`);
      continue;
    }

    // Upsert matchup
    const [matchup] = await sql`
      INSERT INTO matchups (slug, fighter_a_id, fighter_b_id, fighter_a_nickname, fighter_b_nickname, tagline, matchup_type, difficulty, sort_order)
      VALUES (${m.slug}, ${fighterA.id}, ${fighterB.id}, ${m.fighter_a_nickname}, ${m.fighter_b_nickname}, ${m.tagline}, ${m.matchup_type}, ${m.difficulty}, ${matchups.indexOf(m)})
      ON CONFLICT (slug) DO UPDATE SET
        fighter_a_id = EXCLUDED.fighter_a_id,
        fighter_b_id = EXCLUDED.fighter_b_id,
        fighter_a_nickname = EXCLUDED.fighter_a_nickname,
        fighter_b_nickname = EXCLUDED.fighter_b_nickname,
        tagline = EXCLUDED.tagline,
        matchup_type = EXCLUDED.matchup_type,
        difficulty = EXCLUDED.difficulty,
        sort_order = EXCLUDED.sort_order
      RETURNING id
    `;

    // Delete old rounds and insert fresh
    await sql`DELETE FROM matchup_rounds WHERE matchup_id = ${matchup.id}`;

    for (const r of m.rounds) {
      await sql`
        INSERT INTO matchup_rounds (matchup_id, round_number, round_label, question_text, correct_answer, explanation, fun_fact)
        VALUES (${matchup.id}, ${r.round_number}, ${r.round_label}, ${r.question_text}, ${r.correct_answer}, ${r.explanation}, ${r.fun_fact})
      `;
    }

    console.log(`Seeded: ${m.slug} (${m.rounds.length} rounds)`);
  }

  console.log("Done.");
}

seed().catch(console.error);
