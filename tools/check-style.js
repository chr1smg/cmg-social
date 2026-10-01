#!/usr/bin/env node
// Style rotation guard. "Vary the styles" was a rule in a file; thirteen identical
// timelines got queued anyway. This turns the rule into a check.
//   - no two consecutive posts on a page share a style
//   - no style appears more than MAX_PER_WEEK times in any 7-day window, per page
//   - every future row must carry a style tag at all
const fs = require('fs');
const MAX_PER_WEEK = Number(process.env.MAX_PER_WEEK || 2);
const week = JSON.parse(fs.readFileSync(process.argv[2] || 'publisher/week.json', 'utf8'));
const now = Date.now();
const rows = (week.posts || [])
  .map(p => ({ id: p.id, slot: new Date(String(p.slot||'').replace(' ','T')), style: p.style,
               page: (p.facebook||{}).page || 'cmg', done: ((p.facebook||{}).status==='published') }))
  .filter(r => !isNaN(r.slot) && r.slot.getTime() > now)
  .sort((a,b) => a.slot - b.slot);

const problems = [];
for (const page of [...new Set(rows.map(r => r.page))]) {
  const pr = rows.filter(r => r.page === page);
  pr.forEach(r => { if (!r.style) problems.push(`post ${r.id} (${page}, ${r.slot.toISOString().slice(0,10)}) has NO style tag`); });
  for (let i = 1; i < pr.length; i++)
    if (pr[i].style && pr[i].style === pr[i-1].style)
      problems.push(`${page}: post ${pr[i-1].id} and post ${pr[i].id} are back-to-back "${pr[i].style}"`);
  for (let i = 0; i < pr.length; i++) {
    const end = pr[i].slot.getTime() + 7*86400000;
    const win = pr.filter(r => r.slot.getTime() >= pr[i].slot.getTime() && r.slot.getTime() < end && r.style === pr[i].style);
    if (pr[i].style && win.length > MAX_PER_WEEK)
      problems.push(`${page}: "${pr[i].style}" appears ${win.length}x in the week from ${pr[i].slot.toISOString().slice(0,10)} (posts ${win.map(w=>w.id).join(', ')})`);
  }
}
const uniq = [...new Set(problems)];
console.log(`Checked ${rows.length} future posts across ${new Set(rows.map(r=>r.page)).size} page(s).`);
if (!uniq.length) { console.log('Style rotation OK.'); process.exit(0); }
console.error(`\nSTYLE ROTATION BROKEN — ${uniq.length} problem(s):`);
uniq.forEach(p => console.error('  ' + p));
process.exit(1);
