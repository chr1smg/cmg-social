# cmg-social — the CMG Heating & Plumbing publisher

This repo publishes CMG's Facebook and Instagram posts **from GitHub's servers**.
No PC needs to be on. Nothing is ever reported as done without proof read back
off Meta's servers (a scheduled-post ID or a permalink).

## How it works

- `publisher/week.json` — the week's posts: slot times (UK), captions, image URLs,
  and the record of what has actually published. **`"approved": false` means
  nothing publishes.** Chris approves the batch; the flag flips; publishing starts.
- `publisher/cmg-publisher.js` — the tested publisher. Facebook posts are
  scheduled on Meta's own servers for the whole week in one go; Instagram (which
  Meta does not allow scheduling for) is published at slot time by the
  15-minute job.
- `.github/workflows/publish.yml` — runs every 15 minutes. Quiet no-op until the
  Meta token exists and the batch is approved.
- `.github/workflows/watchdog.yml` — twice a day. **If nothing has published for
  36 hours it fails loudly**, whatever any checklist says — GitHub emails the
  failure. Four quiet days can never again look like "all clear".
- `graphics/` — post graphics, served to Meta straight from this repo.
- State (ticks, permalinks, the log) is committed back here after every run, so
  the repo itself is always the truthful record.

## One-time setup (the only manual step left)

1. On developers.facebook.com, open the **CMG Page Publisher** app
   (ID 2311213529629434) → **Tools → Graph API Explorer**:
   - Select the app, choose **User token**
   - Add permissions: `pages_show_list`, `pages_read_engagement`,
     `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`,
     `business_management`
   - **Generate Access Token**, approve for the CMG Page + @cmg_hp, copy it.
2. In this repo: **Settings → Secrets and variables → Actions → New repository
   secret**, add three:
   - `FB_APP_ID` — the app ID above
   - `FB_APP_SECRET` — from the app's Settings → Basic
   - `META_USER_TOKEN` — the token you just copied
3. Done. The next 15-minute run exchanges it for permanent page credentials,
   stores them as secrets itself, deletes `META_USER_TOKEN`, and from then on
   runs forever. Short-lived tokens are fine — the exchange happens before they
   expire as long as steps 1–3 happen in one sitting.

## Approving a week

The batch is drafted with `"approved": false`. When Chris says go, the flag is
set to `true` (via Claude, or by editing `publisher/week.json` in the GitHub
app). Posts whose slots already passed are published on the next run;
future Facebook slots are scheduled server-side; Instagram publishes at slot
time.

## House rules encoded here

- Never publish a row twice (rows with proof are never touched again).
- Posts 3, 6 and 9 this week are Facebook-only (portrait photos the Instagram
  API rejects) — their Instagram status is `skipped`, which is deliberate.
- No prices, no claims beyond the captions Chris approved.
