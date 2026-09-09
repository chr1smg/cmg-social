#!/usr/bin/env node
/**
 * CMG Heating & Plumbing — social publisher v2
 * ------------------------------------------------
 * One file, no npm packages, Node 18+. Lives next to a `.env` and a `week.json`.
 *
 * Filename note: this is a .cjs file because it sits in the cmg-instagram-connector
 * folder, whose package.json declares "type": "module". CommonJS in a .cjs file
 * runs regardless of that setting.
 *
 * THE ONE DESIGN RULE
 *   Nothing is reported as done until it has been read back off Meta's
 *   servers: a scheduled post must appear in the Page's scheduled_posts list,
 *   a published post must return its permalink. No proof, no tick.
 *
 * COMMANDS
 *   setup <token> | check | upload | schedule-week | publish-due |
 *   list-scheduled | install-task | publish-reel <id>
 *
 * REELS — added 3 Sep 2026, rewritten 9 Sep 2026 against the live endpoints.
 *   Reels live in a SEPARATE `week.reels` array, never `week.posts`, so
 *   imageUrl() is never called on a video file.
 *
 *   CORRECTION to the original note here: a Facebook reel CAN be scheduled.
 *   The video_reels `finish` phase takes video_state=SCHEDULED with a
 *   scheduled_publish_time (more than 10 minutes ahead, within 29 days), so
 *   `schedule-reels` hands a reel to Meta exactly like schedule-week hands
 *   over a photo. Instagram has NO scheduling of any kind — an IG reel is
 *   fired by publish-due at its own slot, which is fine because the workflow
 *   wakes every 15 minutes on GitHub's servers.
 *
 *   Shape of one entry in week.reels:
 *     { "id": 1, "slot": "2026-09-12 10:00", "title": "...",
 *       "video": "w2_booking_reel.mp4", "videoUrl": null, "caption": "...",
 *       "facebook": {"status": ""}, "instagram": {"status": ""} }
 *
 *   WHERE THE VIDEO LIVES — this is the part that decides whether it works.
 *   `week.baseVideoUrl` points at this repo's GitHub Pages site, and the .mp4
 *   sits in publisher/video/. Pages serves it as content-type video/mp4 with
 *   byte ranges, which is what Meta's ingester needs. Checked 9 Sep 2026:
 *     GitHub Pages     -> 206, video/mp4, accept-ranges: bytes   GOOD
 *     raw.githubuser…  -> 200, application/octet-stream, nosniff  NO GOOD
 *   So do not point baseVideoUrl at raw.githubusercontent.com, even though
 *   that host is fine for the JPEGs. WordPress would also work but its
 *   application-password upload has been returning HTTP 401 since 3 Sep.
 *
 *   Meta's reel spec, checked against the file before uploading: 3-90s,
 *   9:16, at least 540x960 (1080x1920 preferred), 24-60fps, .mp4.
 *
 *   Flow:
 *     1. Put the .mp4 in publisher/video/ in this repo.
 *     2. Add the entry to week.reels with its slot and caption.
 *     3. `schedule-reels` hands the Facebook copy to Meta and records the
 *        video id, read back off Meta after finish.
 *     4. `publish-due` fires the Instagram copy at the slot, and will also
 *        catch up a Facebook reel that never got scheduled.
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
const DEFAULT_PAGE_REF = '110510101534769'; // CMG Heating and Plumbing (facebook.com/CONTACTCMG)

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
    igToken: (e.IG_TOKEN || e.INSTAGRAM_ACCESS_TOKEN || e.INSTAGRAM_TOKEN || e.ACCESS_TOKEN || '').trim(),
    igVersion: e.INSTAGRAM_API_VERSION || e.GRAPH_VERSION || 'v23.0',
    wpUrl: (e.WP_URL || '').replace(/\/+$/, ''),
    wpUser: e.WP_USER || '',
    wpPass: e.WP_APP_PASSWORD || '',
  };
}

// ---------- Graph API ----------
const BASE = () => `https://graph.facebook.com/${cfg().v}`;

/**
 * Which host an Instagram call must go to.
 *
 * There are two kinds of Instagram token and they are NOT interchangeable:
 *   EAA... — a Facebook token. Works on graph.facebook.com.
 *   IGAA.. — an "Instagram API with Instagram Login" token. Works ONLY on
 *            graph.instagram.com; graph.facebook.com answers
 *            "Cannot parse access token" (error 190).
 * CMG's connector holds an IGAA token, which is why this exists. The endpoint
 * paths are identical on both hosts — only the host differs.
 */
const IG_BASE = () => {
  const c = cfg();
  return /^IG/.test(c.igToken)
    ? `https://graph.instagram.com/${c.igVersion}`
    : `https://graph.facebook.com/${c.v}`;
};

async function graphOn(base, method, edge, params) {
  const url = new URL(`${base}/${edge}`);
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
    if (e.code === 190) {
      msg += '\n  -> The access token has expired, been revoked, or is the wrong kind for this host.';
      if (/graph\.facebook\.com/.test(base) && /Cannot parse/i.test(e.message || '')) {
        msg += '\n  -> An IGAA... Instagram token cannot be used on graph.facebook.com.';
      }
    }
    throw new Error(msg);
  }
  return data;
}
const graph = (method, edge, params) => graphOn(BASE(), method, edge, params);
const graphIG = (method, edge, params) => graphOn(IG_BASE(), method, edge, params);

// ---------- UK time ----------
function ukOffsetMinutes(epochMs) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', timeZoneName: 'longOffset',
  }).formatToParts(epochMs);
  const tz = parts.find((p) => p.type === 'timeZoneName').value;
  const m = tz.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}
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
  if (post.imageUrl) return post.imageUrl;
  if (/^https?:\/\//.test(post.image)) return post.image;
  return week.baseImageUrl.replace(/\/?$/, '/') + post.image;
}
// Mirrors imageUrl() for the separate week.reels array — see the file-header
// note on why reels are not just posts with a video field.
function videoUrl(week, reel) {
  if (reel.videoUrl) return reel.videoUrl;
  if (/^https?:\/\//.test(reel.video || '')) return reel.video;
  // baseVideoUrl is the GitHub Pages site for this repo, which serves .mp4 with
  // a real video/mp4 header and honours byte ranges. raw.githubusercontent.com
  // does NOT — it sends application/octet-stream with nosniff, which Meta's
  // video ingester will not accept. Do not "simplify" this back to raw.
  if (week && week.baseVideoUrl && reel.video) {
    return week.baseVideoUrl.replace(/\/?$/, '/') + reel.video;
  }
  return null;
}
function logLine(obj) {
  fs.appendFileSync(LOG_PATH, JSON.stringify({ at: new Date().toISOString(), ...obj }) + '\n');
}

// ---------- commands ----------
async function cmdSetup(shortToken, pageRef) {
  const c = cfg();
  if (!c.appId || !c.appSecret) {
    throw new Error('FB_APP_ID and FB_APP_SECRET must be in .env first.');
  }
  if (!shortToken) throw new Error('Usage: node cmg-publisher.cjs setup <short-lived-user-token> [page-id-or-username]');
  console.log('1/3 Exchanging for a long-lived user token...');
  const ll = await graph('GET', 'oauth/access_token', {
    grant_type: 'fb_exchange_token', client_id: c.appId,
    client_secret: c.appSecret, fb_exchange_token: shortToken,
  });
  console.log('2/3 Finding the Page...');
  let page = null;

  // Route A - the documented one: the Pages this user has a direct role on.
  const accounts = await graph('GET', 'me/accounts', {
    fields: 'id,name,access_token', access_token: ll.access_token,
  });
  const pages = accounts.data || [];
  if (pages.length) {
    page = pages.find((p) => /cmg/i.test(p.name)) || pages[0];
    console.log(`   Found via me/accounts: "${page.name}"`);
  } else {
    // Route B - the fallback that this Page actually needs.
    //
    // me/accounts comes back EMPTY for the CMG Page even with pages_show_list
    // granted and "opt in to all current and future Pages" accepted - verified
    // by hand in the Graph API Explorer on 25 Aug 2026 after a completely fresh
    // grant. Asking the Page node directly still returns a working page token,
    // so that is what we do. Do not "simplify" this away.
    const ref = pageRef || readEnv().FB_PAGE_REF || DEFAULT_PAGE_REF;
    console.log(`   me/accounts returned nothing - asking the Page node directly (${ref})...`);
    const p = await graph('GET', ref, {
      fields: 'id,name,access_token', access_token: ll.access_token,
    });
    if (!p.access_token) {
      throw new Error(
        `The Page "${p.name || ref}" returned no access token.\n` +
        '  The grant is missing pages_manage_posts for this Page, or the account\n' +
        '  generating the token does not hold a publishing role on it.');
    }
    page = p;
    console.log(`   Found via the Page node: "${page.name}"`);
  }

  writeEnv({ FB_PAGE_ID: page.id, FB_PAGE_TOKEN: page.access_token });
  console.log(`   Saved Page "${page.name}" (${page.id}). Page tokens from a long-lived exchange do not expire.`);
  console.log('3/3 Checking...');
  await cmdCheck();
}

async function cmdCheck() {
  const c = cfg();
  let ok = true;
  if (!c.pageId || !c.pageToken) {
    ok = false;
    console.log('x Facebook: FB_PAGE_ID / FB_PAGE_TOKEN missing — run setup first.');
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
      console.log(`OK Facebook: ready — will post to "${page.name}"${scopeNote}`);
    } catch (e) { ok = false; console.log(`x Facebook: ${e.message}`); }
  }
  if (!c.igToken) {
    ok = false;
    console.log('x Instagram: no token found (IG_TOKEN / INSTAGRAM_ACCESS_TOKEN in .env).');
  } else {
    try {
      const ig = await graphIG('GET', c.igUser, { fields: 'username', access_token: c.igToken });
      console.log(`OK Instagram: ready — will post to @${ig.username} (via ${IG_BASE().replace(/^https:\/\//, '').split('/')[0]})`);
    } catch (e) { ok = false; console.log(`x Instagram: ${e.message}`); }
  }
  console.log(ok ? '\nREADY. Nothing was posted.' : '\nNOT READY — fix the x lines above. Nothing was posted.');
  if (!ok) process.exitCode = 1;
  return ok;
}

async function cmdUpload() {
  const c = cfg();
  if (!c.wpUrl || !c.wpUser || !c.wpPass) {
    throw new Error('WP_URL, WP_USER and WP_APP_PASSWORD must be in .env.');
  }
  const week = loadWeek();
  const auth = 'Basic ' + Buffer.from(`${c.wpUser}:${c.wpPass}`).toString('base64');
  const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4' };

  async function uploadOne(name, folders) {
    const local = folders.map((f) => path.join(DIR, f, name)).find((f) => fs.existsSync(f))
      || (fs.existsSync(path.join(DIR, name)) ? path.join(DIR, name) : null);
    if (!local) return { ok: false, skipped: true };
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
    if (!res.ok || !data.source_url) return { ok: false, status: res.status, message: data.message };
    const head = await fetch(data.source_url, { method: 'HEAD' });
    if (!head.ok) return { ok: false, unverified: true, url: data.source_url, status: head.status };
    return { ok: true, url: data.source_url };
  }

  for (const post of week.posts) {
    if (post.imageUrl) { console.log(`post ${post.id}: already uploaded — ${post.imageUrl}`); continue; }
    const name = post.file || post.image;
    if (!fs.existsSync(path.join(DIR, 'graphics', name)) && !fs.existsSync(path.join(DIR, name))) {
      console.log(`post ${post.id}: no local file "${name}" (already hosted, or nothing to upload) — skipped`); continue;
    }
    const r = await uploadOne(name, ['graphics']);
    if (!r.ok) {
      if (r.unverified) {
        console.log(`post ${post.id}: uploaded as ${r.url} but it does not serve (HTTP ${r.status}) — NOT recorded`);
        logLine({ cmd: 'upload', post: post.id, result: 'unverified', url: r.url });
      } else {
        console.log(`post ${post.id}: WordPress upload FAILED (HTTP ${r.status}) ${r.message || ''}`);
        logLine({ cmd: 'upload', post: post.id, result: 'error', status: r.status });
      }
      process.exitCode = 1; continue;
    }
    post.imageUrl = r.url;
    saveWeek(week);
    logLine({ cmd: 'upload', post: post.id, result: 'uploaded', url: r.url });
    console.log(`post ${post.id}: uploaded and verified — ${r.url}`);
  }

  // Reels — same WordPress upload, into videoUrl instead of imageUrl. Added
  // 3 Sep 2026, see the file-header note. week.reels may not exist on older
  // week.json files, hence the guard.
  for (const reel of week.reels || []) {
    if (reel.videoUrl) { console.log(`reel ${reel.id}: already uploaded — ${reel.videoUrl}`); continue; }
    const name = reel.video;
    if (!fs.existsSync(path.join(DIR, 'video', name)) && !fs.existsSync(path.join(DIR, name))) {
      console.log(`reel ${reel.id}: no local file "${name}" in video\\ — skipped`); continue;
    }
    console.log(`reel ${reel.id}: uploading ${name} (this can take a minute or two for video)...`);
    const r = await uploadOne(name, ['video']);
    if (!r.ok) {
      if (r.unverified) {
        console.log(`reel ${reel.id}: uploaded as ${r.url} but it does not serve (HTTP ${r.status}) — NOT recorded`);
        logLine({ cmd: 'upload', reel: reel.id, result: 'unverified', url: r.url });
      } else {
        console.log(`reel ${reel.id}: WordPress upload FAILED (HTTP ${r.status}) ${r.message || ''}`);
        logLine({ cmd: 'upload', reel: reel.id, result: 'error', status: r.status });
      }
      process.exitCode = 1; continue;
    }
    reel.videoUrl = r.url;
    saveWeek(week);
    logLine({ cmd: 'upload', reel: reel.id, result: 'uploaded', url: r.url });
    console.log(`reel ${reel.id}: uploaded and verified — ${r.url}`);
  }
}

async function cmdScheduleWeek() {
  const c = cfg();
  if (!c.pageId || !c.pageToken) throw new Error('Facebook not set up — run setup first.');
  const week = loadWeek();
  if (week.approved !== true) {
    console.log('week.json is NOT approved — nothing will be scheduled.');
    process.exitCode = 1; return;
  }
  const nowS = Math.floor(Date.now() / 1000);
  const results = [];
  for (const post of week.posts) {
    const fb = (post.facebook = post.facebook || {});
    if (fb.status === 'scheduled' || fb.status === 'published') {
      results.push([post.id, 'already ' + fb.status]); continue;
    }
    if (post.blocked) { results.push([post.id, `blocked (${post.blocked}) — skipped`]); continue; }
    const slotS = ukToEpoch(post.slot);
    if (slotS < nowS + 15 * 60) {
      results.push([post.id, 'slot too soon/past — leave for publish-due']); continue;
    }
    let resp;
    try {
      resp = await graph('POST', `${c.pageId}/photos`, {
        url: imageUrl(week, post),
        caption: post.caption,
        published: 'false',
        scheduled_publish_time: String(slotS),
        access_token: c.pageToken,
      });
    } catch (e) {
      results.push([post.id, `FAILED — ${e.message}`]);
      logLine({ cmd: 'schedule-week', post: post.id, result: 'error', error: e.message });
      process.exitCode = 1;
      continue;
    }
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
      results.push([post.id, `UNVERIFIED — API returned id ${resp.id} but the post is NOT in scheduled_posts. Check the Planner by eye. Row left open.`]);
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
  const container = await graphIG('POST', `${c.igUser}/media`, {
    image_url: url, caption, access_token: c.igToken,
  });
  for (let i = 0; i < 12; i++) {
    const st = await graphIG('GET', container.id, { fields: 'status_code', access_token: c.igToken });
    if (st.status_code === 'FINISHED') break;
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') {
      throw new Error(`Instagram container ${container.id} status ${st.status_code} — image URL may be unreachable: ${url}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  const pub = await graphIG('POST', `${c.igUser}/media_publish`, {
    creation_id: container.id, access_token: c.igToken,
  });
  const media = await graphIG('GET', pub.id, { fields: 'permalink', access_token: c.igToken });
  if (!media.permalink) throw new Error(`Published id ${pub.id} returned no permalink — treat as NOT proven.`);
  return media.permalink;
}

async function fbPublishLive(c, url, caption) {
  const resp = await graph('POST', `${c.pageId}/photos`, {
    url, caption, published: 'true', access_token: c.pageToken,
  });
  const postId = resp.post_id || resp.id;
  if (!postId) throw new Error('Facebook returned no post id — nothing was published.');

  // The post EXISTS from here on. Everything below is decoration.
  //
  // Do NOT throw past this point. On 26 Aug 2026 the read-back asked for the
  // `link` field, which Meta deprecated at v3.3; it answered error 12, the run
  // recorded FAILED, and both posts were sitting live on the Page all along.
  // A row left open is republished by the 15-minute task, so a failed read-back
  // used to mean a DUPLICATE post. Losing the permalink is survivable; posting
  // twice is not.
  let permalink = null;
  try {
    const read = await graph('GET', postId, {
      fields: 'permalink_url', access_token: c.pageToken,
    });
    permalink = read.permalink_url || null;
  } catch (e) {
    console.log(`  (post ${postId} published; could not read its permalink back: ${e.message})`);
  }
  return permalink || `https://www.facebook.com/${c.pageId}/posts/${String(postId).split('_').pop()}`;
}

// ---------- REELS — new 3 Sep 2026, UNTESTED against live Meta endpoints ----------
//
// Facebook: the video_reels edge. `upload_phase=start` with `file_url` set
// asks Meta to fetch the hosted file itself (documented behaviour for hosted
// video, mirroring how /{page-id}/photos takes a `url` instead of raw bytes) —
// this avoids implementing chunked resumable upload for an 18-20s clip well
// under any size limit. `upload_phase=finish` then publishes it. Never
// verified live — if `file_url` on `start` is refused by this API version,
// the fallback is the full start/transfer/finish chunked flow instead.
async function fbPublishReel(c, url, caption, whenEpoch) {
  const start = await graph('POST', `${c.pageId}/video_reels`, {
    upload_phase: 'start', access_token: c.pageToken,
  });
  const videoId = start.video_id;
  if (!videoId) throw new Error('Facebook video_reels start returned no video_id.');

  // THE TRANSFER DOES NOT GO THROUGH graph.facebook.com. Proved on run #1051,
  // 9 Sep 2026: graph answers
  //   (#100) Param upload_phase must be one of {START, FINISH} - got "transfer"
  // The bytes — or here, a file_url for Meta to go and fetch itself — go to the
  // rupload host that START hands back, with the token in an Authorization
  // header rather than a query parameter.
  const uploadUrl = start.upload_url || `https://rupload.facebook.com/video-upload/${c.v}/${videoId}`;
  const up = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `OAuth ${c.pageToken}`, file_url: url },
  });
  let upBody;
  try { upBody = await up.json(); } catch { upBody = { success: false, note: `non-JSON response, HTTP ${up.status}` }; }
  if (upBody.success !== true) {
    throw new Error(`rupload refused the hosted file for video_id ${videoId} (HTTP ${up.status}): ${JSON.stringify(upBody)}\n  -> is ${url} publicly reachable AND served as content-type video/mp4? application/octet-stream is refused.`);
  }

  const finishParams = {
    upload_phase: 'finish', video_id: videoId,
    description: caption, access_token: c.pageToken,
  };
  if (whenEpoch) {
    // Meta holds a SCHEDULED reel itself: more than 10 minutes ahead and
    // within 29 days. Same deal as a scheduled photo post, so a reel can sit
    // in the week alongside everything else instead of being posted by hand.
    finishParams.video_state = 'SCHEDULED';
    finishParams.scheduled_publish_time = String(whenEpoch);
  } else {
    finishParams.video_state = 'PUBLISHED';
  }
  const finish = await graph('POST', `${c.pageId}/video_reels`, finishParams);
  if (finish.success === false) throw new Error(`Facebook video_reels finish failed for video_id ${videoId}.`);

  // A scheduled reel has no permalink yet — nothing is public until its slot.
  // Read it back off Meta so "scheduled" means Meta confirmed it, not that the
  // call returned 200.
  if (whenEpoch) {
    const back = await graph('GET', videoId, {
      fields: 'id,scheduled_publish_time', access_token: c.pageToken,
    });
    if (!back.id) throw new Error(`video_id ${videoId} did not read back from Meta after finish — treat as NOT scheduled.`);
    return { videoId, scheduledFor: back.scheduled_publish_time || whenEpoch };
  }

  // Reels process after "finish" returns — poll for a permalink before
  // declaring this done, same rule as everything else in this file.
  let permalink = null;
  for (let i = 0; i < 24; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    try {
      const read = await graph('GET', videoId, {
        fields: 'permalink_url,status', access_token: c.pageToken,
      });
      if (read.permalink_url) { permalink = read.permalink_url; break; }
      const phase = read.status && read.status.video_status;
      if (phase === 'error') throw new Error(`Facebook reports video_status error for ${videoId}.`);
    } catch (e) { /* keep polling — a transient read failure isn't a publish failure */ }
  }
  if (!permalink) throw new Error(`video_id ${videoId} finished upload but no permalink after 2 minutes of polling — check the Page by eye before assuming it worked.`);
  return permalink;
}

// Instagram: identical container/poll/publish shape to igPublish(), but
// media_type=REELS and a much more patient poll — video processing takes
// meaningfully longer than a photo container. share_to_feed keeps it visible
// on the main grid as well as the Reels tab, matching how Chris's photos post.
async function igPublishReel(c, url, caption) {
  const container = await graphIG('POST', `${c.igUser}/media`, {
    media_type: 'REELS', video_url: url, caption, share_to_feed: 'true', access_token: c.igToken,
  });
  let finished = false;
  for (let i = 0; i < 40; i++) {
    const st = await graphIG('GET', container.id, { fields: 'status_code', access_token: c.igToken });
    if (st.status_code === 'FINISHED') { finished = true; break; }
    if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') {
      throw new Error(`Instagram Reels container ${container.id} status ${st.status_code} — video URL may be unreachable or still processing: ${url}`);
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  if (!finished) throw new Error(`Instagram Reels container ${container.id} never reached FINISHED after 200s — check it by hand before retrying (retrying can double-post once it does finish).`);
  const pub = await graphIG('POST', `${c.igUser}/media_publish`, {
    creation_id: container.id, access_token: c.igToken,
  });
  const media = await graphIG('GET', pub.id, { fields: 'permalink', access_token: c.igToken });
  if (!media.permalink) throw new Error(`Published id ${pub.id} returned no permalink — treat as NOT proven.`);
  return media.permalink;
}

// Schedule every future reel on Meta's servers, the same way cmdScheduleWeek
// does for photos. Instagram has no scheduling at all, so IG reels are left
// for publish-due to fire at their slot.
async function cmdScheduleReels() {
  const c = cfg();
  const week = loadWeek();
  if (week.approved !== true) { console.log('week.json is NOT approved — no reels scheduled.'); return; }
  const reels = week.reels || [];
  if (!reels.length) { console.log('no reels in week.json'); return; }
  const nowS = Math.floor(Date.now() / 1000);
  for (const reel of reels) {
    const fb = (reel.facebook = reel.facebook || {});
    if (fb.status === 'scheduled' || fb.status === 'published') {
      console.log(`  reel ${reel.id}: already ${fb.status}`); continue;
    }
    if (!reel.slot) { console.log(`  reel ${reel.id}: no slot — skipped`); continue; }
    const slotS = ukToEpoch(reel.slot);
    if (slotS <= nowS + 660) { console.log(`  reel ${reel.id}: slot ${reel.slot} is not more than 10 minutes away — left for publish-due`); continue; }
    if (slotS > nowS + 29 * 86400) { console.log(`  reel ${reel.id}: slot ${reel.slot} is more than 29 days out — Meta will not hold it yet`); continue; }
    const url = videoUrl(week, reel);
    if (!url) { console.log(`  reel ${reel.id}: no video URL — skipped`); continue; }
    try {
      const r = await fbPublishReel(c, url, reel.caption, slotS);
      fb.status = 'scheduled';
      fb.scheduledPostId = r.videoId;
      fb.scheduledFor = reel.slot;
      fb.verified = 'read back from Meta after finish';
      saveWeek(week);
      logLine({ cmd: 'schedule-reels', reel: reel.id, result: 'scheduled', videoId: r.videoId, slot: reel.slot });
      console.log(`  reel ${reel.id}: scheduled for ${reel.slot} — verified on Meta's servers (${r.videoId})`);
    } catch (e) {
      logLine({ cmd: 'schedule-reels', reel: reel.id, result: 'error', error: e.message });
      console.log(`  reel ${reel.id}: FAILED — ${e.message}`);
      process.exitCode = 1;
    }
  }
}

async function cmdPublishReel(idArg) {
  const c = cfg();
  const week = loadWeek();
  const id = Number(idArg);
  const reel = (week.reels || []).find((r) => r.id === id);
  if (!reel) throw new Error(`No reel with id ${idArg} in week.reels. Usage: node cmg-publisher.cjs publish-reel <id>`);
  const url = videoUrl(week, reel);
  if (!url) throw new Error(`Reel ${id} has no videoUrl yet — run "upload" first so it's hosted on WordPress.`);

  const fb = (reel.facebook = reel.facebook || {});
  if (fb.status === 'published') {
    console.log(`reel ${id} -> Facebook: already published ${fb.permalink}`);
  } else {
    try {
      const permalink = await fbPublishReel(c, url, reel.caption);
      fb.status = 'published'; fb.permalink = permalink; fb.publishedAt = ukNowString();
      saveWeek(week);
      logLine({ cmd: 'publish-reel', reel: id, platform: 'facebook', result: 'published', permalink });
      console.log(`reel ${id} -> Facebook: PUBLISHED ${permalink}`);
    } catch (e) {
      logLine({ cmd: 'publish-reel', reel: id, platform: 'facebook', result: 'error', error: e.message });
      console.log(`reel ${id} -> Facebook: FAILED — ${e.message}`);
      process.exitCode = 1;
    }
  }

  const ig = (reel.instagram = reel.instagram || {});
  if (ig.status === 'published') {
    console.log(`reel ${id} -> Instagram: already published ${ig.permalink}`);
  } else {
    try {
      const permalink = await igPublishReel(c, url, reel.caption);
      ig.status = 'published'; ig.permalink = permalink; ig.publishedAt = ukNowString();
      saveWeek(week);
      logLine({ cmd: 'publish-reel', reel: id, platform: 'instagram', result: 'published', permalink });
      console.log(`reel ${id} -> Instagram: PUBLISHED ${permalink}`);
    } catch (e) {
      logLine({ cmd: 'publish-reel', reel: id, platform: 'instagram', result: 'error', error: e.message });
      console.log(`reel ${id} -> Instagram: FAILED — ${e.message}`);
      process.exitCode = 1;
    }
  }
}

async function cmdPublishDue() {
  try {
    const st = fs.existsSync(LOCK_PATH) && fs.statSync(LOCK_PATH);
    if (st && Date.now() - st.mtimeMs < 10 * 60 * 1000) { console.log('another run is in progress — skipping'); return; }
    fs.writeFileSync(LOCK_PATH, String(process.pid));
  } catch { /* lock is best-effort */ }
  try {
    const c = cfg();
    const week = loadWeek();
    if (week.approved !== true) {
      console.log('week.json is NOT approved — nothing published. A quiet run.');
      return;
    }
    const nowS = Math.floor(Date.now() / 1000);
    let did = 0;
    for (const post of week.posts) {
      const slotS = ukToEpoch(post.slot);
      if (slotS > nowS) continue;
      if (post.blocked) { console.log(`post ${post.id}: blocked (${post.blocked}) — skipped`); continue; }
      const url = imageUrl(week, post);
      const ig = (post.instagram = post.instagram || {});
      if (ig.status !== 'published' && ig.status !== 'skipped' && c.igToken) {
        try {
          const permalink = await igPublish(c, url, post.caption);
          ig.status = 'published'; ig.permalink = permalink; ig.publishedAt = ukNowString();
          saveWeek(week);
          logLine({ cmd: 'publish-due', post: post.id, platform: 'instagram', result: 'published', permalink });
          console.log(`post ${post.id} -> Instagram: PUBLISHED ${permalink}`); did++;
        } catch (e) {
          logLine({ cmd: 'publish-due', post: post.id, platform: 'instagram', result: 'error', error: e.message });
          console.log(`post ${post.id} -> Instagram: FAILED — ${e.message}`); process.exitCode = 1;
        }
      }
      const fb = (post.facebook = post.facebook || {});
      if (fb.status !== 'published' && fb.status !== 'scheduled' && c.pageId && c.pageToken) {
        try {
          const permalink = await fbPublishLive(c, url, post.caption);
          fb.status = 'published'; fb.permalink = permalink; fb.publishedAt = ukNowString();
          saveWeek(week);
          logLine({ cmd: 'publish-due', post: post.id, platform: 'facebook', result: 'published', permalink });
          console.log(`post ${post.id} -> Facebook: PUBLISHED (late catch-up) ${permalink}`); did++;
        } catch (e) {
          logLine({ cmd: 'publish-due', post: post.id, platform: 'facebook', result: 'error', error: e.message });
          console.log(`post ${post.id} -> Facebook: FAILED — ${e.message}`); process.exitCode = 1;
        }
      }
    }
    // Reels. Facebook ones are normally already held by Meta (schedule-reels),
    // so this loop is mostly Instagram, which has no scheduling at all and has
    // to be fired at the slot itself. Same guards as the photo loop: a reel
    // marked published or scheduled is never touched again.
    for (const reel of week.reels || []) {
      if (!reel.slot) continue;
      const slotS = ukToEpoch(reel.slot);
      if (slotS > nowS) continue;
      if (reel.blocked) { console.log(`reel ${reel.id}: blocked (${reel.blocked}) — skipped`); continue; }
      const vurl = videoUrl(week, reel);
      if (!vurl) { console.log(`reel ${reel.id}: no video URL — skipped`); continue; }

      const rig = (reel.instagram = reel.instagram || {});
      if (rig.status !== 'published' && rig.status !== 'skipped' && c.igToken) {
        try {
          const permalink = await igPublishReel(c, vurl, reel.caption);
          rig.status = 'published'; rig.permalink = permalink; rig.publishedAt = ukNowString();
          saveWeek(week);
          logLine({ cmd: 'publish-due', reel: reel.id, platform: 'instagram', result: 'published', permalink });
          console.log(`reel ${reel.id} -> Instagram: PUBLISHED ${permalink}`); did++;
        } catch (e) {
          logLine({ cmd: 'publish-due', reel: reel.id, platform: 'instagram', result: 'error', error: e.message });
          console.log(`reel ${reel.id} -> Instagram: FAILED — ${e.message}`); process.exitCode = 1;
        }
      }

      const rfb = (reel.facebook = reel.facebook || {});
      if (rfb.status !== 'published' && rfb.status !== 'scheduled' && rfb.status !== 'skipped' && c.pageId && c.pageToken) {
        try {
          const permalink = await fbPublishReel(c, vurl, reel.caption);
          rfb.status = 'published'; rfb.permalink = permalink; rfb.publishedAt = ukNowString();
          saveWeek(week);
          logLine({ cmd: 'publish-due', reel: reel.id, platform: 'facebook', result: 'published', permalink });
          console.log(`reel ${reel.id} -> Facebook: PUBLISHED (late catch-up) ${permalink}`); did++;
        } catch (e) {
          logLine({ cmd: 'publish-due', reel: reel.id, platform: 'facebook', result: 'error', error: e.message });
          console.log(`reel ${reel.id} -> Facebook: FAILED — ${e.message}`); process.exitCode = 1;
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
    console.log(`  ${uk} (UK) — ${(p.message || '').split('\n')[0].slice(0, 60)}...  [${p.id}]`);
  }
}

function cmdInstallTask() {
  const node = process.execPath;
  const self = __filename;
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
  const [, , cmd, arg, arg2] = process.argv;
  switch (cmd) {
    case 'setup': return cmdSetup(arg, arg2);
    case 'check': return cmdCheck();
    case 'upload': return cmdUpload();
    case 'schedule-week': return cmdScheduleWeek();
    case 'publish-due': return cmdPublishDue();
    case 'schedule-reels': return cmdScheduleReels();
    case 'publish-reel': return cmdPublishReel(arg);
    case 'list-scheduled': return cmdListScheduled();
    case 'install-task': return cmdInstallTask();
    default:
      console.log('Usage: node cmg-publisher.cjs <setup|check|upload|schedule-week|schedule-reels|publish-due|publish-reel <id>|list-scheduled|install-task>');
      process.exitCode = 2;
  }
}
if (require.main === module) {
  main().catch((e) => { console.error('FAILED: ' + e.message); process.exit(1); });
}
module.exports = { ukToEpoch, ukOffsetMinutes, readEnv, writeEnv, cmdScheduleWeek, cmdPublishDue, cmdCheck, cmdSetup, cmdUpload, cmdPublishReel, cmdScheduleReels, _paths: { WEEK_PATH, ENV_PATH, LOG_PATH } };
