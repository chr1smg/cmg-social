#!/usr/bin/env node
// Catches the failure nobody was watching for: a row whose slot has PASSED and
// which still has not published. On 21-22 Sep 2026 a Bolton Warm & Dry row
// failed with Graph error 283 every fifteen minutes for a full day and the only
// thing that noticed was Chris looking at the page. Queue-depth watches whether
// posts EXIST. This watches whether they GO OUT.
const fs = require('fs');
const GRACE_MIN = Number(process.env.GRACE_MIN || 90);
const week = JSON.parse(fs.readFileSync(process.argv[2] || 'publisher/week.json', 'utf8'));
const cutoff = Date.now() - GRACE_MIN * 60000;

const stuck = (week.posts || []).filter(p => {
  const slot = new Date(String(p.slot || '').replace(' ', 'T'));
  if (isNaN(slot) || slot.getTime() > cutoff) return false;
  const fb = (p.facebook || {}).status || '';
  const ig = (p.instagram || {}).status || '';
  const fbDone = fb === 'published' || fb === 'skipped';
  const igDone = ig === 'published' || ig === 'skipped';
  return !(fbDone && igDone);
});

if (!stuck.length) { console.log(`No stuck posts. Every slot older than ${GRACE_MIN} minutes has gone out.`); process.exit(0); }

console.error(`${stuck.length} POST(S) OVERDUE AND NOT PUBLISHED:\n`);
for (const p of stuck) {
  const page = (p.facebook || {}).page || 'cmg';
  console.error(`  post ${p.id}  slot ${p.slot}  page ${page}`);
  console.error(`     facebook: ${JSON.stringify(p.facebook || {})}`);
  console.error(`     instagram: ${JSON.stringify(p.instagram || {})}`);
}
console.error('\nCheck publisher/publish-log.jsonl for the error on these rows.');
process.exit(1);
