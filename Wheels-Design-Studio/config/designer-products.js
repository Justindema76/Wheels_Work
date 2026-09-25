(function(){
  'use strict';

  window.WHEELS_DESIGNER_PRODUCTS = window.WHEELS_DESIGNER_PRODUCTS || {};

  window.WHEELS_DESIGNER_PRODUCTS.lexan = {
    defaultStyle: '106',
    styles: {
      // Actual Lexan band layouts. These are the only styles the Lexan
      // designer should expose; frame styles 101-104 belong to the frame tool.
      '105': {
        label: 'Style 105',
        radius: 32,
        holes: 'top2',
        insetT: 49,
        insetB: 44,
        bandLayout: 'frame101'
      },
      '106': {
        label: 'Style 106',
        radius: 30,
        holes: 'top2',
        insetT: 48,
        insetB: 91,
        bandLayout: 'frame102'
      },
      '107': {
        label: 'Style 107',
        radius: 30,
        holes: 'top2',
        insetT: 49,
        insetB: 109,
        bandLayout: 'frame103'
      },
      '108': {
        label: 'Style 108',
        radius: 24,
        holes: 'four',
        insetT: 42,
        insetB: 40,
        bandLayout: 'frame104'
      }
    }
  };
})();