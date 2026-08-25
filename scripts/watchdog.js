#!/usr/bin/env node
/**
 * CMG watchdog — the rule the old watchdog was missing:
 * if NOTHING has published for 36 hours, that is an alarm in itself,
 * whatever the checklists say. A failing run here makes GitHub email Chris.
 * Also flags any approved post still open 2+ hours after its slot.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const P = (f) => path.join(__dirname, '..', 'publisher', f);

function ukToEpoch(slot) {
  const m = slot.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  const [, Y, Mo, D, H, Mi] = m.map(Number);
  const off = (t) => {
    const tz = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', timeZoneName: 'longOffset' })
      .formatToParts(t).find((p) => p.type === 'timeZoneName').value;
    const mm = tz.match(/GMT([+-])(\d{2}):(\d{2})/);
    return mm ? (mm[1] === '-' ? -1 : 1) * (Number(mm[2]) * 60 + Number(mm[3])) : 0;
  };
  let g = Date.UTC(Y, Mo - 1, D, H, Mi);
  for (let i = 0; i < 2; i++) g = Date.UTC(Y, Mo - 1, D, H, Mi) - off(g) * 60000;
  return Math.floor(g / 1000);
}

const problems = [];
const now = Math.floor(Date.now() / 1000);

// 1) When did anything last actually publish (proof recorded)?
let lastPublish = 0;
if (fs.existsSync(P('publish-log.jsonl'))) {
  for (const line of fs.readFileSync(P('publish-log.jsonl'), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      const e = JSON.parse(line);
      if ((e.result === 'published' || e.result === 'scheduled') && e.at) {
        lastPublish = Math.max(lastPublish, Math.floor(new Date(e.at).getTime() / 1000));
      }
    } catch { /* skip bad lines */ }
  }
}
const week = JSON.parse(fs.readFileSync(P('week.json'), 'utf8'));
for (const post of week.posts || []) {
  for (const plat of ['facebook', 'instagram']) {
    const s = post[plat] || {};
    if (s.status === 'published' && s.publishedAt) {
      // publishedAt is a UK display string; slot is close enough for a 36h check
      lastPublish = Math.max(lastPublish, ukToEpoch(post.slot));
    }
  }
}
const H36 = 36 * 3600;
if (!lastPublish) {
  problems.push('This system has never published anything yet.'
    + (week.approved === true ? ' The batch IS approved — so something is wrong: check the publish runs.'
                              : ' The batch is not yet approved — approval and the Meta token are the two missing pieces.'));
} else if (now - lastPublish > H36) {
  const days = ((now - lastPublish) / 86400).toFixed(1);
  problems.push(`Nothing has published for ${days} days. The page is quiet. `
    + (week.approved === true ? 'The batch is approved, so this is a FAILURE — read the publish run logs.'
                              : 'The batch is awaiting approval — approve it or the silence continues.'));
}

// 2) Approved posts still open 2h+ past their slot
if (week.approved === true) {
  for (const post of week.posts || []) {
    const slotS = ukToEpoch(post.slot);
    if (now < slotS + 2 * 3600) continue;
    const fb = post.facebook || {}, ig = post.instagram || {};
    if (fb.status !== 'published' && fb.status !== 'scheduled') {
      problems.push(`post ${post.id} (${post.slot}) Facebook still open 2h+ past its slot.`);
    }
    if (ig.status !== 'published' && ig.status !== 'skipped') {
      problems.push(`post ${post.id} (${post.slot}) Instagram still open 2h+ past its slot.`);
    }
  }
}

if (problems.length) {
  console.error('WATCHDOG ALARM:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('Watchdog: all genuinely clear — something has published within 36h and nothing due is open.');
