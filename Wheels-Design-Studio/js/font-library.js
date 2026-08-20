(function(){
  'use strict';

  const FONT_OPTIONS = [
    'Arial',
    'Helvetica',
    'Gotham',
    'Baskerville',
    'Bodoni',
    'Playfair Display',
    'Fruitiger',
    'Frutiger',
    'News Gothic',
    'Bebas',
    'Futura',
    'Space Bold',
    'Serpentine Bold',
    'Alkaria Regular',
    'Brush',
    'Impact Bold',
    'Ethnocentric Bold',
    'Eurostile',

    /* Existing Wheels designer fonts */
    'Oswald',
    'Inter',
    'Anton',
    'Bebas Neue',
    'Racing Sans One',
    'Teko',
    'Rajdhani',
    'Archivo Black',
    'Barlow Condensed',
    'Orbitron',
    'Big Shoulders Display',
    'Staatliches',
    'Saira Condensed',
    'Fjalla One',
    'Titan One',
    'Russo One',
    'Squada One',
    'Pathway Gothic One',
    'Khand',
    'Exo 2',
    'Michroma',
    'Chakra Petch'
  ];

  window.WheelsFontLibrary = Object.freeze(FONT_OPTIONS.slice());

  function loadFontStyles(){
    if(document.querySelector('link[data-wheels-font-library]')) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/font-library.css';
    link.dataset.wheelsFontLibrary = 'true';
    document.head.appendChild(link);
  }

  function findFontSelects(){
    const fields = document.querySelectorAll('.field');
    const selects = [];

    fields.forEach(field=>{
      const label = field.querySelector('label');
      const select = field.querySelector('select');
      if(!label || !select) return;
      if(label.textContent.trim().toLowerCase() === 'font') selects.push(select);
    });

    return selects;
  }

  function syncFontSelect(select){
    if(select.dataset.wheelsFontLibrary === 'ready') return;

    const current = select.value;
    const existingValues = new Set([...select.options].map(option=>option.value));

    FONT_OPTIONS.forEach(font=>{
      if(existingValues.has(font)) return;
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      select.appendChild(option);
    });

    if(current && [...select.options].some(option=>option.value===current)){
      select.value = current;
    }

    select.dataset.wheelsFontLibrary = 'ready';
  }

  function syncAllFontSelects(){
    findFontSelects().forEach(syncFontSelect);
  }

  function start(){
    loadFontStyles();
    syncAllFontSelects();

    const host = document.getElementById('objPanelHost') || document.body;
    new MutationObserver(()=>syncAllFontSelects())
      .observe(host,{childList:true,subtree:true});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',start,{once:true});
  } else {
    start();
  }
})();
