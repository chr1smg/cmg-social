"""CMG post graphic templates - saved in the repo 9 Oct 2026 after the container copies were lost twice.
Square 1080x1080 (navy footer band): steps()  myth_fact()  icon_hero()
Portrait 1080x1350 photo-led premium: photo_premium()
Assets expected next to the generated HTML: assets/cmg-full-logo.png and assets/logo.png (the project
cmgfulllogo.png with its white background keyed to alpha: alpha=(255-min(RGB))*2.2), plus any photo.
Render with render(G, outdir) - returns per-page content-bottom vs footer-top so overflow is caught.
"""
# ---------- STEPS / TIMELINE (square) ----------
CSS = """
  * { box-sizing:border-box; margin:0; padding:0; }
  body { width:1080px; height:1080px; font-family:'Poppins',Arial,sans-serif; background:#FFFFFF; position:relative; overflow:hidden; }
  .band-top { position:absolute; top:0; left:0; right:0; height:200px; background:#1B3461; display:flex; flex-direction:column; justify-content:center; padding:0 80px; }
  .eyebrow { color:#EF7329; font-size:24px; font-weight:700; letter-spacing:3px; margin-bottom:10px; }
  .headline { color:#FFFFFF; font-size:46px; font-weight:800; line-height:1.16; }
  .timeline { position:absolute; top:262px; left:90px; right:70px; }
  .step { position:relative; display:flex; align-items:flex-start; margin-bottom:30px; }
  .step::before { content:""; position:absolute; left:33px; top:35px; bottom:-30px; width:4px; background:#EF7329; opacity:.35; z-index:1; }
  .step:last-child::before { display:none; }
  .node { width:70px; height:70px; border-radius:50%; background:#EF7329; color:#fff; font-size:31px; font-weight:800; display:flex; align-items:center; justify-content:center; flex:0 0 auto; z-index:2; box-shadow:0 0 0 6px #fff; }
  .step-text { font-size:26px; color:#22314f; line-height:1.42; margin-left:26px; padding-top:13px; }
  .step-text b { color:#1B3461; font-weight:700; }
  .step-warn { margin-bottom:0; }
  .step-warn .node { background:#C0392B; }
  .step-warn .step-text { color:#7a2b21; }
  .step-warn .step-text b { color:#C0392B; }
  .footer { position:absolute; bottom:0; left:0; right:0; height:170px; background:#1B3461; display:flex; align-items:center; padding:0 70px; }
  .footer-logo { height:120px; width:auto; margin-right:24px; filter:brightness(0) invert(1); }
  .footer-right { margin-left:auto; text-align:right; color:#fff; font-size:20px; font-weight:500; line-height:1.5; }
  .footer-web { color:#EF7329; font-size:23px; font-weight:700; }
  .badge { position:absolute; top:212px; right:70px; background:#EF7329; color:#fff; font-size:17px; font-weight:700; letter-spacing:2px; padding:7px 16px; border-radius:4px; }
"""
WARN = ('<svg width="34" height="34" viewBox="0 0 30 30"><path d="M15 3 L28 25 H2 Z" fill="none" stroke="#fff" '
        'stroke-width="3.2" stroke-linejoin="round"/><line x1="15" y1="12" x2="15" y2="18" stroke="#fff" '
        'stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="21.5" r="1.7" fill="#fff"/></svg>')

def steps(eyebrow, headline, steps, badge_text):
    compact = len(steps) >= 6
    tight = ("\n  .timeline{top:248px}\n  .step{margin-bottom:20px}\n  .step::before{bottom:-20px}\n"
             "  .node{width:62px;height:62px;font-size:28px}\n  .step-text{font-size:24px;margin-left:22px;padding-top:11px}\n") if compact else ""
    body=[]
    for node,text,warn in steps:
        cls='step step-warn' if warn else 'step'
        body.append(f'<div class="{cls}"><div class="node">{WARN if node=="!" else node}</div><div class="step-text">{text}</div></div>')
    badge=f'<div class="badge">{badge_text}</div>' if badge_text else ''
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>{CSS}{tight}</style></head><body>
<div class="band-top"><div class="eyebrow">{eyebrow}</div><div class="headline">{headline}</div></div>
{badge}
<div class="timeline">{''.join(body)}</div>
<div class="footer"><img class="footer-logo" src="assets/cmg-full-logo.png">
<div class="footer-right">Gas Safe Reg 917962 &middot; CIPHE Reg 129130<br><span class="footer-web">cmghp.co.uk</span></div></div>
</body></html>"""


# ---------- MYTH v FACT and ICON HERO (square) ----------
BASE = """
 *{box-sizing:border-box;margin:0;padding:0}
 body{width:1080px;height:1080px;font-family:'Poppins',Arial,sans-serif;background:#fff;position:relative;overflow:hidden}
 .footer{position:absolute;bottom:0;left:0;right:0;height:170px;background:#1B3461;display:flex;align-items:center;padding:0 70px}
 .footer-logo{height:120px;filter:brightness(0) invert(1);margin-right:24px}
 .footer-right{margin-left:auto;text-align:right;color:#fff;font-size:20px;font-weight:500;line-height:1.5}
 .footer-web{color:#EF7329;font-size:23px;font-weight:700}
"""
FOOT = ('<div class="footer"><img class="footer-logo" src="assets/cmg-full-logo.png">'
        '<div class="footer-right">Gas Safe Reg 917962 &middot; CIPHE Reg 129130<br>'
        '<span class="footer-web">cmghp.co.uk</span></div></div>')

def wrap(css, body):
    return f"<!DOCTYPE html><html><head><meta charset='utf-8'><style>{BASE}{css}</style></head><body>{body}{FOOT}</body></html>"

# ---------- STYLE C: myth vs fact ----------
def myth_fact(pill, headline, myth, fact, footnote):
    css = """
 .pill{position:absolute;top:52px;left:50%;transform:translateX(-50%);background:#1B3461;color:#EF7329;
   font-size:23px;font-weight:700;letter-spacing:2px;padding:12px 30px;border-radius:30px}
 .hl{position:absolute;top:120px;left:80px;right:80px;text-align:center;color:#1B3461;font-size:47px;font-weight:800;line-height:1.2}
 .cards{position:absolute;top:296px;left:70px;right:70px;display:flex;gap:26px}
 .card{flex:1;border-radius:20px;padding:36px 34px;min-height:400px}
 .m{background:#EFEFF1}
 .f{background:#1B3461}
 .tag{display:flex;align-items:center;font-size:26px;font-weight:800;letter-spacing:1px;margin-bottom:24px}
 .dot{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;
   color:#fff;font-size:26px;font-weight:800;margin-right:14px}
 .m .dot{background:#9AA0AA} .m .tag{color:#6B7280} .m p{color:#6B7280;font-size:27px;line-height:1.45}
 .f .dot{background:#EF7329} .f .tag{color:#fff} .f p{color:#fff;font-size:27px;line-height:1.45}
 .f b{color:#EF9228}  .m b{color:#4b5563}
 .vs{position:absolute;top:470px;left:50%;transform:translate(-50%,0);width:96px;height:96px;border-radius:50%;
   background:#EF7329;color:#fff;font-size:30px;font-weight:800;display:flex;align-items:center;justify-content:center;
   box-shadow:0 0 0 9px #fff;z-index:5}
 .note{position:absolute;top:742px;left:70px;right:70px;background:#F2F6FB;border-left:9px solid #EF7329;
   padding:26px 30px;color:#1B3461;font-size:26px;line-height:1.45;border-radius:0 10px 10px 0}
"""
    body = (f"<div class='pill'>{pill}</div><div class='hl'>{headline}</div>"
            f"<div class='cards'><div class='card m'><div class='tag'><div class='dot'>&times;</div>MYTH</div><p>{myth}</p></div>"
            f"<div class='card f'><div class='tag'><div class='dot'>&#10003;</div>FACT</div><p>{fact}</p></div></div>"
            f"<div class='vs'>VS</div><div class='note'>{footnote}</div>")
    return wrap(css, body)

# ---------- STYLE B: icon hero + three cards ----------
def icon_hero(pill, headline, icon_svg, cards):
    css = """
 .hero{position:absolute;top:0;left:0;right:0;height:562px;background:#F2F6FB;display:flex;flex-direction:column;align-items:center;padding-top:44px}
 .circ{width:236px;height:236px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;
   box-shadow:0 0 0 10px rgba(37,146,205,.10)}
 .pill{margin-top:34px;background:#EF7329;color:#fff;font-size:23px;font-weight:700;letter-spacing:2px;padding:12px 32px;border-radius:30px}
 .hl{margin-top:26px;padding:0 74px;text-align:center;color:#1B3461;font-size:47px;font-weight:800;line-height:1.2}
 .rule{width:88px;height:6px;background:#EF7329;border-radius:3px;margin-top:22px}
 .row{position:absolute;top:598px;left:70px;right:70px;display:flex;gap:24px}
 .c{flex:1;background:#F2F6FB;border-radius:18px;padding:26px 22px;text-align:center;min-height:212px}
 .c .ic{height:58px;display:flex;align-items:center;justify-content:center;margin-bottom:18px}
 .c p{color:#22314f;font-size:24px;line-height:1.38}
 .c b{color:#1B3461;font-weight:700}
"""
    cs = "".join(f"<div class='c'><div class='ic'>{i}</div><p>{t}</p></div>" for i,t in cards)
    body = (f"<div class='hero'><div class='circ'>{icon_svg}</div><div class='pill'>{pill}</div>"
            f"<div class='hl'>{headline}</div><div class='rule'></div></div><div class='row'>{cs}</div>")
    return wrap(css, body)

# ---------- PHOTO-LED PREMIUM (1080x1350) ----------
PREM_CSS = """
 *{box-sizing:border-box;margin:0;padding:0}
 body{width:1080px;height:1350px;font-family:'Poppins',Arial,sans-serif;background:#1B3461;position:relative;overflow:hidden}
 .photo{position:absolute;top:0;left:0;width:1080px;height:770px;background-size:cover;background-position:center}
 /* scrim: the photo fades INTO the navy so text never meets a busy edge */
 .scrim{position:absolute;top:470px;left:0;width:1080px;height:300px;
   background:linear-gradient(to bottom, rgba(27,52,97,0) 0%, rgba(27,52,97,.92) 70%, #1B3461 100%)}
 .content{position:absolute;left:72px;right:72px;top:672px}
 .eyebrow{color:#EF7329;font-size:26px;font-weight:600;letter-spacing:4px;text-transform:uppercase}
 .rule{width:56px;height:5px;background:#EF7329;margin:16px 0 24px}
 .hl{color:#fff;font-size:64px;font-weight:700;line-height:1.08;letter-spacing:-0.8px;max-width:920px}
 .pts{margin-top:32px}
 .pt{display:flex;align-items:baseline;margin-bottom:12px}
 .n{color:#EF7329;font-size:32px;font-weight:700;width:56px;flex:0 0 auto;font-variant-numeric:tabular-nums}
 .t{color:rgba(255,255,255,.94);font-size:31px;font-weight:400;line-height:1.4}
 .foot{position:absolute;left:72px;right:72px;bottom:48px;display:flex;align-items:center;
   border-top:1px solid rgba(255,255,255,.14);padding-top:24px}
 .foot img{height:104px;filter:brightness(0) invert(1)}
 .foot .r{margin-left:auto;text-align:right;color:rgba(255,255,255,.72);font-size:24px;line-height:1.5;letter-spacing:.2px}
 .foot .r b{color:#EF9228;font-weight:600}
"""
def photo_premium(photo, eyebrow, headline, points):
    pts="".join(f"<div class='pt'><div class='n'>{i+1}</div><div class='t'>{t}</div></div>" for i,t in enumerate(points))
    return f"""<!DOCTYPE html><html><head><meta charset='utf-8'><style>{PREM_CSS}</style></head><body>
<div class='photo' style="background-image:url('assets/{photo}')"></div><div class='scrim'></div>
<div class='content'><div class='eyebrow'>{eyebrow}</div><div class='rule'></div>
<div class='hl'>{headline}</div><div class='pts'>{pts}</div></div>
<div class='foot'><img src='assets/logo.png'><div class='r'>Gas Safe Reg 917962 &middot; CIPHE Reg 129130<br><b>cmghp.co.uk</b></div></div>
</body></html>"""


def render(G, outdir='out', workdir='.'):
    import os
    from playwright.sync_api import sync_playwright
    from PIL import Image
    os.makedirs(outdir, exist_ok=True)
    for n,h in G.items(): open(os.path.join(workdir,f'{n}.html'),'w').write(h)
    res={}
    with sync_playwright() as p:
        b=p.chromium.launch()
        for n,h in G.items():
            tall = 'height:1350px' in h
            pg=b.new_page(viewport={'width':1080,'height':1350 if tall else 1080})
            pg.goto('file://'+os.path.abspath(os.path.join(workdir,f'{n}.html'))); pg.wait_for_timeout(400)
            ov=pg.evaluate("""() => {const f=(document.querySelector('.footer')||document.querySelector('.foot')).getBoundingClientRect().top;
              let m=0; for (const el of document.querySelectorAll('.timeline .step, .note, .row .c, .pts .pt, .hl')) {const r=el.getBoundingClientRect(); if (r.bottom>m) m=r.bottom;}
              const img=document.querySelector('.footer-logo, .foot img'); return {foot:f, content:m, logo: img? img.naturalWidth: -1}}""")
            png=os.path.join(workdir,f'{n}.png'); pg.screenshot(path=png)
            Image.open(png).convert('RGB').save(os.path.join(outdir,f'{n}.jpg'),quality=94,subsampling=0)
            res[n]=ov; pg.close()
        b.close()
    return res
