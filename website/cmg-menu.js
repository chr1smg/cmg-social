/* ------------------------------------------------------------------
   CMG HEADER MENU - cmg-menu.js - LIVE, 11 September 2026
   Loaded site-wide in the footer by wp-content/mu-plugins/cmg-menu.php.
   Companion CSS: section 58 of wp-content/cmg-css/cmg.css.
   Record: claude project "Website", doc claude/CMG-Header-Menu-Rework-Sep-2026.md

   Approved by Chris 11 Sep 2026 ("Yes looks good") after v1 and v2 were
   both rejected. The full history is in the doc; read it before changing
   any of this.

   Does four things, all in the browser:
     1. Tags the services panel .cmg-v2 so section 58 can take hold.
     2. Moves the three childless services (Heat pumps, Bathrooms,
        Landlords) into a cards block, each with a line of detail read
        off its own live page. They are PROMOTED, not demoted.
     3. Adds Heat pumps and Bathrooms to the top bar as their own items,
        DESKTOP ONLY (>=1100px). On a phone they stay inside the Services
        panel as rows, so the drawer's explicit top-level selector list in
        section 57 does not need changing. If they are ever made real
        WordPress menu items, that list DOES need them adding or they
        will not appear on a phone.
     4. Puts a Back row and a title at the top of each phone panel.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  /* Subtitles read off the live pages on 11 Sep 2026. If a price or a
     claim changes on the page, change it here too - or drop the line. */
  var DETAIL = {
    'heat-pumps': 'Air source, MCS-certified design, £7,500 grant',
    'bathrooms':  'Whole room managed by one firm, tiling included',
    'landlords':  'CP12 £99 first appliance, £10 each extra'
  };

  function slugOf(href) {
    if (!href) { return ''; }
    var parts = href.split('?')[0].split('#')[0].split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
  }

  function buildCards(panel) {
    if (panel.querySelector('.cmg-v2-cards')) { return; }

    var loose = [];
    Array.prototype.forEach.call(panel.children, function (li) {
      if (li.tagName !== 'LI') { return; }
      if (li.querySelector(':scope > ul')) { return; }
      if (li.classList.contains('cmg-v2-cards')) { return; }
      loose.push(li);
    });
    if (!loose.length) { return; }

    var holder = document.createElement('li');
    holder.className = 'cmg-v2-cards';

    loose.forEach(function (li) {
      var a = li.querySelector('a');
      if (!a) { return; }
      var slug = slugOf(a.getAttribute('href'));
      var label = a.textContent.trim();
      var sub = DETAIL[slug] || '';

      a.className = (a.className ? a.className + ' ' : '') + 'cmg-v2-card';
      a.textContent = '';

      var wrap = document.createElement('span');
      var t = document.createElement('span');
      t.className = 'cmg-v2-t';
      t.textContent = label;
      wrap.appendChild(t);
      if (sub) {
        var s = document.createElement('span');
        s.className = 'cmg-v2-s';
        s.textContent = sub;
        wrap.appendChild(s);
      }
      var go = document.createElement('span');
      go.className = 'cmg-v2-go';
      go.setAttribute('aria-hidden', 'true');
      go.textContent = '›';

      a.appendChild(wrap);
      a.appendChild(go);

      holder.appendChild(a);
      li.parentNode.removeChild(li);
    });

    panel.appendChild(holder);
  }

  function promoteToTopBar(servicesLi) {
    if (window.innerWidth < 1100) { return; }
    var bar = servicesLi.parentNode;
    if (!bar || bar.querySelector('.cmg-v2-top')) { return; }

    var after = servicesLi;
    ['heat-pumps', 'bathrooms'].forEach(function (slug) {
      var src = document.querySelector('.cmg-v2-cards a[href*="/' + slug + '"]');
      if (!src) { return; }
      var li = document.createElement('li');
      li.className = 'cmg-v2-top menu-item';
      var a = document.createElement('a');
      a.href = src.getAttribute('href');
      var t = src.querySelector('.cmg-v2-t');
      a.textContent = t ? t.textContent : slug;
      li.appendChild(a);
      after.parentNode.insertBefore(li, after.nextSibling);
      after = li;
    });
  }

  /* ------------------------------------------------------------------
     v3, 11 Sep 2026. Chris on the phone view: "Doesnt look right. Also
     instead of the boxes dropping down, could we have them moving in
     from the left? Like the martindales"

     The slide itself is CSS (section 58). All this does
     is put a Back row and a title at the top of each panel so there is a
     way out of it. The existing drawer (WPCode snippet 1766) still owns
     the .cmg-open toggle — Back just removes that class, so the two
     never disagree about what is open.
     ------------------------------------------------------------------ */
  function addPanelChrome(topLi) {
    var sub = topLi.querySelector(':scope > ul');
    if (!sub || sub.querySelector(':scope > .cmg-v2-back')) { return; }

    var label = '';
    var a = topLi.querySelector(':scope > a');
    if (a) { label = a.textContent.trim(); }

    var back = document.createElement('li');
    back.className = 'cmg-v2-back';
    var btn = document.createElement('button');
    btn.type = 'button';
    var arrow = document.createElement('span');
    arrow.className = 'cmg-v2-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '\u2039';
    btn.appendChild(arrow);
    btn.appendChild(document.createTextNode('Back'));
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      topLi.classList.remove('cmg-open');
    });
    back.appendChild(btn);

    var title = document.createElement('li');
    title.className = 'cmg-v2-ptitle';
    title.textContent = label;

    sub.insertBefore(title, sub.firstChild);
    sub.insertBefore(back, sub.firstChild);
  }

  /* The drawer (snippet 1766) owns .cmg-open. Rather than duplicate its
     logic, watch for it and mirror it onto the nav as .cmg-v2-drilled, so
     section 58 can hide the rest of the drawer while a panel is over it.
     A MutationObserver rather than a click handler, so it stays correct
     whoever opens or closes the branch. */
  function watchDrill() {
    var nav = document.querySelector('.site-navigation');
    var menu = nav && nav.querySelector(':scope > ul.menu');
    if (!nav || !menu) { return; }

    var sync = function () {
      var open = menu.querySelector(':scope > li.cmg-open');
      nav.classList.toggle('cmg-v2-drilled', !!open);
    };

    new MutationObserver(sync).observe(menu, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
    sync();
  }

  function run() {
    var servicesLi = document.querySelector('.cmg-services-parent');
    if (!servicesLi) { return; }
    var panel = servicesLi.querySelector(':scope > ul');
    if (!panel) { return; }

    panel.classList.add('cmg-v2');
    buildCards(panel);
    promoteToTopBar(servicesLi);

    watchDrill();

    /* Every top-level item that opens a panel gets a way back out.
       .cmg-has-kids is added by snippet 1766 at every width, but it is
       added on DOMContentLoaded too, so fall back to "has a child ul"
       rather than depending on which script ran first. */
    var tops = document.querySelectorAll('.site-navigation > ul.menu > li');
    Array.prototype.forEach.call(tops, function (li) {
      if (li.querySelector(':scope > ul')) { addPanelChrome(li); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
