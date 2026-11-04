# BWD batch 5-18 Nov 2026 - 14 posts, one a day. Slots 18:00 weekdays, 09:00 weekends.
# Rotation Mon photo / Tue list / Wed light / Thu bignum / Fri photo / Sat myth / Sun list.
# PHOTO DAYS SWITCHED: every job photo in graphics/ has already been used (CMG rows), and the brief is never to invent
# a photo, so the four photo days run as non-photo styles: Fri 6 light, Mon 9 bignum, Fri 13 light, Mon 16 bignum.
# Built 4 Nov 2026 with tools/graphics/bwd_templates.py (rebuilt the same day; see its docstring).
# Facts checked at source 4 Nov 2026 - listed against each row below.
# Run:  python3 bwd_2026-11-05_to_18.py   -> out/*.jpg, rows.json (rows are NOT loaded into the feed by this script).
import sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from bwd_templates import bignum, list_card, myth, light, render

RAW = "https://raw.githubusercontent.com/chr1smg/cmg-social/main/graphics/"
SIGN = "Published by CMG Heating & Plumbing, Bolton · Gas Safe 917962"

P = []
def add(i, slot, style, name, html, title, caption):
    P.append(dict(id=i, slot=slot, page="bwd", title=title, image=name + '.jpg', imageUrl=RAW + name + '.jpg',
                  style=style, caption=caption.strip() + "\n\n" + SIGN, blocked="", _html=nowrap(html)))

def nowrap(html):
    # keep phone numbers and 'Gas Safe' from splitting across lines on the card
    for t in ("0800 111 999", "Gas Safe"):
        html = html.replace(t, f"<span style='white-space:nowrap'>{t}</span>")
    return html

# Thu 5 Nov - bignum. Source: UKHSA, gov.uk "Cold weather alert issued by UKHSA" (updated 13 Mar 2023):
# "it is important to try and heat your home to at least 18°C if you can."
add(118, "2026-11-05 18:00", "bignum", "bwd_big_eighteen",
    bignum("Eighteen.", "The number the health advice actually asks for.", "18°C",
           ["The UK Health Security Agency's cold weather advice: try to heat your home to <b>at least 18°C</b> if you can.",
            "Not 25. Not whatever the dial was on when you moved in. Eighteen, in the rooms you actually live in."],
           "Know someone who sits in a coat to save the gas? Pop round."),
    "BWD — big number: eighteen",
    """Eighteen.

The UK Health Security Agency's advice for cold weather is to try to heat your home to at least 18°C if you can. Not 25. Not whatever the dial was on when you moved in. Eighteen, in the rooms you actually live in.

That sits alongside last week's one degree post. If your living room runs at 21, coming down a degree is a saving. Going right down to 15 to save money is a false economy for anyone who feels the cold.

It's bonfire night. Hats, gloves, sparklers, then home to a warm house. If you've got a neighbour or a parent who sits in a coat to save the gas, this is a good week to pop round and look at the thermostat with them.

What's your living room on right now?""")

# Fri 6 Nov - light (photo day switched). Source: Croydon Council energy tips PDF:
# "Close your curtains at dusk to stop heat escaping through the windows".
add(119, "2026-11-06 18:00", "light", "bwd_light_curtains",
    light("Your nan shut the curtains the minute it went dark. Your nan was right.",
          "Shut them at dusk and the heat stays in the room instead of leaking out through the glass. Just don't let long ones hang over the radiator."),
    "BWD — the light one: shut the curtains",
    """Your nan shut the curtains the minute it went dark. Your nan was right.

Windows are one of the easiest ways for heat to get out of a room. Council energy advice says it plainly: close your curtains at dusk to stop heat escaping through the windows.

One catch. If the radiator is under the window and the curtains are long, they hang in front of it and send the heat up behind them, straight onto the cold glass. Tuck them onto the sill so the heat comes into the room instead.

Open them again in the morning. Winter sun through the glass is free heat.

Are you a curtains shut at four o'clock house?""")

# Sat 7 Nov - myth. Sources: Northamptonshire Fire and Rescue: "smoke alarms cannot be used to detect carbon monoxide";
# Northern Gas Networks CO advice: alarm "in every room that contains a fuel-burning appliance", follow the maker's instructions.
add(120, "2026-11-07 09:00", "myth", "bwd_myth_smoke_alarm_co",
    myth("Worth five minutes on a Saturday.",
         "The smoke alarm on the landing will go off if there's carbon monoxide.",
         "It won't. A smoke alarm detects smoke. Carbon monoxide has no smell, colour or taste, and it needs its own alarm.",
         "Some alarms do both and say so on the front. If yours just says smoke, that's all it does."),
    "BWD — myth: the smoke alarm will catch CO",
    """Myth: the smoke alarm on the landing will go off if there's carbon monoxide.

It won't. A smoke alarm detects smoke. Carbon monoxide has no smell, no colour and no taste, and it needs an alarm made for it. The fire service put it plainly: smoke alarms cannot be used to detect carbon monoxide.

Some alarms do both jobs in one unit, and they say so on the front. If yours only says smoke, that's all it does.

Where a CO alarm goes: in every room with something that burns fuel, so the boiler, a gas fire, a log burner. Follow the instructions that come with it for height and distance. One near where people sleep is worth having too.

And press the test button now and then. An alarm with a flat battery is a plastic disc on the ceiling.

Go and look at yours. Smoke, CO, or both?""")

# Sun 8 Nov - list. Sources: Vaillant UK "What pressure should my boiler be" (1 to 1.5 bar with heating off);
# Octopus Energy "What to do if you've got no gas" (hob test; hob dead = contact supplier; prepay credit);
# gas emergency 0800 111 999 (Northern Gas Networks).
add(121, "2026-11-08 09:00", "list", "bwd_list_boiler_stopped",
    list_card("Boiler Stopped?<br>Four Checks First", "None of them involve taking a cover off.",
              [("The pressure gauge.", "Most boilers want 1 to 1.5 bar with the heating off. Near zero? That's likely why."),
               ("The gas hob.", "If it lights, gas is reaching the house and it's the boiler. If not, check prepay credit, then ring your supplier."),
               ("Thermostat and timer.", "Flat batteries, a timer that lost its time in a power cut, a dial someone turned down."),
               ("The display.", "Write down any code. Freezing night and gurgling? Think condensate pipe.")],
              "Smell gas at any point? Stop. Windows open, no switches, out, ring 0800 111 999."),
    "BWD — list: boiler stopped, four checks",
    """Boiler stopped on a cold morning? Four checks before you ring anybody. None of them involve taking a cover off.

1. The pressure gauge. Most boilers like to sit around 1 to 1.5 bar with the heating off. If the needle is down near zero, that's very likely why it's stopped. More on that tomorrow.

2. The gas hob. If it lights, gas is reaching the house and the problem is the boiler. If it won't light either, check the credit if you're on a prepayment meter, then ring your energy supplier.

3. The thermostat and timer. Flat batteries in a wireless thermostat, a timer that lost its time in a power cut, or a dial somebody turned down. It happens in more houses than will admit it.

4. The display. If there's a code, write it down. If it's been freezing overnight and the boiler is gurgling, it could be a frozen condensate pipe. That one's on Tuesday.

If you smell gas at any point, stop. Windows open, don't touch any switches, get outside and ring 0800 111 999.

If none of the four explains it, that's the time to ring a Gas Safe registered engineer, with the code and what you've already checked.

What's the first thing you check?""")

# Mon 9 Nov - bignum (photo day switched). Source: Vaillant UK - "generally be 1 to 1.5 bar when central heating is off",
# 1 to 2 bar normal with it on; low pressure usually means a leak; still low after repressurising -> Gas Safe engineer.
add(122, "2026-11-09 18:00", "bignum", "bwd_big_pressure",
    bignum("One And A Half.", "The number on the boiler most people never look at.", "1.5 bar",
           ["With the heating off, most boilers want the gauge at about <b>1 to 1.5 bar</b>. It rises a bit while the heating runs, and that's normal.",
            "Down near zero and most boilers stop and show a fault."],
           "Topping it up every week? The water is going somewhere."),
    "BWD — big number: one and a half",
    """One and a half.

Find the pressure gauge on your boiler. It's either a small dial with a needle or a number on the display. With the heating off, most boilers want it at about 1 to 1.5 bar. With the heating running it rises a little, and that's normal. Vaillant, for one, say 1 to 2 bar is fine while it's on.

Down near zero and most boilers will stop and show a fault. The manual shows how to top it up with the filling loop, and plenty of people do it themselves with the instructions in front of them. If you'd rather not, or it won't hold, that's one for a Gas Safe registered engineer.

The part that matters more: if you're topping it up every week, the water is going somewhere. A weeping valve, a drip under a floorboard, a radiator that's been bled and forgotten. Topping up again and again isn't a fix. Finding the leak is.

Go and look at yours now. What's it on?""")

# Tue 10 Nov - list. Source: Worcester Bosch "Boiler not working in freezing temperatures?" - gurgling, EA code on
# boilers with a display, pour WARM not boiling water along the pipe if safe, then reset the boiler.
add(123, "2026-11-10 18:00", "list", "bwd_list_frozen_condensate",
    list_card("Frozen Condensate<br>Pipe? Four Steps", "Frosty morning, boiler gurgling, then nothing.",
              [("Find it.", "The plastic pipe from the boiler that goes outside to a drain. Usually white."),
               ("Warm water, not boiling.", "Pour it slowly along the outside run. A jug or a watering can is ideal."),
               ("Keep going", "until the water runs through freely."),
               ("Reset the boiler", "the way the manual says. It should fire back up.")],
              "Pipe high up the wall? Don't climb a ladder on ice. Still won't go? Ring a Gas Safe engineer."),
    "BWD — list: frozen condensate pipe",
    """Frosty morning, boiler gurgling, then nothing? On a lot of modern boilers that's a frozen condensate pipe, and it's one fault you can often sort yourself.

Condensing boilers make water as they run. It drains away through a plastic pipe, usually white, that goes out through the wall to a drain. In a hard frost the water in the outside section can freeze and block it, and the boiler shuts down. Worcester Bosch list a gurgling noise as the sign, and an EA code on their boilers with a display.

1. Find the pipe outside. Follow it from where it comes out of the wall.

2. Pour warm water slowly along it. Warm, not boiling. A jug or a watering can is ideal.

3. Keep going until the water runs through freely.

4. Reset the boiler the way the manual says. It should fire back up.

Where to stop: if the pipe runs high up the wall, don't go up a ladder on an icy morning to get at it. And if it's thawed and the boiler still won't go, that's a call to a Gas Safe registered engineer.

Anyone had this one already this year?""")

# Wed 11 Nov - light. Source: Seitron (thermostat maker) "Where to place the thermostat": about 1.5 m from the floor,
# away from draughts, windows, doors, direct sun and heat sources such as radiators.
add(124, "2026-11-11 18:00", "light", "bwd_light_thermostat_hall",
    light("The thermostat is in the hall, next to the front door that opens forty times a day.",
          "Every blast of cold air tells it the house is freezing. Thermostats like about 1.5 metres up, away from doors, radiators and sunshine."),
    "BWD — the light one: the thermostat in the hall",
    """The thermostat is in the hall, next to the front door that opens forty times a day, and it's in charge of the whole house.

Every time the door goes, it gets a blast of cold air and decides the house is freezing. Put it next to a radiator, or where the afternoon sun lands on it, and it gets the opposite idea and switches the heating off while everyone else is cold.

Thermostat makers give the same advice: about 1.5 metres off the floor, away from doors, windows, draughts, radiators and direct sun. A wireless one can simply be moved. A wired one is a job for a heating engineer or an electrician.

Where's yours? Hall, living room, or somewhere nobody can explain?""")

# Thu 12 Nov - bignum. Source: Energy Saving Trust "Roof and loft insulation": "Current building regulations recommend a
# minimum depth of 270mm for mineral wool insulation"; "an uninsulated home loses around 25% of its heat through the roof".
add(125, "2026-11-12 18:00", "bignum", "bwd_big_loft_270",
    bignum("Two Seventy.", "Millimetres. Take a tape measure up the loft.", "270mm",
           ["The depth of mineral wool loft insulation <b>building regulations recommend</b>, according to the Energy Saving Trust.",
            "They say an uninsulated home loses around a quarter of its heat through the roof."],
           "Up the loft for the decorations? Measure it while you're there."),
    "BWD — big number: two seventy",
    """Two hundred and seventy.

That's the depth in millimetres the Energy Saving Trust say current building regulations recommend for mineral wool loft insulation. They also say an uninsulated home loses around a quarter of its heat through the roof.

Plenty of lofts were insulated years ago to a fraction of that, and plenty more have had it pushed aside or squashed flat by boxes, suitcases and the old cot. Insulation works by trapping air. Flatten it and it can't.

The decorations will be coming down from the loft soon. Take a tape measure up with you.

How deep is yours? Anyone brave enough to go and measure?""")

# Fri 13 Nov - light (photo day switched). No figures; practical advice only.
add(126, "2026-11-13 18:00", "light", "bwd_light_new_noise",
    light("The boiler's started making a new noise. Turning the telly up is not a repair.",
          "Film it on your phone while it's doing it. Ten seconds of video beats any description of whoosh, then clunk."),
    "BWD — the light one: the new noise",
    """The boiler's started making a new noise. Turning the telly up is not a repair.

Boilers and heating systems make sounds, and a lot of them are harmless. A new one is still worth paying attention to, and the most useful thing you can do costs nothing: record it.

Get your phone out and film the boiler while it's doing it. Ten seconds is plenty. Then note when it happens. First thing when the heating comes on? Only when someone runs a hot tap? All the time?

Whoever comes to look at it will ask exactly that, and "it sort of goes whoosh, then clunk" is much harder to work from than a video.

Go on then, what's yours doing? Gurgling, banging, whistling, or the one nobody can describe?""")

# Sat 14 Nov - myth. Source: The Eco Experts on window condensation - on the inside means too much humidity in the room
# and little air circulation; between the panes usually means the sealant round the unit is deteriorating.
add(127, "2026-11-14 09:00", "myth", "bwd_myth_window_condensation",
    myth("Wipe it first. Then decide.",
         "Windows streaming every morning means you need new windows.",
         "Water you can wipe off the inside is the room: moist air hitting cold glass. Water between the panes is the window: the seal has gone.",
         "If it comes off on the cloth, look at the moisture in the house, not the glazing."),
    "BWD — myth: wet windows mean bad windows",
    """Myth: if the windows run with water every morning, you need new windows.

Usually not. Where the water is tells you which problem you've got.

On the inside of the glass, the side you can wipe: that's the room. There's too much moisture in the air, and when it meets the coldest surface in the room it turns back into water. The windows are just where it shows first. The fix is getting moisture out of the air: extractor fans on, lids on pans, a window open a crack, washing dried somewhere else.

Between the two panes, where you can't reach it: that's the window. The seal round the glazing unit is failing, and the unit needs looking at.

So go and wipe it. If it comes off on the cloth, it's the room. Which is yours?""")

# Sun 15 Nov - list. General radiator knowledge, no figures.
add(128, "2026-11-15 09:00", "list", "bwd_list_radiator_valves",
    list_card("Four Bits On A Radiator<br>And What They Do", "One of them is best left alone.",
              [("The one with numbers.", "That's the TRV. It senses the room and closes as it gets warm. Higher number, warmer room, not faster."),
               ("The plain cap at the other end.", "The lockshield. It's set when the system is balanced. Leave it."),
               ("The little square at the top.", "The bleed valve. Lets air out."),
               ("The joints underneath.", "Where leaks start. Run a dry tissue round them once a winter.")],
              "Ever turned the lockshield to see what it does? Be honest."),
    "BWD — list: four bits on a radiator",
    """Four bits on a radiator, and what each one actually does.

1. The valve with the numbers on. That's the thermostatic radiator valve, or TRV. It senses the temperature of the room and closes down as the room warms up. A higher number means a warmer room, not a faster one.

2. The plain plastic cap on the other end. That's the lockshield. It gets set when the system is balanced, so every radiator gets its share of hot water. Best left alone. Turning it to see what it does is how the radiator at the end of the house goes cold.

3. The little square at a top corner. The bleed valve. It lets out air that's collected at the top of the radiator.

4. The joints underneath, where the valves meet the pipes. That's where slow leaks usually start. Run a dry tissue round them once a winter. If it comes back damp, you've caught it early.

Ever turned the lockshield just to see what it does? Be honest.""")

# Mon 16 Nov - bignum (photo day switched). 16 Nov to 25 Dec 2026 = 14 days left in Nov + 25 = 39 days.
add(129, "2026-11-16 18:00", "bignum", "bwd_big_39_days",
    bignum("Thirty Nine.", "Days to Christmas, counting from today.", "39",
           ["If the boiler has been doing something odd all autumn, it <b>won't sort itself out</b> by the 25th.",
            "Christmas Day is a bad day to find out. Get it looked at while there's time."],
           "Hosting? Find the stopcock before the house fills up."),
    "BWD — big number: thirty nine days",
    """Thirty nine.

Days to Christmas, counting from today.

Not a sales pitch, just a nudge. If the boiler has been doing something odd all autumn (losing pressure, making a new noise, taking three goes to fire up), it isn't going to sort itself out by the 25th. Christmas Day is a bad day to find out, and the week before is busy for everyone.

If it's due a service, or something about it has been bothering you, get it looked at while there's time to sort it.

And if you're hosting this year, one for the list: know where the stopcock is before the house fills up.

Who's got the family round this year?""")

# Tue 17 Nov - list. Source: Northern Gas Networks carbon monoxide advice - fresh air, open doors and windows,
# switch off appliances if safe, go outside, call 0800 111 999 (24/7), seek medical help if unwell, don't re-enter until
# confirmed safe; symptoms headache, nausea, breathlessness, dizziness, collapse, loss of consciousness.
add(130, "2026-11-17 18:00", "list", "bwd_list_co_alarm_goes_off",
    list_card("If The CO Alarm<br>Goes Off", "Read it now, while it's quiet.",
              [("Fresh air.", "Open doors and windows."),
               ("Switch off", "anything that burns fuel, if it's safe to."),
               ("Everyone out.", "Don't go back in until you're told it's safe."),
               ("Ring 0800 111 999.", "Free, 24 hours. Anyone unwell, get medical help and say it could be CO.")],
              "No smell, no colour, no taste. That's why the alarm is there. Never ignore it."),
    "BWD — list: if the CO alarm goes off",
    """If the carbon monoxide alarm goes off, what do you do? Worth knowing now, while it's quiet.

1. Get fresh air in. Open doors and windows.

2. Turn off anything that burns fuel, like the boiler, a gas fire or the cooker, if it's safe to do so.

3. Get everyone out into the fresh air, and don't go back in until you've been told it's safe.

4. Ring the National Gas Emergency Service on 0800 111 999. Free, and open 24 hours.

If anyone has a headache, feels sick, dizzy or breathless, get medical help and tell them you think it could be carbon monoxide.

Don't assume it's a false alarm because nobody feels ill. You can't see, smell or taste carbon monoxide, which is the whole reason the alarm exists.

Screenshot this and send it to the one person in the family most likely to take the battery out.""")

# Wed 18 Nov - light. No figures; a suggestion, not a claim.
add(131, "2026-11-18 18:00", "light", "bwd_light_timer_early",
    light("The heating comes on at six. Everyone gets up at quarter past seven.",
          "Move the start fifteen minutes later each week. The week somebody complains, go back fifteen. That's your time."),
    "BWD — the light one: the heating comes on at six",
    """The heating comes on at six. Everyone gets up at quarter past seven.

Most timers were set years ago, sometimes by whoever lived there before, and nobody has touched them since. A lot of houses don't need anywhere near that long to warm up.

Try this. Move the morning start fifteen minutes later each week. The week somebody complains, go back fifteen minutes. That's your time, and every week before it was heat nobody was using.

Same at night. If the house is warm by eight and everyone's in bed by ten, try switching off half an hour earlier. A warm house holds its heat for a while after the boiler stops.

What time does yours come on, and what time do you actually get up?""")


if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    out = sys.argv[1] if len(sys.argv) > 1 else 'out'
    G = {p['image'][:-4]: p['_html'] for p in P}
    res = render(G, outdir=out, workdir=os.path.join(out, '_html'))
    bad = {k: v for k, v in res.items() if not v['ok']}
    for k, v in res.items(): print(k, v)
    print('rendered', len(res), 'problems:', bad)
    rows = [{k: v for k, v in p.items() if k != '_html'} for p in P]
    json.dump(rows, open(os.path.join(out, 'rows.json'), 'w'), indent=1, ensure_ascii=False)
    print('rows.json written', len(rows))
