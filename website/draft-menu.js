/* CMG draft layer - header dropdowns - 10 Sep 2026 - proposal only */
(function(){
  function build(){
    var mega = document.querySelector('.cmg-services-parent > ul');
    if (!mega || mega.querySelector('.cmg-also')) { return; }
    if (window.innerWidth < 1100) { return; }

    var kids = Array.prototype.slice.call(mega.children);
    var loose = kids.filter(function(li){
      return li.tagName === 'LI' && !li.querySelector(':scope > ul') && !/cmg-also|cmg-help/.test(li.className);
    });

    if (loose.length) {
      var li = document.createElement('li');
      li.className = 'cmg-also';
      var h = document.createElement('span');
      h.className = 'cmg-also-h';
      h.textContent = 'Also';
      li.appendChild(h);
      var ul = document.createElement('ul');
      loose.forEach(function(x){
        var a = x.querySelector('a');
        if (!a) { return; }
        var n = document.createElement('li');
        n.appendChild(a);
        ul.appendChild(n);
        x.parentNode.removeChild(x);
      });
      li.appendChild(ul);
      mega.appendChild(li);
    }

    var help = document.createElement('li');
    help.className = 'cmg-help';
    help.innerHTML =
      '<p>Not sure which one you need? Tell me what it is doing and I will say.</p>' +
      '<a class="cmg-help-tel" href="tel:01204961827">01204 961827</a>' +
      '<p class="cmg-help-s">Gas Safe and CIPHE registered &middot; &pound;132 call-out, first 90 minutes included</p>';
    mega.appendChild(help);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
