import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const sql = neon(process.env.DATABASE_URL);

const categories = {
  // MUSIC (17)
  "madonna-vs-debbie-harry": "music",
  "elton-john-vs-freddie-mercury": "music",
  "eazy-e-vs-ice-cube": "music",
  "jagger-vs-stewart": "music",
  "diana-ross-vs-whitney-houston": "music",
  "snoop-dogg-vs-dr-dre": "music",
  "wham-vs-bee-gees": "music",
  "cher-vs-tina-turner": "music",
  "winehouse-vs-badu": "music",
  "hayes-vs-white": "music",
  "beastie-boys-vs-tribe": "music",
  "queen-vs-acdc": "music",
  "summer-vs-harry": "music",
  "ll-cool-j-vs-snoop-dogg": "music",
  "grandmaster-flash-vs-lee-perry": "music",
  "mercury-vs-jagger": "music",
  "hayes-vs-moroder": "music",

  // FILM (13)
  "stallone-vs-schwarzenegger": "film",
  "don-johnson-vs-tom-selleck": "film",
  "bruce-lee-vs-chuck-norris": "film",
  "van-damme-vs-lundgren": "film",
  "monroe-vs-andress": "film",
  "pacino-vs-hoffman": "film",
  "travolta-vs-eastwood": "film",
  "mcqueen-vs-newman": "film",
  "pfeiffer-vs-fawcett": "film",
  "murphy-vs-belushi": "film",
  "grier-vs-bardot": "film",
  "tate-vs-bardot": "film",
  "pacino-vs-johnson-scarface-miami": "film",

  // ATHLETE (11)
  "senna-vs-prost": "athlete",
  "mcenroe-vs-borg": "athlete",
  "becker-vs-agassi": "athlete",
  "pele-vs-maradona": "athlete",
  "jordan-vs-erving": "athlete",
  "ali-vs-chamberlain": "athlete",
  "best-vs-gascoigne": "athlete",
  "ronaldo-vs-higuita": "athlete",
  "ashe-vs-noah": "athlete",
  "beamon-vs-fosbury": "athlete",
  "bias-vs-ewing": "athlete",

  // CROSSOVER (9)
  "grace-jones-vs-mr-t": "crossover",
  "escobar-vs-hefner": "crossover",
  "marley-vs-hendrix": "crossover",
  "campbell-vs-nielsen": "crossover",
  "stallone-vs-bruce-lee": "crossover",
  "jordan-vs-ali": "crossover",
  "johnson-vs-murphy-cops": "crossover",
  "campbell-vs-jones": "crossover",
  "run-dmc-vs-wu-tang": "crossover",
};

async function fix() {
  let updated = 0;
  for (const [slug, type] of Object.entries(categories)) {
    const result = await sql`
      UPDATE matchups SET matchup_type = ${type} WHERE slug = ${slug}
    `;
    console.log(`${slug} → ${type}`);
    updated++;
  }
  console.log(`\nUpdated ${updated} matchups.`);

  // Verify
  const counts = await sql`
    SELECT matchup_type, COUNT(*) as count FROM matchups GROUP BY matchup_type ORDER BY matchup_type
  `;
  console.log("\nCategory counts:");
  for (const row of counts) {
    console.log(`  ${row.matchup_type.toUpperCase()}: ${row.count}`);
  }
}

fix().catch(console.error);
