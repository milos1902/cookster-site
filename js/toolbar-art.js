/* Cookster: the old tool bar art is no longer used. The bottom centre is now the RACK (js/ranac-test.js): the six transparent click buttons
   (recent items) sit on the card places of the rack. The old wooden 6-slot picture stays hidden (also in old saves).
   ?starihud in the address keeps the old look. */
(function(){
'use strict';
if(/[?&]starihud(=|&|$)/.test(location.search))return;
var hideCss=document.createElement('style');
hideCss.textContent='img.ui-overlay-element[src*="drvena_traka_sest_polja"]{display:none!important}';
document.head.appendChild(hideCss);
})();
