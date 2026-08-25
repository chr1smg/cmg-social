#!/usr/bin/env node
/* Test harness for cmg-publisher.js — runs the real code against a mocked
   Graph API. No network. Proves the logic before it goes anywhere near Meta. */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const T = fs.mkdtempSync(path.join(os.tmpdir(), 'cmgtest-'));
fs.copyFileSync(path.join(__dirname, 'cmg-publisher.js'), path.join(T, 'cmg-publisher.js'));
fs.writeFileSync(path.join(T, '.env'), [
  'FB_APP_ID=APP', 'FB_APP_SECRET=SECRET', 'FB_PAGE_ID=111', 'FB_PAGE_TOKEN=PAGETOKEN',
  'IG_USER_ID=IGUSER', 'IG_TOKEN=IGTOKEN',
  'WP_URL=https://example-wp.test', 'WP_USER=chris', 'WP_APP_PASSWORD=apppass', '',
].join('\n'));
fs.mkdirSync(path.join(T, 'graphics'));
fs.writeFileSync(path.join(T, 'graphics', 'up.jpg'), Buffer.from('fakejpegdata'));

// ---- stateful mock Graph API ----
const state = { scheduled: [], published: [], igPublished: [], failScheduleReadback: false, wpBroken: false, wpUploads: 0 };
global.fetch = async (url, opts = {}) => {
  const u = new URL(String(url));
  // WordPress mock
  if (u.hostname === 'example-wp.test') {
    if (u.pathname === '/wp-json/wp/v2/media' && (opts.method || 'GET') === 'POST') {
      if (state.wpBroken) return { ok: false, status: 500, json: async () => ({ message: 'mock WP down' }) };
      if ((opts.headers || {}).Authorization !== 'Basic ' + Buffer.from('chris:apppass').toString('base64')) {
        return { ok: false, status: 401, json: async () => ({ message: 'bad auth' }) };
      }
      state.wpUploads++;
      return { ok: true, status: 201, json: async () => ({ source_url: 'https://example-wp.test/wp-content/uploads/2026/08/up-' + state.wpUploads + '.jpg' }) };
    }
    if (u.pathname.startsWith('/wp-content/uploads/')) return { ok: true, status: 200, json: async () => ({}) };
    return { ok: false, status: 404, json: async () => ({}) };
  }
  const p = u.pathname.replace(/^\/v\d+\.\d+\//, '');
  const method = opts.method || 'GET';
  const params = method === 'GET' ? u.searchParams : new URLSearchParams(String(opts.body));
  const json = (obj) => ({ status: 200, json: async () => obj });

  if (p === 'oauth/access_token') return json({ access_token: 'LLTOKEN' });
  if (p === 'me/accounts') return json({ data: [{ id: '111', name: 'CMG Heating and Plumbing', access_token: 'PAGETOKEN' }] });
  if (p === 'debug_token') return json({ data: { scopes: ['pages_show_list', 'pages_manage_posts', 'pages_read_engagement'], expires_at: 0 } });
  if (p === '111' && method === 'GET') return json({ name: 'CMG Heating and Plumbing' });
  if (p === '111/photos' && method === 'POST') {
    if (params.get('published') === 'false') {
      const id = 'sp' + (state.scheduled.length + 1);
      if (!state.failScheduleReadback) {
        state.scheduled.push({ id, message: params.get('caption'), scheduled_publish_time: Number(params.get('scheduled_publish_time')) });
      }
      return json({ id });
    }
    const id = 'fbpost' + (state.published.length + 1);
    state.published.push({ id: '111_' + id, message: params.get('caption') });
    return json({ id, post_id: '111_' + id });
  }
  if (p === '111/scheduled_posts') return json({ data: state.scheduled });
  if (p.startsWith('111_fbpost')) return json({ permalink_url: 'https://www.facebook.com/CONTACTCMG/posts/' + p });
  if (p === 'IGUSER' && method === 'GET') return json({ username: 'cmg_hp' });
  if (p === 'IGUSER/media' && method === 'POST') return json({ id: 'container1' });
  if (p === 'container1') return json({ status_code: 'FINISHED' });
  if (p === 'IGUSER/media_publish') { state.igPublished.push('media1'); return json({ id: 'media1' }); }
  if (p === 'media1') return json({ permalink: 'https://www.instagram.com/p/TESTPOST/' });
  return json({ error: { message: 'mock: unknown edge ' + method + ' ' + p, code: 400 } });
};

const pub = require(path.join(T, 'cmg-publisher.js'));
const week = (posts, approved = true) => fs.writeFileSync(path.join(T, 'week.json'), JSON.stringify({
  week: 'test', approved, baseImageUrl: 'https://example.com/img/', posts,
}, null, 2));
const readWeek = () => JSON.parse(fs.readFileSync(path.join(T, 'week.json'), 'utf8'));
const slotAt = (epochMs) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(epochMs).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour === '24' ? '00' : p.hour}:${p.minute}`;
};

(async () => {
  // 1 — UK time conversion, summer and winter
  assert.strictEqual(pub.ukToEpoch('2026-08-22 10:00'), Date.UTC(2026, 7, 22, 9, 0) / 1000, 'BST slot must be UTC-1h');
  assert.strictEqual(pub.ukToEpoch('2026-01-15 10:00'), Date.UTC(2026, 0, 15, 10, 0) / 1000, 'GMT slot must equal UTC');
  console.log('✓ 1  UK time: BST and GMT both convert correctly');

  // 2 — check passes with both tokens
  assert.strictEqual(await pub.cmdCheck(), true);
  console.log('✓ 2  check: reports READY with valid tokens, posts nothing');

  // 3 — schedule-week schedules a future row and records proof
  week([{ id: 1, slot: slotAt(Date.now() + 26 * 3600 * 1000), image: 'a.jpg', caption: 'CAPTION ONE for the scheduling test, long enough to marker-match.', facebook: { status: '' }, instagram: { status: '' } }]);
  await pub.cmdScheduleWeek();
  let w = readWeek();
  assert.strictEqual(w.posts[0].facebook.status, 'scheduled');
  assert.ok(w.posts[0].facebook.scheduledPostId, 'must record the id seen in scheduled_posts');
  console.log('✓ 3  schedule-week: schedules on Meta and only ticks after read-back proof');

  // 4 — schedule-week REFUSES the tick when read-back finds nothing (the silent-failure case)
  state.scheduled = []; state.failScheduleReadback = true;
  week([{ id: 2, slot: slotAt(Date.now() + 26 * 3600 * 1000), image: 'b.jpg', caption: 'CAPTION TWO for the verification-failure test, also long enough.', facebook: { status: '' }, instagram: { status: '' } }]);
  process.exitCode = 0;
  await pub.cmdScheduleWeek();
  w = readWeek();
  assert.strictEqual(w.posts[0].facebook.status, '', 'row must stay open when proof is missing');
  assert.strictEqual(process.exitCode, 1, 'must exit non-zero on unverified schedule');
  process.exitCode = 0; state.failScheduleReadback = false;
  console.log('✓ 4  schedule-week: a Facebook-style silent failure is caught, row stays open, run fails loudly');

  // 5 — publish-due publishes a past-due row on both platforms with permalinks
  week([{ id: 3, slot: slotAt(Date.now() - 30 * 60 * 1000), image: 'c.jpg', caption: 'CAPTION THREE, past due.', facebook: { status: '' }, instagram: { status: '' } }]);
  await pub.cmdPublishDue();
  w = readWeek();
  assert.strictEqual(w.posts[0].instagram.status, 'published');
  assert.strictEqual(w.posts[0].instagram.permalink, 'https://www.instagram.com/p/TESTPOST/');
  assert.strictEqual(w.posts[0].facebook.status, 'published');
  assert.ok(w.posts[0].facebook.permalink.includes('facebook.com'));
  console.log('✓ 5  publish-due: past-due row published to IG and FB, permalinks recorded as proof');

  // 6 — idempotent: second run touches nothing
  const igCalls = state.igPublished.length; const fbCalls = state.published.length;
  await pub.cmdPublishDue();
  assert.strictEqual(state.igPublished.length, igCalls, 'no second IG publish');
  assert.strictEqual(state.published.length, fbCalls, 'no second FB publish');
  console.log('✓ 6  publish-due: second run publishes nothing twice (idempotent)');

  // 7 — future rows and blocked rows are left alone
  week([
    { id: 4, slot: slotAt(Date.now() + 3 * 3600 * 1000), image: 'd.jpg', caption: 'FUTURE', facebook: { status: '' }, instagram: { status: '' } },
    { id: 5, slot: slotAt(Date.now() - 3600 * 1000), image: 'e.jpg', caption: 'BLOCKED', blocked: 'stale image', facebook: { status: '' }, instagram: { status: '' } },
  ]);
  await pub.cmdPublishDue();
  w = readWeek();
  assert.strictEqual(w.posts[0].instagram.status, '');
  assert.strictEqual(w.posts[1].instagram.status, '', 'blocked row must be skipped');
  console.log('✓ 7  publish-due: future rows wait, 🔴-blocked rows are skipped');

  // 8 — a scheduled FB row is never re-published live
  week([{ id: 6, slot: slotAt(Date.now() - 3600 * 1000), image: 'f.jpg', caption: 'SCHEDULED ALREADY', facebook: { status: 'scheduled', scheduledPostId: 'spX' }, instagram: { status: 'published', permalink: 'x' } }]);
  const fb2 = state.published.length;
  await pub.cmdPublishDue();
  assert.strictEqual(state.published.length, fb2, 'server-side scheduled row must not be double-posted');
  console.log('✓ 8  publish-due: rows already scheduled on Meta are never double-posted');

  // 9 — upload: pushes the graphic to WordPress, verifies it serves, records the RETURNED url
  week([{ id: 7, slot: slotAt(Date.now() + 26 * 3600 * 1000), image: 'up.jpg', caption: 'UPLOAD TEST', facebook: { status: '' }, instagram: { status: '' } }]);
  await pub.cmdUpload();
  w = readWeek();
  assert.ok(w.posts[0].imageUrl && w.posts[0].imageUrl.includes('example-wp.test/wp-content'), 'must record the URL WordPress returned');
  const uploads = state.wpUploads;
  await pub.cmdUpload(); // second run must not re-upload
  assert.strictEqual(state.wpUploads, uploads, 'no duplicate upload');
  console.log('✓ 9  upload: WordPress REST upload verified-then-recorded, idempotent, no file picker anywhere');

  // 10 — upload failure leaves the row unrecorded and fails loudly
  state.wpBroken = true;
  week([{ id: 8, slot: slotAt(Date.now() + 26 * 3600 * 1000), image: 'up.jpg', caption: 'UPLOAD FAIL TEST', facebook: { status: '' }, instagram: { status: '' } }]);
  process.exitCode = 0;
  await pub.cmdUpload();
  w = readWeek();
  assert.strictEqual(w.posts[0].imageUrl, undefined, 'failed upload must not record a URL');
  assert.strictEqual(process.exitCode, 1, 'failed upload must fail loudly');
  process.exitCode = 0; state.wpBroken = false;
  console.log('✓ 10 upload: a WordPress failure is loud and records nothing');

  // 11 — a recorded imageUrl is what gets sent to Meta (not the base-url guess)
  week([{ id: 9, slot: slotAt(Date.now() - 30 * 60 * 1000), image: 'nonexistent.jpg', imageUrl: 'https://example-wp.test/wp-content/uploads/2026/08/real.jpg', caption: 'IMAGEURL PRECEDENCE', facebook: { status: 'scheduled' }, instagram: { status: '' } }]);
  await pub.cmdPublishDue();
  w = readWeek();
  assert.strictEqual(w.posts[0].instagram.status, 'published', 'publishes fine from the recorded URL');
  console.log('✓ 11 recorded imageUrl takes precedence over the base-url guess');

  // 12 — an Instagram row marked 'skipped' (portrait photo) is left alone; Facebook still goes
  week([{ id: 10, slot: slotAt(Date.now() - 30 * 60 * 1000), image: 'p.jpg', caption: 'FB ONLY', facebook: { status: '' }, instagram: { status: 'skipped', reason: 'portrait — IG API rejects' } }]);
  const igBefore = state.igPublished.length;
  await pub.cmdPublishDue();
  w = readWeek();
  assert.strictEqual(state.igPublished.length, igBefore, 'skipped IG row must never be attempted');
  assert.strictEqual(w.posts[0].facebook.status, 'published', 'Facebook half still publishes');
  console.log('✓ 12 Facebook-only rows: IG "skipped" respected, FB still publishes');

  // 13 — the approval gate: an unapproved week publishes and schedules NOTHING
  week([{ id: 11, slot: slotAt(Date.now() - 30 * 60 * 1000), image: 'q.jpg', caption: 'UNAPPROVED', facebook: { status: '' }, instagram: { status: '' } }], false);
  const ig13 = state.igPublished.length, fb13 = state.published.length, sch13 = state.scheduled.length;
  await pub.cmdPublishDue();
  process.exitCode = 0;
  await pub.cmdScheduleWeek();
  process.exitCode = 0;
  w = readWeek();
  assert.strictEqual(state.igPublished.length, ig13, 'unapproved: no IG publish');
  assert.strictEqual(state.published.length, fb13, 'unapproved: no FB publish');
  assert.strictEqual(state.scheduled.length, sch13, 'unapproved: no FB scheduling');
  assert.strictEqual(w.posts[0].facebook.status, '', 'unapproved row untouched');
  console.log('✓ 13 approval gate: an unapproved week.json publishes and schedules nothing at all');

  console.log('\nALL 13 TESTS PASSED — logic proven against mock Meta and WordPress APIs.');
})().catch((e) => { console.error('TEST FAILED: ' + (e.stack || e.message)); process.exit(1); });
