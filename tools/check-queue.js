#!/usr/bin/env node
// Queue-depth alarm. The publisher can post what it has; it cannot notice
// that it is about to run out. Weeks 2 and 3 ended with silent weekends
// because nobody was told the well was low. This is the thing that tells us.
const fs = require('fs');
const MIN_POSTS = Number(process.env.MIN_POSTS || 8);
const MIN_DAYS  = Number(process.env.MIN_DAYS  || 5);

const week = JSON.parse(fs.readFileSync(process.argv[2] || 'publisher/week.json', 'utf8'));
const now = new Date();

const future = (week.posts || []).filter(p => {
  const fb = (p.facebook || {}).status || '';
  const ig = (p.instagram || {}).status || '';
  if (fb === 'published' && (ig === 'published' || ig === 'skipped')) return false;
  const slot = new Date(String(p.slot || '').replace(' ', 'T'));
  return !isNaN(slot) && slot > now;
});

future.sort((a, b) => String(a.slot).localeCompare(String(b.slot)));
const last = future.length ? new Date(String(future[future.length - 1].slot).replace(' ', 'T')) : now;
const daysLeft = Math.max(0, Math.round((last - now) / 86400000));

console.log(`Queue depth: ${future.length} unpublished future posts, running ${daysLeft} days ahead.`);
future.slice(0, 5).forEach(p => console.log(`   next: ${p.slot}  ${p.image || ''}`));

if (future.length < MIN_POSTS || daysLeft < MIN_DAYS) {
  console.error(`\nQUEUE RUNNING LOW — ${future.length} posts / ${daysLeft} days left.`);
  console.error(`Threshold is ${MIN_POSTS} posts and ${MIN_DAYS} days. Build the next batch now.`);
  process.exit(1);
}
console.log('Queue is healthy.');
