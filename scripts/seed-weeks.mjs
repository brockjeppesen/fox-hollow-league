// Seed the Fox Hollow Men's Club 2026 schedule into Convex
// Run with: node scripts/seed-weeks.mjs

const CONVEX_URL = "https://cheery-lemming-181.convex.cloud";

const schedule = [
  { date: "2026-01-23", format: "Winter Trip – 4 Man Scramble", status: "published" },
  { date: "2026-01-24", format: "Winter Trip – 2 Man Shamble", status: "published" },
  { date: "2026-01-25", format: "Winter Trip – Individual", status: "published" },
  { date: "2026-03-10", format: "Membership Meeting", status: "published" },
  { date: "2026-03-28", format: "Icebreaker – 4 Man Scramble", status: "published" },
  { date: "2026-03-31", format: "Individual Stroke Play – Front 9", status: "published" },
  { date: "2026-04-07", format: "Individual Stableford – Back 9", status: "published" },
  { date: "2026-04-14", format: "Individual Stroke Play – Front 9", status: "open", deadlineOffset: -1 }, // closes Apr 13 6pm
  { date: "2026-04-18", format: "2-Man Shamble (Best Ball) – Jason Randall Memorial", status: "open", deadlineOffset: -3 }, // closes Apr 15 6pm
  { date: "2026-04-21", format: "Individual Points – Back 9", status: "draft" },
  { date: "2026-04-28", format: "Individual Chicago – Front 9", status: "draft" },
  { date: "2026-05-02", format: "2-Man Best Ball (Partner will be picked)", status: "draft" },
  { date: "2026-05-05", format: "Individual Stroke Play – Back 9", status: "draft" },
  { date: "2026-05-12", format: "2-Man Stableford (Pick your Partner) – Front 9", status: "draft" },
  { date: "2026-05-19", format: "Red, White & Blue – Back 9", status: "draft" },
  { date: "2026-05-23", format: "Individual Chicago", status: "draft" },
  { date: "2026-05-26", format: "2-Man Alternate Shot – Front 9", status: "draft" },
  { date: "2026-06-02", format: "2-Man Best Ball (Pick your Partner) – Back 9", status: "draft" },
  { date: "2026-06-06", format: "4-Man Shamble (Count 3)", status: "draft" },
  { date: "2026-06-09", format: "Individual Points – Front 9", status: "draft" },
  { date: "2026-06-16", format: "Individual Stroke Play – Back 9", status: "draft" },
  { date: "2026-06-23", format: "1-Man Scramble – Front 9", status: "draft" },
  { date: "2026-06-27", format: "2-Man 6-6-6", status: "draft" },
  { date: "2026-06-30", format: "Red, White & Blue – Back 9", status: "draft" },
  { date: "2026-07-07", format: "Individual Stableford – Front 9", status: "draft" },
  { date: "2026-07-14", format: "2-Man Chicago (Blind Draw) – Back 9", status: "draft" },
  { date: "2026-07-21", format: "Individual Points – Front 9", status: "draft" },
  { date: "2026-07-24", format: "Ringer Day 1", status: "draft" },
  { date: "2026-07-25", format: "Ringer Day 2", status: "draft" },
  { date: "2026-07-26", format: "Ringer Day 3", status: "draft" },
  { date: "2026-07-28", format: "3-Club Plus Putter Challenge (White Tees) – Back 9", status: "draft" },
  { date: "2026-08-04", format: "Individual StepBack – Front 9", status: "draft" },
  { date: "2026-08-11", format: "Individual Stroke Play – Back 9", status: "draft" },
  { date: "2026-08-15", format: "4-Man Scramble (Blue, White, Gold, Red)", status: "draft" },
  { date: "2026-08-18", format: "2-Man Shamble (Pick your Partner) – Front 9", status: "draft" },
  { date: "2026-08-25", format: "Individual Stableford – Back 9", status: "draft" },
  { date: "2026-08-28", format: "Club Championship Day 1 – Afternoon Start", status: "draft" },
  { date: "2026-08-29", format: "Club Championship – Mandatory Day", status: "draft" },
  { date: "2026-08-30", format: "Club Championship Day 3", status: "draft" },
  { date: "2026-09-01", format: "2-Man Best Ball – Front 9", status: "draft" },
  { date: "2026-09-08", format: "3-Club Challenge (No Putter) – Back 9", status: "draft" },
  { date: "2026-09-15", format: "Individual Stableford – Front 9", status: "draft" },
  { date: "2026-09-22", format: "Individual Points – Back 9", status: "draft" },
  { date: "2026-09-26", format: "Fox Cup – Fourball/Best Ball/Singles Matches", status: "draft" },
  { date: "2026-09-27", format: "Fox Cup – Foursomes/Alternate Shot Matches", status: "draft" },
  { date: "2026-09-29", format: "2-Man Scramble – Front 9", status: "draft" },
  { date: "2026-10-06", format: "No Play – Aeration", status: "draft" },
  { date: "2026-10-13", format: "Gold Tees Only – Back 9", status: "draft" },
  { date: "2026-10-20", format: "Individual Chicago – Front 9", status: "draft" },
  { date: "2026-10-27", format: "Individual Stroke Play – Back 9", status: "draft" },
];

function getDeadline(playDateStr, offsetDays = -4) {
  const d = new Date(playDateStr + "T18:00:00-06:00"); // 6pm MDT
  d.setDate(d.getDate() + offsetDays);
  return d.getTime();
}

async function createWeek(round) {
  const playDate = new Date(round.date + "T08:00:00-06:00").getTime();
  const deadline = round.deadlineOffset !== undefined
    ? getDeadline(round.date, round.deadlineOffset)
    : getDeadline(round.date, -4); // default: closes 4 days before at 6pm

  const body = {
    path: "weeks:create",
    args: [{ playDate, deadline, format: round.format, status: round.status }],
  };

  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.status === "success") {
    console.log(`✓ ${round.date} — ${round.format}`);
  } else {
    console.log(`✗ ${round.date} — ${JSON.stringify(data)}`);
  }
}

console.log("Seeding Fox Hollow Men's Club 2026 schedule...\n");
for (const round of schedule) {
  await createWeek(round);
  await new Promise(r => setTimeout(r, 100)); // small delay to avoid rate limiting
}
console.log("\nDone!");
