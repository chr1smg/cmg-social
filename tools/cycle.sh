#!/usr/bin/env bash
# One publisher cycle: pull the latest repo state, schedule, publish anything due, confirm, write SCHEDULE.md, commit.
# Used by keeper.yml in a loop (every 15 minutes for ~5.5 hours per job) because GitHub's own cron
# fires this repo's workflows only every 3-7 hours (measured 1-12 Oct 2026).
# Run from the repo root with publisher/.env already written. Never exits non-zero on a publish
# problem - the publish-log and SCHEDULE.md carry the doubt; a loop must not stop on one bad row.
set -u
cd "$(dirname "$0")/.." || exit 1
echo "=== cycle $(date -u '+%Y-%m-%d %H:%M:%S') UTC ==="

# pick up feed edits and the previous commit without losing .env (untracked, ignored by git add below)
git pull --rebase origin main >/dev/null 2>&1 || { git rebase --abort >/dev/null 2>&1; git pull --rebase origin main || true; }

cd publisher || exit 1
if ! grep -q '^FB_PAGE_TOKEN=' .env && ! grep -q '^IG_TOKEN=' .env; then echo "no Meta credentials - nothing to do"; exit 0; fi

# cancel.json
if [ -s cancel.json ]; then
  ids=$(node -e 'const a=require("./cancel.json");console.log((a.ids||[]).join(" "))')
  if [ -n "$ids" ]; then
    tok=$(grep "^FB_PAGE_TOKEN=" .env | cut -d= -f2-)
    for id in $ids; do
      code=$(curl -s -o /tmp/out -w "%{http_code}" -X DELETE "https://graph.facebook.com/v23.0/$id?access_token=$tok")
      echo "cancel $id -> HTTP $code $(cat /tmp/out)"
    done
    echo '{"ids": []}' > cancel.json
  fi
fi

approved=$(node -e "console.log(require('./week.json').approved===true?'yes':'no')")
if [ "$approved" = "yes" ] && grep -q '^FB_PAGE_TOKEN=' .env; then
  node cmg-publisher.js schedule-week || echo "schedule-week reported a problem (see above)"
  if node -e "process.exit((require('./week.json').reels||[]).length?0:1)"; then
    node cmg-publisher.js schedule-reels || echo "schedule-reels reported a problem"
  fi
fi
node cmg-publisher.js publish-due || echo "publish-due reported a problem (see above)"
if grep -q '^FB_PAGE_TOKEN=' .env; then
  node cmg-publisher.js confirm-published || echo "confirm step reported a problem - not fatal"
fi
IG_ON=$(grep -q '^IG_USER_ID=' .env 2>/dev/null && echo yes || echo no)
IG_ON=$IG_ON node ../tools/write-schedule.js || echo "schedule write failed - not fatal"
rm -f .publisher.lock
cd ..

git config user.name  "cmg-publisher"
git config user.email "publisher@users.noreply.github.com"
git add publisher/week.json publisher/publish-log.jsonl publisher/cancel.json SCHEDULE.md 2>/dev/null || true
if git diff --cached --quiet; then echo "no state changes"; exit 0; fi
git commit -q -m "publisher state: $(date -u '+%Y-%m-%d %H:%M') UTC"
git pull --rebase origin main && git push || echo "push failed - will retry next cycle"
exit 0
