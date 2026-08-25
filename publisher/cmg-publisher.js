#!/usr/bin/env node
/**
 * CMG Heating & Plumbing — social publisher v2
 * ------------------------------------------------
 * One file, no npm packages, Node 18+. Lives next to a `.env` and a `week.json`.
 *
 * WHY THIS EXISTS
 *   Browser automation of facebook.com failed seven times in one week, and
 *   twice reported success while publishing nothing. This replaces it with
 *   Meta's Graph API — the same way the Instagram connector already posts.
 *
 * THE ONE DESIGN RULE
 *   Nothing is reported as done until it has been read back off Meta's
 *   servers: a scheduled post must appear in the Page's scheduled_posts list,
 *   a published post must return its permalink. No proof, no tick.
 *
 * WHAT EACH PLATFORM ALLOWS (checked against Meta docs, Aug 2026)
 *   Facebook  — CAN be scheduled server-side: POST /{page}/photos with
 *               published=false + scheduled_publish_time (10 min – 6 months
 *               ahead). After that Meta publishes it; no PC needs to be on.
 *   Instagram — CANNOT be scheduled via the API at all. Containers expire in
 *               24 h; 100 API posts per rolling 24 h. So Instagram is
 *               published AT slot time by `publish-due`, run every 15 min by
 *               Windows Task Scheduler while the PC is awake (07:00–22:00).
 *
 * COMMANDS
 *   node cmg-publisher.js setup <short-lived-user-token>
 *       Exchanges for a long-lived token, finds the Page, saves FB_PAGE_ID +
 *       FB_PAGE_TOKEN (page tokens from a long-lived user token do not
 *       expire), then runs `check`. Needs FB_APP_ID + FB_APP_SECRET in .env.
 *   node cmg-publisher.js check
 *       Posts nothing. Proves both tokens and names what is missing.
 *   node cmg-publisher.js upload
 *       Uploads the week's graphics (from ./graphics/ or this folder) to the
 *       WordPress media library over its REST API — no browser, no file
 *       picker. Records each returned URL into week.json only after fetching
 *       it back and getting HTTP 200. WordPress auto-renames duplicates, and
 *       because the RETURNED url is what gets recorded, the old
 *       won't-overwrite-a-filename trap is gone. Needs WP_URL, WP_USER,
 *       WP_APP_PASSWORD in .env (an Application Password from the WordPress
 *       profile page — one-time, two minutes).
 *   node cmg-publisher.js schedule-week
 *       Schedules every open Facebook row of week.json on Meta's servers,
 *       verifies each against /scheduled_posts, writes the proof into
 *       week.json.
 *   node cmg-publisher.js publish-due
 *       Publishes anything whose slot has passed and is still open:
 *       Instagram rows via container→publish→permalink, and any Facebook row
 *       that never got scheduled (late catch-up, published live). Idempotent —
 *       a row with proof recorded is never touched again. This is the command
 *       Task Scheduler runs every 15 minutes.
 *   node cmg-publisher.js list-scheduled
 *       Shows what Meta's servers currently hold for the Page. The Planner in
 *       Business Suite should agree with this list.
 *   node cmg-publisher.js install-task
 *       Prints the exact schtasks command to register the 15-minute job.
 *
 * .env keys (same folder):
 *   FB_APP_ID, FB_APP_SECRET, FB_PAGE_ID, FB_PAGE_TOKEN
 *   IG_USER_ID (defaults to CMG's 17841453338052736)
 *   IG_TOKEN   (also accepts INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_TOKEN /
 *               ACCESS_TOKEN so the existing connector .env can be reused)
 *   WP_URL, WP_USER, WP_APP_PASSWORD  (WordPress media uploads)
 *   GRAPH_VERSION (default v23.0)
 */
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const ENV_PATH = path.join(DIR, '.env');
const WEEK_PATH = path.join(DIR, 'week.json');
const LOG_PATH = path.join(DIR, 'publish-log.jsonl');
const LOCK_PATH = path.join(DIR, '.publisher.lock');
const DEFAULT_IG_USER = '17841453338052736'; // @cmg_hp

// ---------- tiny .env ----------
function readEnv() {
  const env = {};
  if (fs.existsSync(ENV_PATH)) {
    for (const line of fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}
function writeEnv(updates) {
  const lines = fs.existsSync(ENV_PATH)
    ? fs.readFileSync(ENV_PATH, 'utf8').split(/\r?\n/)
    : [];
  for (const [k, v] of Object.entries(updates)) {
    const i = lines.findIndex((l) => l.match(new RegExp('^\\s*' + k + '\\s*=')));
    const entry = `${k}=${v}`;
    if (i >= 0) lines[i] = entry;
    else lines.push(entry);
  }
  fs.writeFileSync(ENV_PATH, lines.filter((l, i, a) => l !== '' || i < a.length - 1).join('\n') + '\n');
}
function cfg() {
  const e = readEnv();
  return {
    v: e.GRAPH_VERSION || 'v23.0',
    appId: e.FB_APP_ID || '',
    appSecret: e.FB_APP_SECRET || '',
    pageId: e.FB_PAGE_ID || '',
    pageToken: e.FB_PAGE_TOKEN || '',
    igUser: e.IG_USER_ID || e.INSTAGRAM_USER_ID || e.IG_ACCOUNT_ID || DEFAULT_IG_USER,
    igToken: e.IG_TOKEN || e.INSTAGRAM_ACCESS_TOKEN || e.INSTAGRAM_TOKEN || e.ACCESS_TOKEN || '',
    wpUrl: (e.WP_URL || '').replace(/\/+$/, ''),
    wpUser: e.WP_USER || '',
    wpPass: e.WP_APP_PASSWORD || '',
  };
}

// ---------- Graph API ----------
const BASE = () => `https://graph.facebook.com/${cfg().v}`;
async function graph(method, edge, params) {
  const url = new URL(`${BASE()}/${edge}`);
  const opts = { method };
  if (method === 'GET') {
    for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  } else {
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) body.set(k, v);
    opts.body = body;
  }
  const res = await fetch(url, opts);
  let data;
  try { data = await res.json(); } catch { data = { error: { message: `non-JSON response, HTTP ${res.status}` } }; }
  if (data.error) {
    const e = data.error;
    let msg = `Graph API error ${e.code || res.status}: ${e.message}`;
    if (e.code === 190) msg += '\n  → The access token has expired or been revoked. Re-run setup with a fresh token.';
    throw new Error(msg);
  }
  return data;
}

// ---------- UK time ----------
function ukOffsetMinutes(epochMs) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', timeZoneName: 'longOffset',
  }).formatToParts(epochMs);
  const tz = parts.find((p) => p.type === 'timeZoneName').value; // "GMT+01:00" or "GMT"
  const m = tz.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}
/** "2026-08-22 10:00" (UK wall clock) → epoch seconds */
function ukToEpoch(slot) {
  const m = slot.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) throw new Error(`Bad slot "${slot}" — use "YYYY-MM-DD HH:mm" UK time`);
  const [, Y, Mo, D, H, Mi] = m.map(Number);
  let guess = Date.UTC(Y, Mo - 1, D, H, Mi);
  for (let i = 0; i < 2; i++) guess = Date.UTC(Y, Mo - 1, D, H, Mi) - ukOffsetMinutes(guess) * 60000;
  return Math.floor(guess / 1000);
}
function ukNowString() {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short',
  }).format(Date.now());
}

// ---------- week.json ----------
function loadWeek() {
  if (!fs.existsSync(WEEK_PATH)) throw new Error(`No week.json found at ${WEEK_PATH}`);
  return JSON.parse(fs.readFileSync(WEEK_PATH, 'utf8'));
}
function saveWeek(week) {
  const tmp = WEEK_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(week, null, 2));
  fs.renameSync(tmp, WEEK_PATH);
}
function imageUrl(week, post) {
  if (post.imageUrl) return post.imageUrl; // recorded by `upload` — always wins
  if (/^https?:\/\//.test(post.image)) return post.image;
  return week.baseImageUrl.replace(/\/?$/, '/') + post.image;
}
function logLine(obj) {
  fs.appendFileSync(LOG_PATH, JSON.stringify({ at: new Date().toISOString(), ...obj }) + '\n');
}

// ---------- commands ----------
async function cmdSetup(shortToken) {
  const c = cfg();
  if (!c.appId || !c.appSecret) {
    throw new Error('FB_APP_ID and FB_APP_SECRET must be in .env first.\n' +
      '  App ID is 2311213529629434 (CMG Page Publisher). The secret is under\n' +
      '  App settings → Basic on developers.facebook.com — never share it anywhere else.');
  }
  if (!shortToken) throw new Error('Usage: node cmg-publisher.js setup <short-lived-user-token>');
  console.log('1/3 Exchanging for a long-lived user token…');
  const ll = await graph('GET', 'oauth/access_token', {
    grant_type: 'fb_exchange_token', client_id: c.appId,
    client_secret: c.appSecret, fb_exchange_token: shortToken,
  });
  console.log('2/3 Finding the Page…');
  const accounts = await graph('GET', 'me/accounts', {
    fields: 'id,name,access_token', access_token: ll.access_token,
  });
  const pages = accounts.data || [];
  if (!pages.length) throw new Error('The token can see no Pages. The grant must include pages_show_list for the CMG Page.');
  const page = pages.find((p) => /cmg/i.test(p.name)) || pages[0];
  writeEnv({ FB_PAGE_ID: page.id, FB_PAGE_TOKEN: page.access_token });
  console.log(`   Saved Page "${page.name}" (${page.id}). Page tokens from a long-lived exchange do not expire.`);
  console.log('3/3 Checking…');
  await cmdCheck();
}

async function cmdCheck() {
  const c = cfg();
  let ok = true;
  // Facebook
  if (!c.pageId || !c.pageToken) {
    ok = false;
    console.log('✗ Facebook: FB_PAGE_ID / FB_PAGE_TOKEN missing — run setup first.');
  } else {
    try {
      const page = await graph('GET', c.pageId, { fields: 'name', access_token: c.pageToken });
      let scopeNote = '';
      if (c.appId && c.appSecret) {
        const dbg = await graph('GET', 'debug_token', {
          input_token: c.pageToken, access_token: `${c.appId}|${c.appSecret}`,
        });
        const scopes = (dbg.data && dbg.data.scopes) || [];
        const need = ['pages_manage_posts', 'pages_read_engagement'];
        const missing = need.filter((s) => !scopes.includes(s));
        scopeNote = missing.length ? ` — MISSING scopes: ${missing.join(', ')}` : ' — scopes OK';
        if (missing.length) ok = false;
        if (dbg.data && dbg.data.expires_at) {
          scopeNote += dbg.data.expires_at === 0 ? ', never expires'
            : `, expires ${new Date(dbg.data.expires_at * 1000).toISOString().slice(0, 10)}`;
        }
      }
      console.log(`✓ Facebook: ready — will post to "${page.name}"${scopeNote}`);
    } catch (e) { ok = false; console.log(`✗ Facebook: ${e.message}`); }
  }
  // Instagram
  if (!c.igToken) {
    ok = false;
    console.log('✗ Instagram: no token found (IG_TOKEN / INSTAGRAM_ACCESS_TOKEN in .env).');
  } else {
    try {
      const ig = await graph('GET', c.igUser, { fields: 'username', access_token: c.igToken });
      console.log(`✓ Instagram: ready — will post to @${ig.username}`);
    } catch (e) { ok = false; console.log(`✗ Instagram: ${e.message}`); }
  }
  console.log(ok ? '\nREADY. Nothing was posted.' : '\nNOT READY — fix the ✗ lines above. Nothing was posted.');
  if (!ok) process.exitCode = 1;
  return ok;
}

/** Upload the week's graphics to WordPress over REST — no browser, no picker. */
async function cmdUpload() {
  const c = cfg();
  if (!c.wpUrl || !c.wpUser || !c.wpPass) {
    throw new Error('WP_URL, WP_USER and WP_APP_PASSWORD must be in .env.\n' +
      '  Make an Application Password once: WordPress admin → Users → Profile →\n' +
      '  Application Passwords → name it "cmg-publisher" → copy the generated password.');
  }
  const week = loadWeek();
  const auth = 'Basic ' + Buffer.from(`${c.wpUser}:${c.wpPass}`).toString('base64');
  const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
  for (const post of week.posts) {
    if (post.imageUrl) { console.log(`post ${post.id}: already uploaded — ${post.imageUrl}`); continue; }
    const name = post.file || post.image;
    const local = [path.join(DIR, 'graphics', name), path.join(DIR, name)].find((f) => fs.existsSync(f));
    if (!local) { console.log(`post ${post.id}: no local file "${name}" (looked in graphics\\ and here) — skipped`); process.exitCode = 1; continue; }
    const ext = path.extname(name).toLowerCase();
    const res = await fetch(`${c.wpUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        Authorization: auth,
        'Content-Type': types[ext] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${name}"`,
      },
      body: fs.readFileSync(local),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.source_url) {
      console.log(`post ${post.id}: WordPress upload FAILED (HTTP ${res.status}) ${data.message || ''}`);
      logLine({ cmd: 'upload', post: post.id, result: 'error', status: res.status });
      process.exitCode = 1; continue;
    }
    // PROOF: the URL must actually serve the image before it is recorded.
    const head = await fetch(data.source_url, { method: 'HEAD' });
    if (!head.ok) {
      console.log(`post ${post.id}: uploaded as ${data.source_url} but it does not serve (HTTP ${head.status}) — NOT recorded`);
      logLine({ cmd: 'upload', post: post.id, result: 'unverified', url: data.source_url });
      process.exitCode = 1; continue;
    }
    post.imageUrl = data.source_url;
    saveWeek(week);
    logLine({ cmd: 'upload', post: post.id, result: 'uploaded', url: data.source_url });
    console.log(`post ${post.id}: uploaded and verified — ${data.source_url}`);
  }
}

/** Schedule all open Facebook rows whose slot is far enough ahead. */
async function cmdScheduleWeek() {
  const c = cfg();
  if (!c.pageId || !c.pageToken) throw new Error('Facebook not set up — run setup first.');
  const week = loadWeek();
  if (week.approved !== true) {
    console.log('week.json is NOT approved ("approved": true missing) — nothing will be scheduled. Chris approves the batch first.');
    process.exitCode = 1; return;
  }
  const nowS = Math.floor(Date.now() / 1000);
  const results = [];
  for (const post of week.posts) {
    const fb = (post.facebook = post.facebook || {});
    if (fb.status === 'scheduled' || fb.status === 'published') {
      results.push([post.id, 'already ' + fb.status]); continue;
    }
    const slotS = ukToEpoch(post.slot);
    if (slotS < nowS + 15 * 60) {
      results.push([post.id, 'slot too soon/past — leave for publish-due']); continue;
    }
    const resp = await graph('POST', `${c.pageId}/photos`, {
      url: imageUrl(week, post),
      caption: post.caption,
      published: 'false',
      scheduled_publish_time: String(slotS),
      access_token: c.pageToken,
    });
    // PROOF: the post must appear in the Page's scheduled list.
    const sched = await graph('GET', `${c.pageId}/scheduled_posts`, {
      fields: 'id,message,scheduled_publish_time', limit: '100', access_token: c.pageToken,
    });
    const marker = post.caption.slice(0, 40);
    const found = (sched.data || []).find((p) => {
      const t = typeof p.scheduled_publish_time === 'number'
        ? p.scheduled_publish_time : Math.floor(new Date(p.scheduled_publish_time).getTime() / 1000);
      return Math.abs(t - slotS) < 120 && (p.message || '').startsWith(marker);
    });
    if (!found) {
      results.push([post.id, `⚠ UNVERIFIED — API returned id ${resp.id} but the post is NOT in scheduled_posts. Check the Planner by eye. Row left open.`]);
      logLine({ cmd: 'schedule-week', post: post.id, result: 'unverified', apiId: resp.id });
      process.exitCode = 1;
      continue;
    }
    fb.status = 'scheduled';
    fb.scheduledPostId = found.id;
    fb.scheduledFor = post.slot;
    fb.verified = 'seen in scheduled_posts';
    saveWeek(week);
    logLine({ cmd: 'schedule-week', post: post.id, result: 'scheduled', fbPostId: found.id, slot: post.slot });
    results.push([post.id, `scheduled for ${post.slot} — verified on Meta's servers (${found.id})`]);
  }
  console.log(`schedule-week at ${ukNowString()} (UK):`);
  for (const [id, msg] of results) console.log(`  post ${id}: ${msg}`);
  if (!results.length) console.log('  nothing to do');
}

async function igPublish(c, url, caption) {
  const container = await graph('POST', `${c.igUser}/media`, {
    image_url: url, caption, access_token: c.igToken,
  });
  // Wait for Meta to fetch and process the image.
  for (let i = 0; i < 12; i++) {
    const st = await graph('GET', container.id, { fields: 'status_code', access_token: c.igToken });
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') {
      throw new Error(`Instagram container ${container.id} status ${st.status_code} — image URL may be unreachable: ${url}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  const pub = await graph('POST', `${c.igUser}/media_publish`, {
    creation_id: container.id, access_token: c.igToken,
  });
  // PROOF: read the permalink back.
  const media = await graph('GET', pub.id, { fields: 'permalink', access_token: c.igToken });
  if (!media.permalink) throw new Error(`Published id ${pub.id} returned no permalink — treat as NOT proven.`);
  return media.permalink;
}

async function fbPublishLive(c, url, caption) {
  const resp = await graph('POST', `${c.pageId}/photos`, {
    url, caption, published: 'true', access_token: c.pageToken,
  });
  const postId = resp.post_id || resp.id;
  const read = await graph('GET', postId, {
    fields: 'permalink_url,link', access_token: c.pageToken,
  });
  const permalink = read.permalink_url || read.link;
  if (!permalink) throw new Error(`Published id ${postId} returned no permalink — treat as NOT proven.`);
  return permalink;
}

/** Publish everything past its slot and still open. Runs from Task Scheduler. */
async function cmdPublishDue() {
  // lock: skip if another run is live (stale after 10 min)
  try {
    const st = fs.existsSync(LOCK_PATH) && fs.statSync(LOCK_PATH);
    if (st && Date.now() - st.mtimeMs < 10 * 60 * 1000) { console.log('another run is in progress — skipping'); return; }
    fs.writeFileSync(LOCK_PATH, String(process.pid));
  } catch { /* lock is best-effort */ }
  try {
    const c = cfg();
    const week = loadWeek();
    if (week.approved !== true) {
      console.log('week.json is NOT approved ("approved": true missing) — nothing published. A quiet run.');
      return;
    }
    const nowS = Math.floor(Date.now() / 1000);
    let did = 0;
    for (const post of week.posts) {
      const slotS = ukToEpoch(post.slot);
      if (slotS > nowS) continue; // not due yet
      if (post.blocked) { console.log(`post ${post.id}: 🔴 blocked (${post.blocked}) — skipped`); continue; }
      const url = imageUrl(week, post);
      // Instagram
      const ig = (post.instagram = post.instagram || {});
      // status 'skipped' = deliberately not for Instagram (e.g. portrait photo the IG API rejects)
      if (ig.status !== 'published' && ig.status !== 'skipped' && c.igToken) {
        try {
          const permalink = await igPublish(c, url, post.caption);
          ig.status = 'published'; ig.permalink = permalink; ig.publishedAt = ukNowString();
          saveWeek(week);
          logLine({ cmd: 'publish-due', post: post.id, platform: 'instagram', result: 'published', permalink });
          console.log(`post ${post.id} → Instagram: PUBLISHED ${permalink}`); did++;
        } catch (e) {
          logLine({ cmd: 'publish-due', post: post.id, platform: 'instagram', result: 'error', error: e.message });
          console.log(`post ${post.id} → Instagram: FAILED — ${e.message}`); process.exitCode = 1;
        }
      }
      // Facebook — only rows that never got scheduled server-side
      const fb = (post.facebook = post.facebook || {});
      if (fb.status !== 'published' && fb.status !== 'scheduled' && c.pageId && c.pageToken) {
        try {
          const permalink = await fbPublishLive(c, url, post.caption);
          fb.status = 'published'; fb.permalink = permalink; fb.publishedAt = ukNowString();
          saveWeek(week);
          logLine({ cmd: 'publish-due', post: post.id, platform: 'facebook', result: 'published', permalink });
          console.log(`post ${post.id} → Facebook: PUBLISHED (late catch-up) ${permalink}`); did++;
        } catch (e) {
          logLine({ cmd: 'publish-due', post: post.id, platform: 'facebook', result: 'error', error: e.message });
          console.log(`post ${post.id} → Facebook: FAILED — ${e.message}`); process.exitCode = 1;
        }
      }
    }
    if (!did && process.exitCode !== 1) console.log(`nothing due at ${ukNowString()} (UK) — a quiet run is a good run`);
  } finally {
    try { fs.unlinkSync(LOCK_PATH); } catch { /* ignore */ }
  }
}

async function cmdListScheduled() {
  const c = cfg();
  const sched = await graph('GET', `${c.pageId}/scheduled_posts`, {
    fields: 'id,message,scheduled_publish_time', limit: '100', access_token: c.pageToken,
  });
  const rows = sched.data || [];
  console.log(`Meta's servers hold ${rows.length} scheduled post(s) for the Page:`);
  for (const p of rows) {
    const t = typeof p.scheduled_publish_time === 'number'
      ? new Date(p.scheduled_publish_time * 1000) : new Date(p.scheduled_publish_time);
    const uk = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' }).format(t);
    console.log(`  ${uk} (UK) — ${(p.message || '').split('\n')[0].slice(0, 60)}…  [${p.id}]`);
  }
}

function cmdInstallTask() {
  const node = process.execPath;
  const self = path.join(DIR, 'cmg-publisher.js');
  console.log('Run this once in an Administrator PowerShell to register the 15-minute publisher:\n');
  console.log(`schtasks /Create /TN "CMG social publisher" /SC MINUTE /MO 15 ` +
    `/TR "\\"${node}\\" \\"${self}\\" publish-due" /F\n`);
  console.log('The PC already wakes at 07:00; runs while it sleeps are simply skipped and the');
  console.log('next run after wake catches anything missed. Check it with:');
  console.log('  schtasks /Query /TN "CMG social publisher"');
  console.log('Results land in publish-log.jsonl next to this script.');
}

// ---------- main ----------
async function main() {
  const [, , cmd, arg] = process.argv;
  switch (cmd) {
    case 'setup': return cmdSetup(arg);
    case 'check': return cmdCheck();
    case 'upload': return cmdUpload();
    case 'schedule-week': return cmdScheduleWeek();
    case 'publish-due': return cmdPublishDue();
    case 'list-scheduled': return cmdListScheduled();
    case 'install-task': return cmdInstallTask();
    default:
      console.log('Usage: node cmg-publisher.js <setup|check|upload|schedule-week|publish-due|list-scheduled|install-task>');
      process.exitCode = 2;
  }
}
if (require.main === module) {
  main().catch((e) => { console.error('FAILED: ' + e.message); process.exit(1); });
}
module.exports = { ukToEpoch, ukOffsetMinutes, readEnv, writeEnv, cmdScheduleWeek, cmdPublishDue, cmdCheck, cmdSetup, cmdUpload, _paths: { WEEK_PATH, ENV_PATH, LOG_PATH } };
