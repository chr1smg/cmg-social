// Writes SCHEDULE.md from publisher/week.json. Run from the publisher/ directory. IG_ON=yes|no in env.
const igOn=process.env.IG_ON==="yes";
const w=JSON.parse(require("fs").readFileSync(require("path").join(process.cwd(),"week.json"),"utf8"));
const items=w.posts.map(p=>({p,reel:false})).concat((w.reels||[]).map(p=>({p,reel:true})));
const rows=items.slice().sort((a,b)=>a.p.slot<b.p.slot?-1:1).map(({p,reel})=>{
  const st=(p.facebook||{}).status||"";
  const igst=(p.instagram||{}).status||"";
  const bad=(p.facebook||{}).confirmFailed;
  const mark=st==="published"?"DONE":bad?"DID NOT PUBLISH - CHECK":st==="scheduled"?"QUEUED ON META":"WAITING";
  const ig=(igst==="skipped"||!igOn)?"Facebook only":"Facebook + Instagram";
  const d=new Date(p.slot.replace(" ","T")+":00");
  const day=d.toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"});
  const title=reel?("REEL - "+p.title):p.title;
  const where=reel&&st==="scheduled"&&igst!=="published"?ig+" (Instagram fires at the slot)":ig;
  return "| "+day+" | "+p.slot.slice(11)+" | "+title+" | "+mark+" | "+where+" |";
}).join("\n");
const igNote=igOn?"":"\n**Instagram is NOT connected to this publisher** (no IG_USER_ID in the repository secrets), so every row below goes to Facebook only. To turn Instagram on: add IG_USER_ID (from INSTAGRAM_USER_ID in the PC .env) and replace IG_TOKEN (from INSTAGRAM_ACCESS_TOKEN - the one stored now is a Facebook Page token and Meta refuses it) in Settings - Secrets and variables - Actions.\n";
const head="# What is queued\n\nWritten automatically every 15 minutes by the publisher.\n\nQUEUED ON META means Facebook is holding the post and will put it out at that time. Those do NOT show in the Business Suite Planner - it only lists posts made in Meta own composer - so this file is the place to look.\n\nDONE means the publisher asked Meta after the slot and Meta confirmed the post is live - not that it was supposed to go out. DID NOT PUBLISH - CHECK means the slot passed and Meta says it is still unpublished; nothing is retried automatically, so that one needs a decision.\n"+igNote+"\nLast updated: "+new Date().toISOString().slice(0,16).replace("T"," ")+" UTC\n\n| Day | Time | Post | State | Where |\n|---|---|---|---|---|\n";
require("fs").writeFileSync(require("path").join(process.cwd(),"..","SCHEDULE.md"),head+rows+"\n");
