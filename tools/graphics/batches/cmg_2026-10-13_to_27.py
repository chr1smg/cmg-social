# CMG batch 13-27 Oct 2026 - 11 designed posts around the five job-photo rows already queued (53-57 on 14, 17, 21, 24, 28 Oct).
# Sequence: 13 photo, 15 steps, 16 myth, 18 icon, 19 photo, 20 steps, 22 myth, 23 icon, 25 photo, 26 steps, 27 myth.
# Run from a folder with assets/cmg-full-logo.png, assets/logo.png, assets/{trap,plate,vessel}.jpg (Drive "02 Ready to post", privacy-cleared).
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from cmg_templates import steps, myth_fact, icon_hero, photo_premium, render

RAW = "https://raw.githubusercontent.com/chr1smg/cmg-social/main/graphics/"
N = '#1B3461'; O = '#EF7329'
def ic(p): return f"<svg width='58' height='58' viewBox='0 0 40 40' fill='none' stroke='{O}' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'>{p}</svg>"
def big(p): return f"<svg width='128' height='128' viewBox='0 0 40 40' fill='none' stroke-linecap='round' stroke-linejoin='round'>{p}</svg>"

P = []
def add(i, slot, style, name, html, title, caption, tall=False):
    P.append(dict(id=i, slot=slot, title=title, image=name + '.jpg', imageUrl=RAW + name + '.jpg', style=style,
                  caption=caption.strip(), blocked="", _html=html))

# Mon 13 Oct - photo (premium, 4:5)
add(95, "2026-10-13 09:45", "photo", "w7_prem_condensate",
    photo_premium('trap.jpg', 'Off a boiler in Bolton', 'This is what<br>your boiler makes', [
        'Slightly acidic condensate, drained down a white plastic pipe',
        'That outside pipe freezes in January and stops the boiler',
        'Lag it now, while it is a five-minute job']),
    "CMG — photo: condensate trap",
    """This came out of a boiler on a Bolton job. It's condensate, and every condensing boiler makes it, a few litres a day, slightly acidic.

It collects in a trap like this one and drains away down a plastic pipe, often the white one you can see on the outside wall. When that outside pipe freezes in January the boiler can't drain, and it shuts itself down. Cue the coldest morning of the year with no heating.

The fix is dull and cheap: lag the outside run now, while it's dry and you can feel your fingers. If the pipe is long, thin or drips, that's worth sorting properly before the cold.

Can you see yours from the back door?""")

# Wed 15 Oct - steps
add(96, "2026-10-15 09:45", "steps", "w7_combi_or_system",
    steps("KNOW YOUR BOILER", "Combi Or System?<br>Four Ways To Tell", [
        ("1", "<b>Hot water tank in the airing cupboard?</b> Then it is not a combi. Combis heat water as you use it.", 0),
        ("2", "<b>Tanks in the loft?</b> An older <b>regular</b> (open vented) system. No loft tanks but a cylinder: a <b>system</b> boiler.", 0),
        ("3", "<b>Hot tap runs the boiler.</b> Turn a hot tap on and listen. If the boiler fires, it is a combi.", 0),
        ("4", "<b>Five pipes</b> under a combi, usually <b>three or four</b> under the others.", 0),
        ("!", "Why it matters: it is the first question anyone asks when you ring, and it changes what the fix is.", 1)], "KNOW YOUR BOILER"),
    "CMG — steps: combi or system",
    """"Is it a combi?" is the first thing you'll get asked when you ring about a heating fault, and a surprising number of people have to go and look. Four ways to tell:

1. A hot water cylinder in the airing cupboard means it isn't a combi. Combis heat water on demand and store nothing.

2. Tanks in the loft point to an older regular (open vented) system. A cylinder but no loft tanks is usually a system boiler.

3. Turn a hot tap on and listen. If the boiler fires up, it's a combi.

4. Count the pipes underneath. Five is the classic combi, three or four for the others.

Why it matters: the fault, the fix and the cost all change with the type. Knowing yours saves the first five minutes of every call.

Which one have you got?""")

# Thu 16 Oct - myth
add(97, "2026-10-16 10:00", "myth", "w7_myth_new_boiler_bills",
    myth_fact("MYTH OR FACT", "A New Boiler Halves<br>Your Gas Bill",
        "Swap the boiler and the bill drops by half. That is what the adverts imply.",
        "It depends what you are replacing. A <b>20-year-old non-condensing</b> boiler to a modern one is a real saving. A <b>10-year-old condensing</b> boiler to a new one, much less.",
        "The bigger savings on an existing system are usually controls, insulation and a thermostat set a degree lower. Ask before you buy."),
    "CMG — myth: new boiler halves the bill",
    """Myth: a new boiler halves your gas bill.

It depends entirely on what you're replacing.

An old non-condensing boiler, the sort from before 2005 with no white plastic pipe outside, wastes a good chunk of its heat up the flue. Replacing that with a modern condensing boiler is a real, noticeable saving.

A ten-year-old condensing boiler replaced with a new condensing boiler? The efficiency is close. You'd be buying reliability and parts availability, not a dramatically smaller bill.

Where the money usually is on an existing system: proper controls, a thermostat set a degree lower, insulation, and a system that's been balanced and cleaned so the boiler isn't fighting it.

Honest answer before you spend: ask what you've got now and what the realistic difference is. We'll tell you if it isn't worth it.""")

# Sat 18 Oct - icon hero
add(98, "2026-10-18 10:00", "icon", "w7_icon_gas_ecv",
    icon_hero("THE ONE SWITCH", "Where Is Your Gas<br>Emergency Control?",
        big(f"<g stroke='{N}' stroke-width='2.6'><rect x='6' y='14' width='28' height='16' rx='2'/><path d='M12 14V9h16v5'/></g><g stroke='{O}' stroke-width='2.8'><path d='M20 18v8'/><path d='M14 22h12'/></g>"),
        [(ic("<path d='M8 12h24v16H8z'/><path d='M14 12V8h12v4'/>"), "<b>By the gas meter:</b> a yellow or brass lever on the pipe. Outside box, cupboard or under the stairs."),
         (ic("<path d='M20 6v28'/><path d='M8 20h24'/>"), "<b>Across the pipe = off.</b> In line = on. A quarter turn."),
         (ic("<circle cx='20' cy='20' r='13'/><path d='M20 12v9l5 3'/>"), "<b>Find it today.</b> Smell gas: off, windows open, no switches, outside, <b>0800 111 999</b>.")]),
    "CMG — icon: gas emergency control",
    """One switch everyone in the house should be able to find in the dark: the gas emergency control valve.

It's a yellow or brass lever on the pipe next to the gas meter. Meter box on the outside wall, a cupboard, under the stairs, sometimes a cellar. Lever across the pipe is off, in line with the pipe is on. A quarter turn.

If you ever smell gas: turn it off, open the windows, don't touch any switches, get outside and ring the National Gas Emergency line on 0800 111 999. Free, 24 hours.

Go and find yours now, while it's a two-minute thing and not an emergency. Then show whoever else lives there.

Where's yours hiding?""")

# Sun 19 Oct - photo (premium)
add(99, "2026-10-19 10:00", "photo", "w7_prem_data_plate",
    photo_premium('plate.jpg', 'Behind the front panel', 'Find this label<br>before you ring', [
        'Make, model and GC number are all on it',
        'With those, parts can be ordered before anyone visits',
        'Photograph it now and keep it on your phone']),
    "CMG — photo: the data plate",
    """Every boiler has a label like this, usually behind the drop-down flap or inside the front panel. It carries the make, the exact model and the GC number.

That label is the difference between "it's a white Worcester" and the engineer turning up with the right part in the van. With a model and GC number, a fault can be narrowed down over the phone and parts ordered before anyone's been out.

Two minutes: find it, photograph it, keep it on your phone with the fault code list from the manual.

If it's faded, worn or missing, the model is sometimes on the inside of the case too.

Got yours?""")

# Mon 20 Oct - steps
add(100, "2026-10-20 09:45", "steps", "w7_dripping_tap",
    steps("SMALL JOBS", "Dripping Tap? Four<br>Checks Before You Ring", [
        ("1", "<b>Which tap, and where from?</b> From the spout when it is off, or from under the handle when it is on? Different parts.", 0),
        ("2", "<b>Old two-handle tap</b> dripping from the spout is nearly always a <b>washer</b>. A few pence, ten minutes.", 0),
        ("3", "<b>Single-lever mixer</b> dripping is usually the <b>cartridge</b>. Make and model matters here.", 0),
        ("4", "<b>Find the isolation valve</b> under the sink first. If there is not one, the whole house goes off at the stopcock.", 0),
        ("!", "If the tap seizes, the isolator does not shut, or it is a boiling or filtered tap, stop there and ring.", 1)], "SMALL JOBS"),
    "CMG — steps: dripping tap",
    """A dripping tap is the job people put off for a year and then apologise for ringing about. Don't. Four checks first:

1. Which tap, and where's the drip coming from? From the spout with the tap off is one part. From under the handle while it's running is another.

2. Old-style two-handle taps dripping from the spout are nearly always a washer. Cheap, quick.

3. A single-lever mixer is usually the cartridge inside. Make and model matter, so a photo of the tap helps.

4. Look under the sink for a small isolation valve on each pipe. If there isn't one, the water for the whole house comes off at the stopcock while it's done.

Where to stop and ring: if the tap's seized, the isolator won't shut, or it's a boiling or filtered tap with its own gubbins underneath.

How long has yours been dripping? Be honest.""")

# Wed 22 Oct - myth
add(101, "2026-10-22 09:45", "myth", "w7_myth_heat_pump_cold",
    myth_fact("MYTH OR FACT", "Heat Pumps Don&rsquo;t<br>Work In The Cold",
        "Once it gets to freezing a heat pump gives up and you sit in a cold house.",
        "They are built for it. Most are rated to run well <b>below &minus;15&deg;C</b>, and they are standard kit in Norway and Sweden. A Bolton winter is mild by comparison.",
        "What does matter is the house: radiators sized for lower water temperatures and decent insulation. That is the survey, not the weather."),
    "CMG — myth: heat pumps and the cold",
    """Myth: heat pumps don't work when it's cold.

They're built for exactly that. Most air source heat pumps are rated to keep going well below minus 15, and they're the normal way to heat a house in Norway and Sweden, where winter means it. A Bolton January is mild next to that.

What actually decides whether one works well in your house isn't the weather, it's the house. A heat pump runs the radiators cooler for longer, so the radiators need to be sized for that, and the insulation needs to be reasonable. That's what the survey is for, and it's why a good installer will sometimes say "not yet, do the insulation first".

Thinking about one? Ask us what your house would need before anyone quotes a number.""")

# Thu 23 Oct - icon hero
add(102, "2026-10-23 10:00", "icon", "w7_icon_trv_pin",
    icon_hero("FIRST COLD WEEK", "Radiator Not Coming On?<br>Try The Pin",
        big(f"<g stroke='{N}' stroke-width='2.6'><rect x='8' y='16' width='24' height='18' rx='3'/><path d='M12 16v-4h16v4'/></g><g stroke='{O}' stroke-width='2.8'><path d='M20 12V5'/><path d='M17 8h6'/></g>"),
        [(ic("<circle cx='20' cy='20' r='12'/><path d='M20 8v24'/>"), "<b>Why now:</b> the valve sat shut all summer and the pin under the head has <b>stuck down</b>."),
         (ic("<path d='M10 30 L30 10'/><path d='M22 10h8v8'/>"), "<b>Unscrew the head</b> by hand. The pin should stand 3&nbsp;mm proud and spring back when pressed."),
         (ic("<path d='M8 20h8l3-8 4 16 3-8h6'/>"), "<b>Stuck?</b> Tap it, or ease it up a touch with pliers. <b>Never pull it out</b>; it will leak.")]),
    "CMG — icon: stuck TRV pin",
    """One radiator stone cold while the rest are fine, the first week the heating's on? Nine times out of ten it's the pin.

Thermostatic radiator valves (the ones with numbers) sit closed all summer, and the small pin under the plastic head sticks down. The head says 5, the valve says shut.

Unscrew the plastic head by hand, no tools. Underneath there's a pin about 3 mm proud that should spring back when you press it. If it's sunk and stuck, tap it gently, or ease it up a touch with pliers. Put the head back on. Don't pull the pin out, it'll weep.

If it won't move at all, or the valve starts dripping, stop there. That's a valve replacement, a quick job for us.

Which room is the cold one in your house?""")

# Sat 25 Oct - photo (premium)
add(103, "2026-10-25 10:00", "photo", "w7_prem_expansion_vessel",
    photo_premium('vessel.jpg', 'Inside the boiler', 'Pressure keeps dropping<br>and there is no leak?', [
        'Often this: the expansion vessel has lost its charge',
        'Then the pressure climbs when hot and drops when cold',
        'A ten-minute recharge on a service, not a new boiler']),
    "CMG — photo: expansion vessel",
    """Boiler pressure keeps dropping every few weeks, you top it up, nothing's wet anywhere, and it does it again. Very often it's this.

The red thing is the expansion vessel. It's a rubber diaphragm with air on one side that takes up the expansion as the water heats. When the air charge leaks away over the years, there's nowhere for the expansion to go, so the pressure shoots up when the heating's on, the relief valve dumps a bit out of the pipe outside, and then it reads low when everything cools down.

The fix is recharging it with a pump, like a tyre, and it's a ten-minute job. Occasionally the vessel itself has failed and needs replacing. Neither one is a new boiler.

If you've been topping up more than once a month, that's worth a look.""")

# Sun 26 Oct - steps
add(104, "2026-10-26 10:00", "steps", "w7_toilet_running",
    steps("SMALL JOBS", "Toilet Running All<br>The Time? Four Checks", [
        ("1", "<b>Lift the cistern lid.</b> Is water trickling over the top of the overflow tube? That is the <b>fill valve</b> not shutting off.", 0),
        ("2", "<b>Water level fine but still running into the pan?</b> The <b>flush valve seal</b> at the bottom is not seating. Usually a worn washer.", 0),
        ("3", "<b>Push the button and let go.</b> If it sticks, the button or its cable is hanging the valve open.", 0),
        ("4", "<b>Turn the little isolator</b> on the pipe to the cistern to stop the waste while you decide.", 0),
        ("!", "On a water meter this costs real money every day. If the isolator will not turn or the cistern is concealed in a wall, ring.", 1)], "SMALL JOBS"),
    "CMG — steps: toilet running",
    """A toilet that never quite stops running is one of the quietest ways to waste water, and on a meter it's money every single day. Four checks:

1. Lid off. Water trickling over the top of the overflow tube in the middle means the fill valve isn't shutting off. Common, cheap.

2. Level looks right but water's still trickling into the pan? The flush valve seal at the bottom isn't seating. Usually a worn washer or a bit of debris.

3. Press the button and let go. If it sticks, the button or its cable is holding the valve open.

4. There's usually a small isolator on the pipe feeding the cistern. Turn it off to stop the waste while you decide what to do.

Where to stop: isolator won't turn, or the cistern's hidden in a wall or furniture. That's a job for us rather than a Sunday afternoon.

Clocks went back last night, by the way. Check the heating timer.""")

# Mon 27 Oct - myth
add(105, "2026-10-27 09:45", "myth", "w7_myth_pilot_light",
    myth_fact("MYTH OR FACT", "The Pilot Light<br>Has Gone Out",
        "The boiler is not working, so the pilot light must have blown out. Just relight it.",
        "Modern boilers <b>don&rsquo;t have one</b>. They spark to ignite on demand. If yours has a pilot light burning all day, it is a <b>20-plus-year-old</b> appliance.",
        "A permanent pilot burns gas around the clock, winter and summer. It is one reason a very old boiler costs more to run than its label suggests."),
    "CMG — myth: the pilot light",
    """Myth: the boiler's stopped, so the pilot light must have gone out.

Any boiler fitted in the last twenty years doesn't have one. It sparks to light the burner each time it fires, which is why you hear a click and a whoomph. There's nothing to relight.

If your boiler does have a little flame burning away behind a window all day, that's a permanent pilot, and it means the appliance is old. It burns gas 24 hours a day, 365 days a year, heating nothing, which is one reason very old boilers cost more to run than people think.

So if a modern boiler won't fire: check the pressure gauge, check the fault code on the display, and check the gas is on (has anyone been working in the house?). Then ring.

Anyone still got a pilot light? We'd like to see it.""")

if __name__ == '__main__':
    G = {p['image'][:-4]: p['_html'] for p in P}
    res = render(G, outdir='out', workdir='.')
    bad = {k: v for k, v in res.items() if v['content'] > v['foot'] - 24 or v['logo'] <= 0}
    print('rendered', len(res), 'problems:', bad)
    rows = [{k: v for k, v in p.items() if k != '_html'} for p in P]
    json.dump(rows, open('rows.json', 'w'), indent=1, ensure_ascii=False)
    print('rows.json written', len(rows))
