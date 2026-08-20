(function(){
  'use strict';

  // Common order colours stay visible first.
  // Remaining colours are available under the collapsible section.
  const PRIORITY = [
    '#FFFFFF', // White
    '#808080', // Grey
    '#000000', // Black
    '#C1272D', // Red
    '#1B75BC', // Blue
    '#FFF200', // Yellow
    '#39B54A', // Green
    '#F7941D', // Orange

    // Screen-print equivalents / alternates are ranked immediately after
    // their common digital counterparts when present.
    '#ADADAD', // Grey 429 C
    '#D71920', // Fire Red
    '#ED1C24', // Bright Red
    '#008CCC', // Process Blue
    '#171796', // Reflex Blue
    '#F7E017', // Yellow C
    '#F7D117', // Medium Yellow
    '#009645', // Emerald Green
    '#00B394', // Green C
    '#ED6E00', // Orange 021 C
    '#FF5E00'  // Bright Orange
  ];

  const PRIMARY_COUNT = 8;

  function normalizeHex(value){
    if(!value) return '';
    const v=String(value).trim();
    if(/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
    const m=v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if(!m) return '';
    return '#'+[m[1],m[2],m[3]].map(n=>(+n).toString(16).padStart(2,'0')).join('').toUpperCase();
  }

  function buttonHex(btn){
    return normalizeHex(
      btn.dataset.stockHex ||
      btn.dataset.color ||
      btn.dataset.value ||
      btn.style.backgroundColor ||
      getComputedStyle(btn).backgroundColor
    );
  }

  function priorityRank(btn){
    const hex=buttonHex(btn);
    const exact=PRIORITY.indexOf(hex);
    if(exact>=0) return exact;
    return 100;
  }

  function isColourField(field){
    const label=field.querySelector(':scope > label');
    if(!label) return false;
    const text=label.textContent.trim().toLowerCase();
    return text==='colour' || text==='print colour';
  }

  function enhanceField(field){
    if(!isColourField(field)) return;

    const original=field.querySelector(':scope > .swatch-grid');
    if(!original || original.dataset.collapsibleEnhanced==='true') return;

    const chips=[...original.querySelectorAll(':scope > .swatch-chip')];
    if(!chips.length) return;

    original.dataset.collapsibleEnhanced='true';
    original.style.gridTemplateColumns='';

    const ordered=chips.slice().sort((a,b)=>{
      const ar=priorityRank(a), br=priorityRank(b);
      if(ar!==br) return ar-br;
      return chips.indexOf(a)-chips.indexOf(b);
    });

    const shell=document.createElement('div');
    shell.className='artwork-colour-picker';

    const primary=document.createElement('div');
    primary.className='artwork-colour-picker__primary swatch-grid';

    const more=document.createElement('div');
    more.className='artwork-colour-picker__more swatch-grid';
    more.hidden=true;

    const toggle=document.createElement('button');
    toggle.type='button';
    toggle.className='artwork-colour-picker__toggle';
    toggle.textContent='More colours';
    toggle.setAttribute('aria-expanded','false');

    ordered.forEach((chip,index)=>{
      (index<PRIMARY_COUNT ? primary : more).appendChild(chip);
    });

    toggle.addEventListener('click',()=>{
      const open=toggle.getAttribute('aria-expanded')==='true';
      toggle.setAttribute('aria-expanded',String(!open));
      more.hidden=open;
      toggle.textContent=open?'More colours':'Fewer colours';
    });

    original.replaceWith(shell);
    shell.appendChild(primary);
    shell.appendChild(more);
    shell.appendChild(toggle);

    refreshCompactState(shell);
  }

  function refreshCompactState(shell){
    if(!shell || !shell.isConnected) return;
    const chips=[...shell.querySelectorAll('.swatch-chip')];
    const visible=chips.filter(chip=>{
      if(chip.classList.contains('screen-print-disabled-swatch')) return false;
      return getComputedStyle(chip).display!=='none';
    });
    shell.classList.toggle('is-compact',visible.length<=PRIMARY_COUNT);
  }

  function scan(){
    document.querySelectorAll('#objPanelHost .field').forEach(enhanceField);
    document.querySelectorAll('.artwork-colour-picker').forEach(refreshCompactState);
  }

  function start(){
    const host=document.getElementById('objPanelHost');
    if(!host) return;

    scan();

    new MutationObserver(()=>{
      requestAnimationFrame(scan);
    }).observe(host,{
      childList:true,
      subtree:true,
      attributes:true,
      attributeFilter:['class','style']
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
