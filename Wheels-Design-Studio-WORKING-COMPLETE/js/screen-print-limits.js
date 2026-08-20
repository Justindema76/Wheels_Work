(function(){
  'use strict';
  const designer=document.body?.dataset?.designer;
  if(designer!=='frame'&&designer!=='lexan') return;

  const STOCK=[
    ['HT Process Black','#000000'],['HT Process Cyan','#00AEEF'],['HT Process Magenta','#EC008C'],['HT Process Yellow','#FFF200'],
    ['Grey 429 C','#ADADAD'],['Silver / Clear','#C0C0C0'],['Gold / Clear','#D4AF37'],['White','#FFFFFF'],
    ['Process Blue','#008CCC'],['Reflex Blue','#171796'],['Violet C','#6600A1'],['Purple C','#BA1FB5'],
    ['Rhodamine Red','#E60094'],['Rubine Red','#CF035C'],['Orange 021 C','#ED6E00'],['Bright Orange','#FF5E00'],
    ['Warm Red','#F54029'],['Fire Red','#D71920'],['Emerald Green (355 C)','#009645'],['Green C','#00B394'],
    ['Medium Yellow (116 C)','#F7D117'],['Primrose Yellow (101 C)','#F5ED59'],['Yellow C','#F7E017']
  ];

  const method=document.getElementById('printMethodSelect');
  const methodPanel=document.querySelector('.print-method-panel');
  const upload=document.getElementById('uploadBtn');
  const addText=document.getElementById('addTextBtn');
  if(!method||!methodPanel||!upload||!addText) return;

  let maxColours=0;
  let selected=[];

  const style=document.createElement('style');
  style.textContent=`
    .screen-limit-wrap{display:none;flex-direction:column;gap:8px;margin-top:8px}
    .screen-limit-wrap.show{display:flex}
    .screen-limit-wrap label{font-size:11px!important;font-weight:700!important;color:#8b93a1!important;text-transform:uppercase!important}
    .screen-limit-wrap select{width:100%}
    .screen-limit-palette{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
    .screen-limit-ink{aspect-ratio:1;border-radius:6px;border:1px solid #ddd8d0;cursor:pointer;min-width:0;padding:0}
    .screen-limit-ink.active{outline:2px solid #c9171f;outline-offset:2px}
    .screen-limit-ink:disabled{opacity:.35;cursor:not-allowed}
    .screen-limit-names{font-size:10px;line-height:1.35;color:#59616d;font-weight:600}
    .screen-limit-warning{font-size:10px;line-height:1.35;color:#c9171f;font-weight:700}
  `;
  document.head.appendChild(style);

  const wrap=document.createElement('div');
  wrap.className='screen-limit-wrap';
  wrap.innerHTML=`
    <div class="field">
      <label for="screenImprintCount">Imprint Colour</label>
      <select id="screenImprintCount">
        <option value="">Choose an Option...</option>
        <option value="1">1 Colour</option>
        <option value="2">2 Colours</option>
        <option value="3">3 Colours</option>
      </select>
    </div>
    <div class="screen-limit-palette" id="screenLimitPalette" hidden></div>
    <div class="screen-limit-names" id="screenLimitNames"></div>
    <div class="screen-limit-warning" id="screenLimitWarning"></div>
  `;
  methodPanel.appendChild(wrap);

  const countSelect=wrap.querySelector('#screenImprintCount');
  const palette=wrap.querySelector('#screenLimitPalette');
  const names=wrap.querySelector('#screenLimitNames');
  const warning=wrap.querySelector('#screenLimitWarning');

  function ready(){
    return method.value!=='screen'||(maxColours>0&&selected.length===maxColours);
  }

  function syncButtons(){
    const locked=method.value==='screen'&&!ready();
    upload.disabled=locked;
    addText.disabled=locked;
  }

  function renderPalette(){
    palette.innerHTML='';
    if(!maxColours){
      palette.hidden=true;
      names.textContent='';
      warning.textContent='Choose 1, 2 or 3 colours before adding artwork.';
      syncButtons();
      return;
    }

    palette.hidden=false;
    STOCK.forEach(([name,hex])=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='screen-limit-ink';
      b.style.setProperty('background-color',hex,'important');
      b.title=name;
      b.setAttribute('aria-label',name);
      const isSelected=selected.some(x=>x.hex===hex);
      b.classList.toggle('active',isSelected);
      b.disabled=!isSelected&&selected.length>=maxColours;
      b.addEventListener('click',()=>{
        const i=selected.findIndex(x=>x.hex===hex);
        if(i>=0) selected.splice(i,1);
        else if(selected.length<maxColours) selected.push({name,hex});
        renderPalette();
        window.dispatchEvent(new CustomEvent('wheels:screenprintselection',{detail:{count:maxColours,colours:selected.slice()}}));
      });
      palette.appendChild(b);
    });

    names.textContent=selected.length
      ? 'Selected: '+selected.map(x=>x.name).join(' • ')
      : `Select ${maxColours} ${maxColours===1?'colour':'colours'}`;

    const remaining=maxColours-selected.length;
    warning.textContent=remaining>0
      ? `Choose ${remaining} more ${remaining===1?'colour':'colours'} before adding artwork.`
      : '';
    syncButtons();
  }

  function refreshMode(){
    const screen=method.value==='screen';
    wrap.classList.toggle('show',screen);
    if(!screen){
      maxColours=0;
      selected=[];
      countSelect.value='';
      palette.hidden=true;
      names.textContent='';
      warning.textContent='';
      upload.disabled=false;
      addText.disabled=false;
    }else{
      renderPalette();
    }
  }

  countSelect.addEventListener('change',()=>{
    maxColours=Number(countSelect.value)||0;
    selected=[];
    renderPalette();
    window.dispatchEvent(new CustomEvent('wheels:screenprintselection',{detail:{count:maxColours,colours:[]}}));
  });

  method.addEventListener('change',()=>setTimeout(refreshMode,0));

  window.WheelsScreenPrintSelection={
    get count(){return maxColours;},
    get colours(){return selected.slice();},
    isReady:ready
  };

  refreshMode();
})();