(function(){
  'use strict';

  const designer=document.body?.dataset?.designer;
  if(designer!=='frame'&&designer!=='lexan') return;

  // Screen Print uses the exact same master palette as text and logo artwork.
  // The only Screen Print difference is that the customer must choose 1, 2 or 3
  // production colours before adding artwork.
  const STOCK=(window.WHEELS_GLOBAL_COLOURS||[])
    .filter(c=>c&&c.name&&/^#[0-9a-f]{6}$/i.test(c.hex||''))
    .map(c=>[String(c.name),String(c.hex).toUpperCase()]);

  if(!STOCK.length){
    console.error('Wheels Design Studio: global colour palette was not loaded.');
    return;
  }

  const configuredMax=3;
  const byHex=new Map(STOCK.map(([name,hex])=>[hex.toUpperCase(),name]));

  const method=document.getElementById('printMethodSelect');
  const methodPanel=document.querySelector('.print-method-panel');
  const upload=document.getElementById('uploadBtn');
  const addText=document.getElementById('addTextBtn');
  const objHost=document.getElementById('objPanelHost');
  if(!method||!methodPanel||!upload||!addText||!objHost) return;

  let currentMethod=method.value;
  let maxColours=0;
  let selected=[];

  const style=document.createElement('style');
  style.textContent=`
    #printMethodHint{display:none!important}
    .screen-limit-wrap{display:none;flex-direction:column;gap:5px;margin-top:5px}
    .screen-limit-wrap.show{display:flex}
    .screen-limit-wrap label{font-size:10px!important;font-weight:700!important;color:#8b93a1!important;text-transform:uppercase!important}
    .screen-limit-wrap select{width:100%;height:32px;padding:4px 8px;margin:0 0 4px 0}
    #screenLimitPalette{margin:0 0 2px 0}
    #screenLimitPalette .swatch-chip:disabled{opacity:.35;cursor:not-allowed}
    .screen-limit-names{font-size:9px;line-height:1.25;color:#59616d;font-weight:600;margin-top:3px}
    .screen-limit-warning{font-size:9px;line-height:1.25;color:#c9171f;font-weight:700;margin-top:1px}
    .screen-print-disabled-swatch{display:none!important}
  `;
  document.head.appendChild(style);

  const options=Array.from({length:configuredMax},(_,i)=>`<option value="${i+1}">${i+1} ${i===0?'Colour':'Colours'}</option>`).join('');
  const wrap=document.createElement('div');
  wrap.className='screen-limit-wrap';
  wrap.innerHTML=`
    <div class="field">
      <label for="screenImprintCount">Imprint Colour</label>
      <select id="screenImprintCount"><option value="">Choose an Option...</option>${options}</select>
    </div>
    <div class="swatch-grid" id="screenLimitPalette" hidden></div>
    <div class="screen-limit-names" id="screenLimitNames"></div>
    <div class="screen-limit-warning" id="screenLimitWarning"></div>`;
  methodPanel.appendChild(wrap);

  const countSelect=wrap.querySelector('#screenImprintCount');
  const palette=wrap.querySelector('#screenLimitPalette');
  const names=wrap.querySelector('#screenLimitNames');
  const warning=wrap.querySelector('#screenLimitWarning');

  function normalizeColour(v){
    if(!v) return '';
    v=String(v).trim();
    if(/^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
    const m=v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    return m?'#'+[m[1],m[2],m[3]].map(n=>(+n).toString(16).padStart(2,'0')).join('').toUpperCase():'';
  }

  function swatchHex(btn){
    for(const value of [btn.dataset.stockHex,btn.dataset.color,btn.dataset.value,btn.style.backgroundColor,getComputedStyle(btn).backgroundColor,btn.title]){
      const hex=normalizeColour(value); if(hex) return hex;
    }
    return '';
  }

  function ready(){ return method.value!=='screen'||(maxColours>0&&selected.length===maxColours); }
  function selectedHexes(){ return new Set(selected.map(x=>x.hex.toUpperCase())); }
  function syncButtons(){ const locked=method.value==='screen'&&!ready(); upload.disabled=locked; addText.disabled=locked; }

  function restrictObjectPalettes(){
    const chips=[...objHost.querySelectorAll('.swatch-chip')];
    if(method.value!=='screen'||!ready()){
      chips.forEach(btn=>btn.classList.remove('screen-print-disabled-swatch'));
      return;
    }
    const allowed=selectedHexes();
    chips.forEach(btn=>{
      const hex=swatchHex(btn);
      if(hex&&byHex.has(hex)){
        btn.dataset.stockHex=hex;
        btn.title=byHex.get(hex);
        btn.setAttribute('aria-label',byHex.get(hex));
      }
      btn.classList.toggle('screen-print-disabled-swatch',!!hex&&!allowed.has(hex));
    });
  }

  function renderPalette(){
    palette.innerHTML='';
    if(!maxColours){
      palette.hidden=true;
      names.textContent='';
      warning.textContent='Choose 1, 2 or 3 colours before adding artwork.';
      syncButtons(); restrictObjectPalettes(); return;
    }
    palette.hidden=false;
    STOCK.forEach(([name,hex])=>{
      const b=document.createElement('button');
      b.type='button'; b.className='swatch-chip';
      b.style.setProperty('background-color',hex,'important');
      b.title=name; b.setAttribute('aria-label',name); b.dataset.stockHex=hex;
      const isSelected=selected.some(x=>x.hex===hex);
      b.classList.toggle('active',isSelected);
      b.disabled=!isSelected&&selected.length>=maxColours;
      b.addEventListener('click',()=>{
        const i=selected.findIndex(x=>x.hex===hex);
        if(i>=0) selected.splice(i,1); else if(selected.length<maxColours) selected.push({name,hex});
        renderPalette(); restrictObjectPalettes();
        window.dispatchEvent(new CustomEvent('wheels:screenprintselection',{detail:{count:maxColours,colours:selected.slice()}}));
      });
      palette.appendChild(b);
    });
    names.textContent=selected.length?'Selected: '+selected.map(x=>x.name).join(' • '):`Select ${maxColours} ${maxColours===1?'colour':'colours'}`;
    const remaining=maxColours-selected.length;
    warning.textContent=remaining>0?`Choose ${remaining} more ${remaining===1?'colour':'colours'} before adding artwork.`:'';
    syncButtons(); restrictObjectPalettes();
  }

  function refreshMode(){
    currentMethod=method.value;
    const screen=method.value==='screen';
    wrap.classList.toggle('show',screen);
    if(!screen){
      maxColours=0; selected=[]; countSelect.value=''; palette.hidden=true;
      names.textContent=''; warning.textContent=''; upload.disabled=false; addText.disabled=false;
    }else renderPalette();
    restrictObjectPalettes();
  }

  countSelect.addEventListener('change',()=>{
    maxColours=Number(countSelect.value)||0; selected=[];
    renderPalette(); restrictObjectPalettes();
    window.dispatchEvent(new CustomEvent('wheels:screenprintselection',{detail:{count:maxColours,colours:[]}}));
  });

  method.addEventListener('change',()=>setTimeout(refreshMode,0));
  new MutationObserver(()=>restrictObjectPalettes()).observe(objHost,{childList:true,subtree:true});

  window.WheelsScreenPrintSelection={
    get count(){return maxColours;},
    get colours(){return selected.slice();},
    get stockColours(){return STOCK.map(([name,hex])=>({name,hex}));},
    isReady:ready
  };

  refreshMode();
})();