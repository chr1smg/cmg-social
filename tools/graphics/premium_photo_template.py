# Premium photo-led template. Craft rules from the service-website-playbook:
# one type scale (1.25 ratio), 8-point spacing, internal<=external, Poppins only,
# no text-background boxes, accent reserved for the numerals and one rule.
CSS = """
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
def page(photo, eyebrow, headline, points):
    pts="".join(f"<div class='pt'><div class='n'>{i+1}</div><div class='t'>{t}</div></div>" for i,t in enumerate(points))
    return f"""<!DOCTYPE html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>
<div class='photo' style="background-image:url('assets/{photo}')"></div><div class='scrim'></div>
<div class='content'><div class='eyebrow'>{eyebrow}</div><div class='rule'></div>
<div class='hl'>{headline}</div><div class='pts'>{pts}</div></div>
<div class='foot'><img src='assets/logo.png'><div class='r'>Gas Safe Reg 917962 &middot; CIPHE Reg 129130<br><b>cmghp.co.uk</b></div></div>
</body></html>"""

G={
 'prem_smell_gas': page('boiler.jpg','If you smell gas','Five things,<br>in this order',[
   'Open the doors and windows, then turn the gas off at the meter',
   'Don\u2019t touch any switches, and no naked flames',
   'Get outside and ring 0800 111 999 \u2014 free, 24 hours']),
 'prem_frost': page('frost.jpg','Before the first frost','Three jobs worth<br>doing this weekend',[
   'Drain the outside tap and leave it open all winter',
   'Lag the loft pipes, with insulation under them, not over',
   'Run the heating for twenty minutes and listen']),
}
for n,h in G.items(): open(f'{n}.html','w').write(h)
print('wrote',len(G))
