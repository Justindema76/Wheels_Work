(function(){
  'use strict';

  const stage = document.getElementById('stage');
  if (!stage) return;

  const designer = document.body?.dataset?.designer || '';
  const PRODUCT_WIDTH_IN = (designer === 'motorcycle') ? 7 : 12;

  const overlay = document.createElement('div');
  overlay.className = 'measurement-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  stage.appendChild(overlay);

  const hGuide = makeGuide('measurement-guide measurement-guide-h');
  const vGuide = makeGuide('measurement-guide measurement-guide-v');

  function makeGuide(className){
    const guide = document.createElement('div');
    guide.className = className;
    const line = document.createElement('div');
    line.className = 'measurement-line';
    const start = document.createElement('span');
    start.className = 'measurement-cap measurement-cap-start';
    const end = document.createElement('span');
    end.className = 'measurement-cap measurement-cap-end';
    const label = document.createElement('span');
    label.className = 'measurement-label';
    guide.append(line, start, end, label);
    overlay.appendChild(guide);
    return {guide,line,start,end,label};
  }

  function hide(){
    hGuide.guide.classList.remove('show');
    vGuide.guide.classList.remove('show');
  }

  function inches(px){
    const width = stage.getBoundingClientRect().width || 1;
    return (px / width) * PRODUCT_WIDTH_IN;
  }

  function formatInches(px){
    const value = inches(px);
    if (value < 0.01) return '0"';
    return value.toFixed(value < 1 ? 2 : 2).replace(/\.00$/, '') + '"';
  }

  function localRect(el){
    const sr = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      left:r.left-sr.left,
      right:r.right-sr.left,
      top:r.top-sr.top,
      bottom:r.bottom-sr.top,
      width:r.width,
      height:r.height,
      cx:(r.left+r.right)/2-sr.left,
      cy:(r.top+r.bottom)/2-sr.top
    };
  }

  function horizontalGap(a,b){
    if (a.right <= b.left) return {gap:b.left-a.right, x1:a.right, x2:b.left};
    if (b.right <= a.left) return {gap:a.left-b.right, x1:b.right, x2:a.left};
    return null;
  }

  function verticalGap(a,b){
    if (a.bottom <= b.top) return {gap:b.top-a.bottom, y1:a.bottom, y2:b.top};
    if (b.bottom <= a.top) return {gap:a.top-b.bottom, y1:b.bottom, y2:a.top};
    return null;
  }

  function overlapMid(a1,a2,b1,b2,fallback){
    const lo=Math.max(a1,b1), hi=Math.min(a2,b2);
    return lo<=hi ? (lo+hi)/2 : fallback;
  }

  function showHorizontal(measure, active, other){
    const y = overlapMid(active.top,active.bottom,other.top,other.bottom,(active.cy+other.cy)/2);
    const left = Math.min(measure.x1,measure.x2);
    const width = Math.abs(measure.x2-measure.x1);
    hGuide.guide.style.left = left+'px';
    hGuide.guide.style.top = y+'px';
    hGuide.guide.style.width = width+'px';
    hGuide.label.textContent = formatInches(width);
    hGuide.guide.classList.add('show');
  }

  function showVertical(measure, active, other){
    const x = overlapMid(active.left,active.right,other.left,other.right,(active.cx+other.cx)/2);
    const top = Math.min(measure.y1,measure.y2);
    const height = Math.abs(measure.y2-measure.y1);
    vGuide.guide.style.left = x+'px';
    vGuide.guide.style.top = top+'px';
    vGuide.guide.style.height = height+'px';
    vGuide.label.textContent = formatInches(height);
    vGuide.guide.classList.add('show');
  }

  function update(){
    const selected = stage.querySelector('#objLayer .obj.selected');
    const objects = [...stage.querySelectorAll('#objLayer .obj')].filter(el=>el!==selected);
    if (!selected || !objects.length){ hide(); return; }

    const active = localRect(selected);
    let nearestH=null, nearestV=null;

    objects.forEach(el=>{
      const other=localRect(el);
      const hg=horizontalGap(active,other);
      const vg=verticalGap(active,other);
      if(hg && (!nearestH || hg.gap<nearestH.measure.gap)) nearestH={measure:hg,other};
      if(vg && (!nearestV || vg.gap<nearestV.measure.gap)) nearestV={measure:vg,other};
    });

    hGuide.guide.classList.remove('show');
    vGuide.guide.classList.remove('show');
    if(nearestH) showHorizontal(nearestH.measure,active,nearestH.other);
    if(nearestV) showVertical(nearestV.measure,active,nearestV.other);
  }

  let activePointer=false;
  stage.addEventListener('pointerdown', e=>{
    if(e.target.closest('.obj')){
      activePointer=true;
      requestAnimationFrame(update);
    }
  },true);

  window.addEventListener('pointermove', ()=>{
    if(activePointer) requestAnimationFrame(update);
  },true);

  window.addEventListener('pointerup', ()=>{
    if(!activePointer) return;
    activePointer=false;
    requestAnimationFrame(update);
    setTimeout(hide,900);
  },true);

  window.addEventListener('resize', hide);

  const observer = new MutationObserver(()=>{
    if(activePointer) requestAnimationFrame(update);
  });
  const layer=document.getElementById('objLayer');
  if(layer) observer.observe(layer,{subtree:true,attributes:true,childList:true});
})();