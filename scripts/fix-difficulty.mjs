import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sql = neon(process.env.DATABASE_URL);

const ratings = {
  "stallone-vs-schwarzenegger": 1,
  "senna-vs-prost": 2,
  "grace-jones-vs-mr-t": 2,
  "don-johnson-vs-tom-selleck": 2,
  "mcenroe-vs-borg": 2,
  "pele-vs-maradona": 1,
  "madonna-vs-debbie-harry": 1,
  "elton-john-vs-freddie-mercury": 1,
  "bruce-lee-vs-chuck-norris": 1,
  "becker-vs-agassi": 2,
  "eazy-e-vs-ice-cube": 2,
  "diana-ross-vs-whitney-houston": 1,
  "escobar-vs-hefner": 2,
  "van-damme-vs-lundgren": 2,
  "jagger-vs-stewart": 1,
  "snoop-dogg-vs-dr-dre": 1,
  "monroe-vs-andress": 2,
  "run-dmc-vs-wu-tang": 2,
  "jordan-vs-erving": 2,
  "marley-vs-hendrix": 1,
  "ali-vs-chamberlain": 1,
  "best-vs-gascoigne": 2,
  "ronaldo-vs-higuita": 3,
  "ashe-vs-noah": 3,
  "beamon-vs-fosbury": 3,
  "wham-vs-bee-gees": 1,
  "pacino-vs-hoffman": 1,
  "travolta-vs-eastwood": 1,
  "cher-vs-tina-turner": 1,
  "murphy-vs-belushi": 1,
  "mcqueen-vs-newman": 2,
  "pfeiffer-vs-fawcett": 2,
  "winehouse-vs-badu": 3,
  "bias-vs-ewing": 3,
  "hayes-vs-white": 3,
  "beastie-boys-vs-tribe": 2,
  "queen-vs-acdc": 1,
  "summer-vs-harry": 2,
  "grier-vs-bardot": 2,
  "campbell-vs-nielsen": 2,
  "tate-vs-bardot": 3,
  "ll-cool-j-vs-snoop-dogg": 1,
  "stallone-vs-bruce-lee": 1,
  "jordan-vs-ali": 1,
  "grandmaster-flash-vs-lee-perry": 3,
  "pacino-vs-johnson-scarface-miami": 2,
  "johnson-vs-murphy-cops": 1,
  "mercury-vs-jagger": 1,
  "hayes-vs-moroder": 3,
  "campbell-vs-jones": 2,
};

async function fix() {
  for (const [slug, diff] of Object.entries(ratings)) {
    await sql`UPDATE matchups SET difficulty = ${diff} WHERE slug = ${slug}`;
  }
  console.log(`Updated ${Object.keys(ratings).length} matchups.`);

  const counts = await sql`
    SELECT difficulty, COUNT(*) as count FROM matchups GROUP BY difficulty ORDER BY difficulty
  `;
  console.log("\nDifficulty counts:");
  for (const row of counts) {
    const stars = "★".repeat(row.difficulty) + "☆".repeat(3 - row.difficulty);
    console.log(`  ${stars} (${row.difficulty}): ${row.count}`);
  }
}

fix().catch(console.error);
