/* Wheels Design Studio — master artwork colour palette.
   This is the single colour list used by every designer for text, logo artwork,
   and screen-print production colour selection. Do not create product-specific
   artwork colour lists elsewhere. */
(function(){
  'use strict';

  window.WHEELS_GLOBAL_COLOURS = Object.freeze([
    {name:'HT Process Black', hex:'#000000'},
    {name:'HT Process Cyan', hex:'#00AEEF'},
    {name:'HT Process Magenta', hex:'#EC008C'},
    {name:'HT Process Yellow', hex:'#FFF200'},
    {name:'Grey 429 C', hex:'#ADADAD'},
    {name:'Silver / Clear', hex:'#C0C0C0'},
    {name:'Gold / Clear', hex:'#D4AF37'},
    {name:'White', hex:'#FFFFFF'},
    {name:'Process Blue', hex:'#008CCC'},
    {name:'Reflex Blue', hex:'#171796'},
    {name:'Violet C', hex:'#6600A1'},
    {name:'Purple C', hex:'#BA1FB5'},
    {name:'Rhodamine Red', hex:'#E60094'},
    {name:'Rubine Red', hex:'#CF035C'},
    {name:'Orange 021 C', hex:'#ED6E00'},
    {name:'Bright Orange', hex:'#FF5E00'},
    {name:'Warm Red', hex:'#F54029'},
    {name:'Fire Red', hex:'#D71920'},
    {name:'Emerald Green (355 C)', hex:'#009645'},
    {name:'Green C', hex:'#00B394'},
    {name:'Medium Yellow (116 C)', hex:'#F7D117'},
    {name:'Primrose Yellow (101 C)', hex:'#F5ED59'},
    {name:'Yellow C', hex:'#F7E017'}
  ]);

  window.WHEELS_GLOBAL_COLOUR_HEXES = Object.freeze(
    window.WHEELS_GLOBAL_COLOURS.map(colour=>colour.hex.toUpperCase())
  );
})();
