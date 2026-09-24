

// ============================================================
// ZIP DOWNLOAD SUPPORT
// Creates a standards-compliant ZIP in the browser without an
// additional JavaScript library, keeping this project at one JS file.
// Files are stored without compression so PNG/PDF/logo source files
// remain byte-for-byte intact.
// ============================================================
(function(){
  const table = new Uint32Array(256);
  for(let n=0;n<256;n++){
    let c=n;
    for(let k=0;k<8;k++) c=(c&1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1);
    table[n]=c>>>0;
  }
  function crc32(bytes){
    let c=0xFFFFFFFF;
    for(let i=0;i<bytes.length;i++) c=table[(c^bytes[i])&0xFF] ^ (c>>>8);
    return (c^0xFFFFFFFF)>>>0;
  }
  function u16(v){ return new Uint8Array([v&255,(v>>>8)&255]); }
  function u32(v){ return new Uint8Array([v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]); }
  function concat(parts){
    const len=parts.reduce((n,p)=>n+p.length,0), out=new Uint8Array(len);
    let off=0; for(const p of parts){ out.set(p,off); off+=p.length; } return out;
  }
  function dosDateTime(date){
    const d=date || new Date();
    const time=((d.getHours()&31)<<11)|((d.getMinutes()&63)<<5)|((Math.floor(d.getSeconds()/2))&31);
    const year=Math.max(1980,d.getFullYear());
    const dt=(((year-1980)&127)<<9)|(((d.getMonth()+1)&15)<<5)|(d.getDate()&31);
    return {time,date:dt};
  }
  async function toBytes(data){
    if(data instanceof Uint8Array) return data;
    if(data instanceof ArrayBuffer) return new Uint8Array(data);
    if(data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
    return new TextEncoder().encode(String(data ?? ''));
  }
  window.WheelsZip = {
    dataUriToBytes(dataUri){
      const comma=dataUri.indexOf(',');
      if(comma<0) return new Uint8Array();
      const head=dataUri.slice(0,comma), body=dataUri.slice(comma+1);
      if(/;base64/i.test(head)){
        const bin=atob(body), out=new Uint8Array(bin.length);
        for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
        return out;
      }
      return new TextEncoder().encode(decodeURIComponent(body));
    },
    async make(entries){
      const local=[], central=[];
      let offset=0;
      for(const entry of entries){
        const nameBytes=new TextEncoder().encode(entry.name.replace(/\\/g,'/'));
        const bytes=await toBytes(entry.data);
        const crc=crc32(bytes), size=bytes.length, stamp=dosDateTime(entry.date || new Date());
        const localHeader=concat([
          u32(0x04034b50),u16(20),u16(0),u16(0),u16(stamp.time),u16(stamp.date),
          u32(crc),u32(size),u32(size),u16(nameBytes.length),u16(0),nameBytes
        ]);
        local.push(localHeader,bytes);
        const centralHeader=concat([
          u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(stamp.time),u16(stamp.date),
          u32(crc),u32(size),u32(size),u16(nameBytes.length),u16(0),u16(0),u16(0),u16(0),
          u32(0),u32(offset),nameBytes
        ]);
        central.push(centralHeader);
        offset += localHeader.length + bytes.length;
      }
      const centralBytes=concat(central);
      const end=concat([
        u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),
        u32(centralBytes.length),u32(offset),u16(0)
      ]);
      return new Blob([...local,centralBytes,end],{type:'application/zip'});
    }
  };
})();

/* WHEELS DESIGN STUDIO - ALL DESIGNERS
   One JavaScript file for all four designer HTML pages. */
(function(){
  "use strict";
  const designer = document.body && document.body.dataset ? document.body.dataset.designer : "";

  if (designer === "plate-cover" || designer === "motorcycle") {
(function(){
  "use strict";

  // ---------------- geometry / style config ----------------
  const IS_MOTORCYCLE = document.body.dataset.designer === 'motorcycle';
  // Passenger cover: 12 x 6 in. Motorcycle cover: 7 in wide with variable height.
  const VW = IS_MOTORCYCLE ? 700 : 800;
  let VH = 400;
  // The frame retains the original four styles exactly.  Lexan has its own
  // four layouts; the printed bands are intentionally independent of frame
  // material and colour choices.
  const FRAME_STYLE_CFG = {
    '101': { radius:32, holes:'top2', insetT:49, insetB:44, l:34, r:34,
             tab:{x1:140, x2:660, topY:330}, label:'Style 101' },
    '102': { radius:30, holes:'top2', insetT:48, insetB:91, l:34, r:34,
             tab:null, label:'Style 102' },
    '103': { radius:30, holes:'top2', insetT:49, insetB:109, l:38, r:38,
             tab:null, label:'Style 103' },
    '104': { radius:24, holes:'four', insetT:42, insetB:40, l:34, r:34,
             tab:null, label:'Style 104' }
  };

  // Rigid, digitally printed plastic plate layouts.  The selected colour
  // covers the full face of the plate, rather than only a frame or band.
  const LEXAN_STYLE_CFG = {
    '101': { radius:17, holes:(IS_MOTORCYCLE ? 'top2' : 'four'), slotMode:'slots', finish:'flat', label:'Style 101' },
    '102': { radius:17, holes:'top2', slotMode:'slots', finish:'embossed', label:'Style 102' }
  };

  function roundedRectPath(x,y,w,h,r){
    const p = new Path2D();
    r = Math.min(r, w/2, h/2);
    p.moveTo(x+r,y);
    p.arcTo(x+w,y,x+w,y+h,r);
    p.arcTo(x+w,y+h,x,y+h,r);
    p.arcTo(x,y+h,x,y,r);
    p.arcTo(x,y,x+w,y,r);
    p.closePath();
    return p;
  }

  // Lightens (positive percent) or darkens (negative) a hex colour by
  // shifting each channel - used to build a subtle material gradient for
  // any custom frame/band colour, the same way black/silver/white already have one.
  function shadeHex(hex, percent){
    const h = hex.replace('#','');
    let r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    const amt = Math.round(255*percent/100);
    r = Math.min(255, Math.max(0, r+amt));
    g = Math.min(255, Math.max(0, g+amt));
    b = Math.min(255, Math.max(0, b+amt));
    return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
  }

  // The frame/band colour list: the three original material finishes plus
  // the standard flat colour chart, so existing black/silver/white keep
  // their dedicated polished look while any other pick gets a generic
  // subtle-gradient material treatment built from its own hex value.
  const FRAME_COLOR_SWATCHES = [
    {v:'black', hex:'#111112', label:'Black'},
    {v:'silver', hex:'#b7b9b9', label:'Silver'},
    {v:'white', hex:'#eeeeeb', label:'White'}
  ];

  const BAND_COLOR_SWATCHES = [
    {v:'black', hex:'#111112', label:'Black'},
    {v:'silver', hex:'#b7b9b9', label:'Silver'},
    {v:'white', hex:'#ffffff', label:'White'},
    {v:'#C1272D', hex:'#C1272D', label:'Red'},
    {v:'#ED1C24', hex:'#ED1C24', label:'Bright Red'},
    {v:'#F7941D', hex:'#F7941D', label:'Orange'},
    {v:'#8DC63F', hex:'#8DC63F', label:'Lime Green'},
    {v:'#39B54A', hex:'#39B54A', label:'Green'},
    {v:'#26A9E0', hex:'#26A9E0', label:'Sky Blue'},
    {v:'#0071BC', hex:'#0071BC', label:'Blue'},
    {v:'#1B3F8B', hex:'#1B3F8B', label:'Royal Blue'},
    {v:'#0A2463', hex:'#0A2463', label:'Navy'}
  ];

  // Resolves a frame/band colour value (named or hex) to its actual hex,
  // then picks black or white text for readable contrast against it - used
  // for the default "Add Text" colour so it works for any of the 13
  // swatches, not just a literal check for the string 'white'.
  function getContrastTextColor(v){
    const entry = BAND_COLOR_SWATCHES.find(s=>s.v===v);
    const hex = (entry ? entry.hex : (typeof v==='string' && v.startsWith('#') ? v : '#000000')).replace('#','');
    const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
    return luminance > 0.6 ? '#17181c' : '#ffffff';
  }

  // Lexan is screen printed: every selected band colour must be one flat
  // colour, including the black, silver, and white swatches.
  function solidLexanColour(color){
    const entry = BAND_COLOR_SWATCHES.find(s=>s.v===color);
    return entry ? entry.hex : color;
  }

  function framePaint(ctx,color,x,y,w,h){
    let g;
    if(color==='black'){
      g = ctx.createLinearGradient(x,y,x,y+h);
      g.addColorStop(0,'#232324'); g.addColorStop(0.5,'#111112'); g.addColorStop(1,'#1c1c1d');
    } else if(color==='silver'){
      g = ctx.createLinearGradient(x,y,x,y+h);
      g.addColorStop(0,'#c7c8c8'); g.addColorStop(0.5,'#b7b9b9'); g.addColorStop(1,'#c2c3c3');
    } else if(color==='white'){
      g = '#eeeeeb';
    } else {
      g = ctx.createLinearGradient(x,y,x,y+h);
      g.addColorStop(0, shadeHex(color,12));
      g.addColorStop(0.5, color);
      g.addColorStop(1, shadeHex(color,-12));
    }
    return g;
  }

  function openBottomPath(x,y,w,h,r){
    const p = new Path2D();
    r = Math.min(r, w/2, h);
    p.moveTo(x, y+h);
    p.lineTo(x, y+r);
    p.arcTo(x, y, x+r, y, r);
    p.lineTo(x+w-r, y);
    p.arcTo(x+w, y, x+w, y+r, r);
    p.lineTo(x+w, y+h);
    return p;
  }

  function drawFrame(ctx, styleId, color, scale, addBottomHoles = false, useSolidColour = false){
    const cfg = FRAME_STYLE_CFG[styleId];
    const W = VW*scale, H = VH*scale;
    ctx.clearRect(0,0,W,H);
    ctx.save();

    const outerPath = roundedRectPath(0,0,W,H,cfg.radius*scale);
    const fillColour = useSolidColour ? solidLexanColour(color) : framePaint(ctx,color,0,0,W,H);
    ctx.fillStyle = fillColour;
    ctx.fill(outerPath);
    ctx.strokeStyle = useSolidColour ? fillColour : (color==='black' ? '#050505' : '#8f8f8a');
    ctx.lineWidth = 2*scale;
    ctx.stroke(outerPath);

    const wx = cfg.l*scale, wy = cfg.insetT*scale;
    const ww = (VW-cfg.l-cfg.r)*scale, wh = (VH-cfg.insetT-cfg.insetB)*scale;
    const wpath = roundedRectPath(wx,wy,ww,wh,10*scale);

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill(wpath);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = useSolidColour ? fillColour :
      (color === "black"  ? "#050505" :
       color === "silver" ? "#8a8a86" :
                            "#9a9a94");
    ctx.lineWidth = 2 * scale;
    ctx.stroke(wpath);
    ctx.restore();

    if(cfg.tab){
      const tx = cfg.tab.x1*scale, tw = (cfg.tab.x2-cfg.tab.x1)*scale;
      const ty = cfg.tab.topY*scale, th = H - ty;
      const tabOpen = openBottomPath(tx,ty,tw,th,8*scale);
      ctx.fillStyle = fillColour;
      ctx.fill(tabOpen);
    }

    const holeX_l = 176*scale;
    const holeX_r = 624*scale;

    const topHoleR = 12*scale;
    const topPadW = 70*scale;
    const topPadH = 52*scale;
    const holeY_top = cfg.insetT*1.15*scale;

    [
      [holeX_l, holeY_top],
      [holeX_r, holeY_top]
    ].forEach(([hx,hy])=>{
      const padPath = roundedRectPath(
        hx-topPadW/2,
        hy-topPadH/2,
        topPadW,
        topPadH,
        topPadH*0.42
      );

      ctx.fillStyle = fillColour;
      ctx.fill(padPath);

      ctx.save();
      ctx.beginPath();
      ctx.arc(hx,hy,topHoleR,0,Math.PI*2);
      ctx.clip();
      ctx.clearRect(
        hx-topHoleR,
        hy-topHoleR,
        topHoleR*2,
        topHoleR*2
      );
      ctx.restore();
    });

    if(styleId === '104'){
      const holeY_bot = (VH - cfg.insetB*1.15)*scale;

      [
        [holeX_l, holeY_bot],
        [holeX_r, holeY_bot]
      ].forEach(([hx,hy])=>{
        const padPath = roundedRectPath(
          hx-topPadW/2,
          hy-topPadH/2,
          topPadW,
          topPadH,
          topPadH*0.42
        );

        ctx.fillStyle = fillColour;
        ctx.fill(padPath);

        ctx.save();
        ctx.beginPath();
        ctx.arc(hx,hy,topHoleR,0,Math.PI*2);
        ctx.clip();
        ctx.clearRect(
          hx-topHoleR,
          hy-topHoleR,
          topHoleR*2,
          topHoleR*2
        );
        ctx.restore();
      });
    } else if(addBottomHoles){
      const bottomHoleYByStyle = {
        '101': 387,
        '102': 400,
        '103': 388
      };

      const bottomHoleR = 10*scale;
      const holeY_bot = bottomHoleYByStyle[styleId]*scale;

      [
        [holeX_l, holeY_bot],
        [holeX_r, holeY_bot]
      ].forEach(([hx,hy])=>{
        ctx.save();
        ctx.beginPath();
        ctx.arc(hx,hy,bottomHoleR,0,Math.PI*2);
        ctx.clip();
        ctx.clearRect(
          hx-bottomHoleR,
          hy-bottomHoleR,
          bottomHoleR*2,
          bottomHoleR*2
        );
        ctx.restore();
      });
    }

    ctx.restore();
  }

  // Lexan plate cover: a clear polycarbonate panel with a printed colour
  // band at the top and/or bottom (reusing the same insetT/insetB
  // proportions as the frame layouts as the band thickness), rather than a
  // solid moulded border. The middle stays genuinely transparent - no white
  // fill - since that's what real clear plastic looks like.
  function drawCover(ctx, styleId, color, scale, addBottomHoles = false){
    const cfg = LEXAN_STYLE_CFG[styleId];
    const W = VW*scale, H = VH*scale;
    ctx.clearRect(0,0,W,H);
    ctx.save();

    const outerPath = roundedRectPath(0,0,W,H,cfg.radius*scale);

    // faint clear-plastic sheen so the panel is visible even where there's
    // no printed band
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fill(outerPath);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 2*scale;
    ctx.stroke(outerPath);

    // printed bands - clipped to the panel's own rounded shape so the top
    // band picks up the rounded top corners and the bottom band the
    // rounded bottom corners automatically
    ctx.save();
    ctx.clip(outerPath);
    ctx.fillStyle = solidLexanColour(color);
    ctx.fillRect(0, 0, W, cfg.insetT*scale);
    if(cfg.insetB > 0){
      ctx.fillRect(0, H-cfg.insetB*scale, W, cfg.insetB*scale);
    }

    // Styles 105-108 reproduce the four frame-shaped silhouettes supplied
    // by the customer, but as ink bands on a transparent Lexan panel.
    // The centre remains clear in every case.
    if(cfg.bandLayout){
      const sideWidth = (cfg.bandLayout==='frame103' ? 38 : 34) * scale;
      ctx.fillRect(0, 0, sideWidth, H);
      ctx.fillRect(W-sideWidth, 0, sideWidth, H);
      if(cfg.bandLayout==='frame101'){
        ctx.fillRect(140*scale, 330*scale, 520*scale, H-(330*scale));
      }
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 2*scale;
    ctx.stroke(outerPath);

    // mounting holes punched straight through the printed band, plain
    // circles (no raised pad - a printed band has no physical boss)
    const holeX_l = 176*scale;
    const holeX_r = 624*scale;
    const holeR = 9*scale;
    const holeY_top = (cfg.bandLayout ? cfg.insetT*1.15 : cfg.insetT*0.55)*scale;

    const punchHole = (hx,hy,r)=>{
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx,hy,r,0,Math.PI*2);
      ctx.clip();
      ctx.clearRect(hx-r,hy-r,r*2,r*2);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1*scale;
      ctx.beginPath();
      ctx.arc(hx,hy,r,0,Math.PI*2);
      ctx.stroke();
    };

    [[holeX_l,holeY_top],[holeX_r,holeY_top]].forEach(([hx,hy])=>punchHole(hx,hy,holeR));

    if(cfg.holes==='four'){
      const holeY_bot = H - (cfg.bandLayout ? cfg.insetB*1.15 : cfg.insetB*0.55)*scale;
      [[holeX_l,holeY_bot],[holeX_r,holeY_bot]].forEach(([hx,hy])=>punchHole(hx,hy,holeR));
    } else if(addBottomHoles && cfg.insetB > 30){
      const holeY_bot = H - cfg.insetB*0.55*scale;
      [[holeX_l,holeY_bot],[holeX_r,holeY_bot]].forEach(([hx,hy])=>punchHole(hx,hy,holeR));
    }

    ctx.restore();
  }

  function drawPlasticPlate(ctx, styleId, color, scale, addBottomHoles = false){
    const cfg = LEXAN_STYLE_CFG[styleId];
    const W = VW*scale, H = VH*scale;
    ctx.clearRect(0,0,W,H);
    ctx.save();

    const outer = roundedRectPath(0,0,W,H,cfg.radius*scale);
    ctx.fillStyle = solidLexanColour(color);
    ctx.fill(outer);

    // Border is drawn inside the motorcycle plate face.
    const borderPx = state.borderWidth * scale;
    const borderInset = state.borderInset * scale;
    const borderCentre = borderInset + borderPx/2;
    const face = outer;
    if(borderPx > 0 && W > borderCentre*2 && H > borderCentre*2){
      const borderPath = roundedRectPath(
        borderCentre, borderCentre, W-borderCentre*2, H-borderCentre*2,
        state.borderRadius*scale
      );
      ctx.lineWidth = borderPx;
      ctx.strokeStyle = solidLexanColour(state.borderColor);
      ctx.stroke(borderPath);
    }
    ctx.lineWidth = 2*scale;
    ctx.strokeStyle = 'rgba(0,0,0,0.30)';
    ctx.stroke(outer);

    // Keep the white swatch genuinely white. Other colours retain a subtle
    // printed-plastic sheen without changing their selected hue.
    if(color !== 'white' || state.embossed){
      const sheen = ctx.createLinearGradient(0,0,0,H);
      sheen.addColorStop(0,'rgba(255,255,255,0.15)');
      sheen.addColorStop(0.18,'rgba(255,255,255,0.03)');
      sheen.addColorStop(1,'rgba(0,0,0,0.10)');
      ctx.fillStyle = sheen;
      ctx.fill(face);
    }

    // Style 102: raised diamond embossing, like the embossed plate sample.
    if(state.embossed){
      ctx.save();
      ctx.clip(face);
      const step = 42*scale;
      ctx.lineWidth = 2.5*scale;
      ctx.strokeStyle = 'rgba(255,255,255,0.34)';
      for(let x=-H; x<W+H; x+=step){
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+H,H); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.17)';
      for(let x=0; x<W+H; x+=step){
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x-H,H); ctx.stroke();
      }
      ctx.restore();
    }

    // Motorcycle mounting pattern stays constant.
    // When height increases, the extra height is split equally between
    // the top and bottom so the entire hole pattern remains centred.
    // Example: 4" -> 5" adds 0.5" above AND 0.5" below.
    const holeX = IS_MOTORCYCLE ? [75*scale, 625*scale] : [(2.5/12)*W,(9.5/12)*W];
    const extraHeightPx = IS_MOTORCYCLE ? Math.max(0, VH - 400) : 0;
    const verticalOffset = extraHeightPx / 2;
    const topY = IS_MOTORCYCLE ? (45 + verticalOffset) * scale : (0.625/6)*H;
    const bottomY = IS_MOTORCYCLE ? (355 + verticalOffset) * scale : H-((0.625/6)*H);
    const useBottom = cfg.holes==='four' || addBottomHoles;
    const drawSlot = (x,y)=>{
      ctx.save();
      if(cfg.slotMode==='slots'){
        const slot = roundedRectPath(x-27*scale,y-9*scale,54*scale,18*scale,9*scale);
        ctx.fillStyle='#f7f7f4'; ctx.fill(slot);
        ctx.lineWidth=2*scale; ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.stroke(slot);
      } else {
        ctx.beginPath(); ctx.arc(x,y,9*scale,0,Math.PI*2);
        ctx.fillStyle='#f7f7f4'; ctx.fill();
        ctx.lineWidth=2*scale; ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.stroke();
      }
      ctx.restore();
    };
    holeX.forEach(x=>drawSlot(x,topY));
    if(useBottom) holeX.forEach(x=>drawSlot(x,bottomY));
    ctx.restore();
  }

  // Single entry point used by the stage, style thumbnails, preview, and PNG export.
  function drawPlate(ctx, styleId, color, scale, addBottomHoles, plateType){
    drawPlasticPlate(ctx, styleId, color, scale, addBottomHoles);
  }

  function currentStyleConfig(){
    return state.plateType === 'cover' ? LEXAN_STYLE_CFG : FRAME_STYLE_CFG;
  }

  function currentStyle(){
    return currentStyleConfig()[state.styleId];
  }

  // ---------------- state ----------------
  let uidCounter = 0;
  const state = {
    plateType: 'cover',
    plateHeight: 4,
    styleId: '101',
    color: 'black',
    borderColor: 'white',
    borderWidth: 4,
    borderInset: 10,
    borderRadius: 16,
    embossed: false,
    bottomHoles: false,
    printMethod: 'digital',
    objects: [],
    selectedId: null
  };

  const stage = document.getElementById('stage');
  const frameCanvas = document.getElementById('frameCanvas');
  const objLayer = document.getElementById('objLayer');
  const downloadNameInput = document.getElementById('downloadName');
  const fctx = frameCanvas.getContext('2d');

  // Center snapping guides for both text and uploaded artwork.
  const snapGuideV = document.createElement('div');
  snapGuideV.className = 'snap-guide snap-guide-v';
  const snapGuideH = document.createElement('div');
  snapGuideH.className = 'snap-guide snap-guide-h';
  stage.appendChild(snapGuideV);
  stage.appendChild(snapGuideH);

  function hideSnapGuides(){
    snapGuideV.classList.remove('show');
    snapGuideH.classList.remove('show');
  }

  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

  // ---------------- production artwork boundaries ----------------
  const ARTWORK_SAFE_PX = IS_MOTORCYCLE ? 12.5 : (VW/12)*0.125;
  const ARTWORK_SNAP_PCT = 1.5;

  function artworkBounds(){
    return {
      left:(ARTWORK_SAFE_PX/VW)*100,
      right:100-(ARTWORK_SAFE_PX/VW)*100,
      top:(ARTWORK_SAFE_PX/VH)*100,
      bottom:100-(ARTWORK_SAFE_PX/VH)*100
    };
  }

  function ensureArtworkGuide(){
    let box=document.getElementById('productionSafeBox');
    if(!box){
      box=document.createElement('div');
      box.id='productionSafeBox';
      box.style.position='absolute';
      box.style.border='2px dashed #df242b';
      box.style.boxSizing='border-box';
      box.style.pointerEvents='none';
      box.style.zIndex='4';
      const label=document.createElement('span');
      label.textContent='1/8 in safe';
      label.style.position='absolute';
      label.style.left='4px';
      label.style.top='4px';
      label.style.padding='2px 4px';
      label.style.borderRadius='3px';
      label.style.background='rgba(223,36,43,.92)';
      label.style.color='#fff';
      label.style.font='700 9px/1 Inter,sans-serif';
      label.style.textTransform='uppercase';
      box.appendChild(label);
      stage.insertBefore(box,objLayer);
    }
    const b=artworkBounds();
    box.style.left=b.left+'%';
    box.style.top=b.top+'%';
    box.style.width=(b.right-b.left)+'%';
    box.style.height=(b.bottom-b.top)+'%';
  }

  function showArtworkCenterGuide(){
    const b=artworkBounds();
    snapGuideV.style.left='50%';
    snapGuideV.style.top=b.top+'%';
    snapGuideV.style.bottom='auto';
    snapGuideV.style.height=(b.bottom-b.top)+'%';
    snapGuideV.classList.add('show');
  }

  function fitImageToSafeArea(naturalW,naturalH){
    const aspect=naturalW/naturalH;
    const k=(VW/VH)/aspect;
    const b=artworkBounds();
    const usableW=(b.right-b.left)*.82;
    const usableH=(b.bottom-b.top)*.82;
    const wPct=Math.max(1,Math.min(usableW,usableH/k));
    const hPct=wPct*k;
    return {aspect,k,wPct,hPct,xPct:50-wPct/2,yPct:50-hPct/2};
  }

  function constrainObjectToSafeArea(obj){
    if(!obj) return;
    const b=artworkBounds();

    if(obj.type==='image'){
      const maxW=Math.min(b.right-b.left,(b.bottom-b.top)/obj.k);
      if(obj.wPct>maxW){
        obj.wPct=maxW;
        obj.hPct=maxW*obj.k;
      }
      obj.xPct=clamp(obj.xPct,b.left,b.right-obj.wPct);
      obj.yPct=clamp(obj.yPct,b.top,b.bottom-obj.hPct);
      const el=objLayer.querySelector(`.obj[data-id="${obj.id}"]`);
      if(el){
        el.style.left=obj.xPct+'%';
        el.style.top=obj.yPct+'%';
        el.style.width=obj.wPct+'%';
        el.style.height=obj.hPct+'%';
      }
      return;
    }

    const el=objLayer.querySelector(`.obj[data-id="${obj.id}"]`);
    if(!el) return;
    const stageRect=stage.getBoundingClientRect();
    const minX=stageRect.left+b.left/100*stageRect.width;
    const maxX=stageRect.left+b.right/100*stageRect.width;
    const minY=stageRect.top+b.top/100*stageRect.height;
    const maxY=stageRect.top+b.bottom/100*stageRect.height;
    const txt=el.querySelector('.obj-text');

    let r=el.getBoundingClientRect();
    const scale=Math.min(1,
      r.width>0 ? (maxX-minX)/r.width : 1,
      r.height>0 ? (maxY-minY)/r.height : 1
    );
    if(scale<1 && txt){
      obj.fontSize=Math.max(8,Math.floor(obj.fontSize*scale*.96));
      txt.style.fontSize=(obj.fontSize*.125)+'cqw';
      r=el.getBoundingClientRect();
    }

    let dx=0,dy=0;
    if(r.left<minX) dx+=(minX-r.left)/stageRect.width*100;
    if(r.right>maxX) dx-=(r.right-maxX)/stageRect.width*100;
    if(r.top<minY) dy+=(minY-r.top)/stageRect.height*100;
    if(r.bottom>maxY) dy-=(r.bottom-maxY)/stageRect.height*100;
    obj.xPct+=dx;
    obj.yPct+=dy;
    el.style.left=obj.xPct+'%';
    el.style.top=obj.yPct+'%';
  }

  function constrainAllArtwork(){
    state.objects.forEach(constrainObjectToSafeArea);
  }

  function centerObjectHorizontally(obj){
    if(!obj) return;
    if(obj.type==='image') obj.xPct=50-obj.wPct/2;
    else obj.xPct=50;
    rebuildObjects();
    showArtworkCenterGuide();
    window.setTimeout(hideSnapGuides,500);
  }

  function updatePlateGeometry(){
    VH = IS_MOTORCYCLE ? Math.round(state.plateHeight * 100) : 400;
    stage.style.aspectRatio = `${VW} / ${VH}`;
    state.objects.forEach(obj=>{
      if(obj.type==='image' && obj.aspect){
        obj.k = (VW / VH) / obj.aspect;
        obj.hPct = obj.wPct * obj.k;
      }
    });
    ensureArtworkGuide();
    requestAnimationFrame(constrainAllArtwork);
  }

  function cleanDisplayText(value){
    return String(value ?? '')
      .replace(/&#183;|&middot;|·/gi, ' - ')
      .replace(/&#x2013;|&ndash;|–/gi, '-')
      .replace(/&#x2014;|&mdash;|—/gi, '-')
      .replace(/&amp;/gi, '&')
      .replace(/\s+-\s+-\s+/g, ' - ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // Builds the style/colour/holes suffix used in both the downloaded
  // filename and the on-screen summary, so they always stay in sync.
  function specSuffix(){
    const styleLabel = (currentStyle() && currentStyle().label) || state.styleId;
    const styleSlug = styleLabel.replace(/\s+/g,'').toLowerCase();
    const productSlug = IS_MOTORCYCLE ? 'motorcycle-plate-cover' : 'plate-sign';
    const colorSlug = state.color.replace('#','').toLowerCase();
    const printSlug = state.printMethod === 'screen' ? 'screen-print' : 'digital';
    if(!IS_MOTORCYCLE) return `${productSlug}-${printSlug}-${styleSlug}-${colorSlug}`;
    const sizeSlug = `7x${state.plateHeight.toFixed(1).replace('.0','')}`;
    const holesSlug = state.bottomHoles ? 'bottomholes' : 'nobottomholes';
    return `${productSlug}-${printSlug}-${sizeSlug}-${styleSlug}-${colorSlug}-${holesSlug}`;
  }

  function specSummary(){
    const styleLabel = (currentStyle() && currentStyle().label) || state.styleId;
    const colorEntry = BAND_COLOR_SWATCHES.find(s=>s.v===state.color);
    const colorLabel = colorEntry ? colorEntry.label : state.color;
    const productLabel = IS_MOTORCYCLE ? 'Motorcycle Plate Cover' : 'Plate Sign';
    const colorRole = 'Background';
    if(!IS_MOTORCYCLE) return `${productLabel} - Print: ${state.printMethod === 'screen' ? 'Screen Print' : 'Full Colour Digital'} - ${styleLabel} - ${colorRole}: ${colorLabel}`;
    const sizeLabel = `7" x ${state.plateHeight.toFixed(1).replace('.0','')}"`;
    const holesLabel = state.bottomHoles ? 'With bottom holes' : 'No bottom holes';
    return `${productLabel} - Print: ${state.printMethod === 'screen' ? 'Screen Print' : 'Full Colour Digital'} - ${sizeLabel} - ${styleLabel} - ${colorRole}: ${colorLabel} - ${holesLabel}`;
  }

  function sanitizeFileName(name){
    const cleaned = (name || '')
      .trim()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const base = cleaned || (IS_MOTORCYCLE ? 'my-motorcycle-cover' : 'my-plate-sign');
    return `${base}-${specSuffix()}`;
  }

  function refreshSpecSummary(){
    const el = document.getElementById('specSummary');
    if(el) el.textContent = cleanDisplayText(specSummary());
  }

  function refreshFileNamePreview(){
    const el = document.getElementById('fileNamePreview');
    if(el) el.textContent = cleanDisplayText(sanitizeFileName(downloadNameInput.value) + '.png');
  }

  function redrawFrame(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const cssW = stage.clientWidth || 700;
    const scale = (cssW/VW) * dpr;
    frameCanvas.width = VW*scale;
    frameCanvas.height = VH*scale;
    drawPlate(fctx, state.styleId, state.color, scale, state.bottomHoles);
    refreshSpecSummary();
    refreshFileNamePreview();
    ensureArtworkGuide();
    requestAnimationFrame(constrainAllArtwork);
    if(typeof updatePreviewWindow==='function') updatePreviewWindow();
  }

  // ---------------- object creation ----------------
  function addImageObject(src, naturalW, naturalH, originalFile){
    const fitted=fitImageToSafeArea(naturalW,naturalH);
    const obj = {
      id:'obj'+(uidCounter++), type:'image', src, originalSrc: src, originalFileName: originalFile?.name || 'uploaded-logo', originalFileType: originalFile?.type || '', originalFileData: src, bgRemoved:false,
      recolored:false, preRecolorSrc: null, recolorColor:'#c9171f',
      xPct:fitted.xPct, yPct:fitted.yPct,
      wPct:fitted.wPct, hPct:fitted.hPct, k:fitted.k, aspect:fitted.aspect
    };
    state.objects.push(obj);
    state.selectedId=obj.id;
    rebuildObjects();
    showArtworkCenterGuide();
    window.setTimeout(hideSnapGuides,500);
  }

  function removeWhiteBackground(src){
    return new Promise((resolve,reject)=>{
      const img = new Image();
      img.onload = ()=>{
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const cx = c.getContext('2d');
        cx.drawImage(img,0,0);
        const data = cx.getImageData(0,0,c.width,c.height);
        const d = data.data;
        const solidBelow = 205, transparentAbove = 246;
        for(let i=0;i<d.length;i+=4){
          const r=d[i],g=d[i+1],b=d[i+2];
          const minc = Math.min(r,g,b);
          if(minc >= transparentAbove){
            d[i+3] = 0;
          } else if(minc > solidBelow){
            const t = (minc-solidBelow)/(transparentAbove-solidBelow);
            d[i+3] = Math.round(d[i+3]*(1-t));
          }
        }
        cx.putImageData(data,0,0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  // Forces every non-transparent pixel to one flat colour while keeping the
  // original alpha (including any antialiased/semi-transparent edges) -
  // turns a multi-colour logo into a single-colour version, since screen
  // printing is charged per colour.
  function recolorToSolid(src, hexColor){
    return new Promise((resolve,reject)=>{
      const img = new Image();
      img.onload = ()=>{
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const cx = c.getContext('2d');
        cx.drawImage(img,0,0);
        const data = cx.getImageData(0,0,c.width,c.height);
        const d = data.data;
        const rr = parseInt(hexColor.slice(1,3),16);
        const gg = parseInt(hexColor.slice(3,5),16);
        const bb = parseInt(hexColor.slice(5,7),16);
        for(let i=0;i<d.length;i+=4){
          if(d[i+3] > 0){
            d[i]=rr; d[i+1]=gg; d[i+2]=bb;
          }
        }
        cx.putImageData(data,0,0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function addTextObject(text, opts){
    opts = opts || {};
    const obj = Object.assign({
      id:'obj'+(uidCounter++), type:'text', text: text,
      xPct:50, yPct:12, fontFamily:'Oswald', fontSize:34,
      color:'#ffffff', bold:true, italic:false, caps:false,
      align:'center', stretchX:1, stretchY:1
    }, opts);
    state.objects.push(obj);
    selectObject(obj.id);
    rebuildObjects();
  }

  function deleteObject(id){
    state.objects = state.objects.filter(o=>o.id!==id);
    if(state.selectedId===id) state.selectedId=null;
    rebuildObjects();
  }

  function selectObject(id){
    state.selectedId = id;
    rebuildObjects();
  }

  function getObj(id){ return state.objects.find(o=>o.id===id); }

  // ---------------- DOM rendering of objects ----------------
  function rebuildObjects(){
    objLayer.innerHTML = '';
    state.objects.forEach(obj=>{
      const el = document.createElement('div');
      el.className = 'obj' + (obj.id===state.selectedId ? ' selected' : '');
      el.dataset.id = obj.id;

      if(obj.type==='image'){
        el.style.left = obj.xPct+'%';
        el.style.top = obj.yPct+'%';
        el.style.width = obj.wPct+'%';
        el.style.height = obj.hPct+'%';
        const img = document.createElement('img');
        img.className='obj-img';
        img.src = obj.src;
        img.draggable = false;
        el.appendChild(img);

        if(obj.id===state.selectedId){
          const handle = document.createElement('div');
          handle.className = 'handle';
          handle.addEventListener('pointerdown', (e)=>startResize(e,obj));
          el.appendChild(handle);
        }
      } else {
        el.style.left = obj.xPct+'%';
        el.style.top = obj.yPct+'%';
        el.style.transform = 'translate(-50%,-50%)';
        const txt = document.createElement('div');
        txt.className = 'obj-text';
        txt.textContent = obj.caps ? (obj.text||'').toUpperCase() : obj.text;
        txt.style.fontFamily = `'${obj.fontFamily}', sans-serif`;
        txt.style.fontSize = (obj.fontSize*0.125)+'cqw';
        txt.style.color = obj.color;
        txt.style.fontWeight = obj.bold ? '700':'400';
        txt.style.fontStyle = obj.italic ? 'italic':'normal';
        txt.style.textAlign = obj.align;
        el.appendChild(txt);
      }

      el.addEventListener('pointerdown', (e)=>{
        if(e.target.classList.contains('handle')) return;
        selectObject(obj.id);
        startDrag(e,obj);
      });

      objLayer.appendChild(el);
    });
    renderLayersList();
    renderObjPanel();
    requestAnimationFrame(constrainAllArtwork);
    if(typeof updatePreviewWindow==='function') updatePreviewWindow();
  }

  // ---------------- drag ----------------
  let dragState=null, resizeState=null;

  function startDrag(e,obj){
    e.preventDefault();
    const rect = stage.getBoundingClientRect();
    dragState = {
      obj, rect,
      startClientX: e.clientX, startClientY: e.clientY,
      startXPct: obj.xPct, startYPct: obj.yPct
    };
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
  }
  function onDragMove(e){
    if(!dragState) return;
    const {obj, rect, startClientX, startClientY, startXPct, startYPct} = dragState;
    const dxPct = (e.clientX-startClientX)/rect.width*100;
    const dyPct = (e.clientY-startClientY)/rect.height*100;
    let nx=startXPct+dxPct, ny=startYPct+dyPct;
    const b=artworkBounds();

    if(obj.type==='image'){
      nx=clamp(nx,b.left,b.right-obj.wPct);
      ny=clamp(ny,b.top,b.bottom-obj.hPct);
      if(Math.abs((nx+obj.wPct/2)-50)<=ARTWORK_SNAP_PCT){
        nx=50-obj.wPct/2;
        showArtworkCenterGuide();
      } else {
        hideSnapGuides();
      }
    } else {
      nx=clamp(nx,b.left,b.right);
      ny=clamp(ny,b.top,b.bottom);
      if(Math.abs(nx-50)<=ARTWORK_SNAP_PCT){
        nx=50;
        showArtworkCenterGuide();
      } else {
        hideSnapGuides();
      }
    }

    obj.xPct=nx;
    obj.yPct=ny;
    const el=objLayer.querySelector(`.obj[data-id="${obj.id}"]`);
    if(el){
      el.style.left=nx+'%';
      el.style.top=ny+'%';
    }
    if(obj.type==='text') requestAnimationFrame(()=>constrainObjectToSafeArea(obj));
  }
  function onDragEnd(){
    if(dragState) constrainObjectToSafeArea(dragState.obj);
    hideSnapGuides();
    dragState=null;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
    if(typeof updatePreviewWindow==='function') updatePreviewWindow();
  }

  function startResize(e,obj){
    e.preventDefault(); e.stopPropagation();
    if(obj.type !== 'image') return;
    const rect = stage.getBoundingClientRect();
    resizeState = { obj, rect, kind:'image', startClientX:e.clientX, startWPct: obj.wPct };
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', onResizeEnd);
  }
  function onResizeMove(e){
    if(!resizeState) return;
    const {obj, rect, startClientX, startWPct} = resizeState;
    const dxPct=(e.clientX-startClientX)/rect.width*100;
    const b=artworkBounds();
    const maxWByX=b.right-obj.xPct;
    const maxWByY=(b.bottom-obj.yPct)/obj.k;
    const maxAllowed=Math.max(1,Math.min(maxWByX,maxWByY,b.right-b.left,(b.bottom-b.top)/obj.k));
    const nw=clamp(startWPct+dxPct,1,maxAllowed);
    obj.wPct=nw;
    obj.hPct=nw*obj.k;
    const el=objLayer.querySelector(`.obj[data-id="${obj.id}"]`);
    if(el){
      el.style.width=nw+'%';
      el.style.height=obj.hPct+'%';
    }
  }
  function onResizeEnd(){
    if(resizeState) constrainObjectToSafeArea(resizeState.obj);
    resizeState=null;
    window.removeEventListener('pointermove', onResizeMove);
    window.removeEventListener('pointerup', onResizeEnd);
    if(typeof updatePreviewWindow==='function') updatePreviewWindow();
  }

  // ---------------- layers list ----------------
  function renderLayersList(){
    const host = document.getElementById('layersList');
    host.innerHTML='';
    if(state.objects.length===0){
      host.innerHTML = '<div class="empty-note">Nothing added yet - upload a logo or add text.</div>';
      return;
    }
    [...state.objects].reverse().forEach(obj=>{
      const row = document.createElement('div');
      row.className = 'layer-item' + (obj.id===state.selectedId?' selected':'');
      const lbl = document.createElement('div');
      lbl.className='lbl';
      lbl.textContent = cleanDisplayText(obj.type==='image' ? 'Logo image' : (obj.text||'').slice(0,22));
      row.appendChild(lbl);
      const del = document.createElement('button');
      del.textContent='x';
      del.title='Delete';
      del.addEventListener('click',(ev)=>{ ev.stopPropagation(); deleteObject(obj.id); });
      row.appendChild(del);
      row.addEventListener('click', ()=> selectObject(obj.id));
      host.appendChild(row);
    });
  }

  // ---------------- object property panel ----------------
  const FONT_OPTIONS = ['Oswald','Inter','Anton','Bebas Neue','Racing Sans One','Teko','Rajdhani','Archivo Black','Barlow Condensed','Orbitron','Big Shoulders Display','Staatliches','Saira Condensed','Fjalla One','Titan One','Russo One','Squada One','Pathway Gothic One','Khand','Exo 2','Michroma','Chakra Petch'];

  const SWATCH_COLORS = [
    '#FFFFFF', '#808080', '#000000',
    '#C1272D', '#ED1C24', '#F7941D', '#FFF200',
    '#8DC63F', '#39B54A', '#29ABE2', '#1B75BC',
    '#233A87', '#662D91'
  ];

  // SCREEN PRINT STOCK COLOURS
  // Replace this one list with the approved Wheels stock ink codes when supplied.
  // Screen Print mode uses ONLY this list; Digital mode uses the full palette above.
  const SCREEN_PRINT_COLORS = [
    '#000000', // HT Process Black / Black
    '#00AEEF', // HT Process Cyan
    '#EC008C', // HT Process Magenta
    '#FFF200', // HT Process Yellow
    '#ADADAD', // Grey 429 C
    '#C0C0C0', // Silver / Clear (screen approximation)
    '#D4AF37', // Gold / Clear (screen approximation)
    '#FFFFFF', // White
    '#008CCC', // Process Blue
    '#171796', // Reflex Blue
    '#6600A1', // Violet C
    '#BA1FB5', // Purple C
    '#E60094', // Rhodamine Red
    '#CF035C', // Rubine Red
    '#ED6E00', // Orange 021 C
    '#FF5E00', // Bright Orange
    '#F54029', // Warm Red
    '#D71920', // Fire Red (screen approximation)
    '#009645', // Emerald Green (355 C)
    '#00B394', // Green C
    '#F7D117', // Medium Yellow (116 C)
    '#F5ED59', // Primrose Yellow (101 C)
    '#F7E017'  // Yellow C
  ];

  const SCREEN_PRINT_BAND_SWATCHES = [
    {v:'black', hex:'#000000', label:'Black'},
    {v:'grey', hex:'#808080', label:'Grey'},
    {v:'white', hex:'#FFFFFF', label:'White'}
  ];

  function activeArtworkColours(){
    return state.printMethod === 'screen' ? SCREEN_PRINT_COLORS : SWATCH_COLORS;
  }

  // A fixed colour-chart grid used everywhere instead of the native OS
  // colour picker - onPick(hex) fires immediately when a chip is clicked.
  function buildSwatchGrid(currentHex, onPick){
    const grid = document.createElement('div');
    grid.className = 'swatch-grid';
    activeArtworkColours().forEach(hex=>{
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'swatch-chip' + ((currentHex||'').toUpperCase()===hex ? ' active':'');
      // setProperty(...,'important') so this beats the Magento isolation
      // stylesheet's "background:#fff !important" rule on all buttons -
      // a plain inline style loses to that, an inline !important wins.
      sw.style.setProperty('background', hex, 'important');
      if(hex==='#FFFFFF') sw.classList.add('swatch-chip-white');
      sw.title = hex;
      sw.addEventListener('click', ()=>{
        grid.querySelectorAll('.swatch-chip').forEach(c=>c.classList.remove('active'));
        sw.classList.add('active');
        onPick(hex);
      });
      grid.appendChild(sw);
    });
    return grid;
  }

  function renderObjPanel(){
    const host = document.getElementById('objPanelHost');
    host.innerHTML='';
    const obj = getObj(state.selectedId);
    if(!obj) return;

    const panel = document.createElement('div');
    panel.className='obj-panel';

    const title = document.createElement('div');
    title.className='obj-panel-title';
    title.innerHTML = `<span>${obj.type==='image'?'Logo Settings':'Text Settings'}</span>`;
    const delBtn = document.createElement('button');
    delBtn.textContent='Delete';
    delBtn.addEventListener('click', ()=> deleteObject(obj.id));
    title.appendChild(delBtn);
    panel.appendChild(title);

    const positionField=document.createElement('div');
    positionField.className='field';
    positionField.innerHTML='<label>Position</label>';
    const centerBtn=document.createElement('button');
    centerBtn.type='button';
    centerBtn.className='btn';
    centerBtn.style.width='100%';
    centerBtn.textContent='Center Horizontally';
    centerBtn.addEventListener('click',()=>centerObjectHorizontally(obj));
    positionField.appendChild(centerBtn);
    panel.appendChild(positionField);

    if(obj.type==='text'){
      const fText = document.createElement('div');
      fText.className='field';
      fText.innerHTML = '<label>Text</label>';
      const ta = document.createElement('textarea');
      ta.className='text-input';
      ta.value = obj.text;
      ta.addEventListener('input', ()=>{
        obj.text = ta.value;
        updateTextEl(obj);
      });
      fText.appendChild(ta);
      panel.appendChild(fText);

      const row2 = document.createElement('div');
      row2.className='row2';

      const fFont = document.createElement('div');
      fFont.className='field';
      fFont.innerHTML='<label>Font</label>';
      const sel = document.createElement('select');
      FONT_OPTIONS.forEach(f=>{
        const o=document.createElement('option'); o.value=f; o.textContent=f;
        if(f===obj.fontFamily) o.selected=true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', ()=>{ obj.fontFamily=sel.value; updateTextEl(obj); });
      fFont.appendChild(sel);
      row2.appendChild(fFont);

      const fColor = document.createElement('div');
      fColor.className='field';
      fColor.innerHTML='<label>Colour</label>';
      const colorGrid = buildSwatchGrid(obj.color, (hex)=>{ obj.color=hex; updateTextEl(obj); });
      colorGrid.style.gridTemplateColumns = 'repeat(4,1fr)';
      fColor.appendChild(colorGrid);
      row2.appendChild(fColor);

      panel.appendChild(row2);
      const fSize = document.createElement('div');
      fSize.className='field';
      fSize.innerHTML = '<label>Font Size</label>';
      const sizeSel = document.createElement('select');
      [12,14,16,18,20,22,24,26,28,30,32,34,36,40,44,48,54,60,66,72,80,90].forEach(size=>{
        const opt=document.createElement('option');
        opt.value=String(size); opt.textContent=size+' pt';
        if(size===Number(obj.fontSize)) opt.selected=true;
        sizeSel.appendChild(opt);
      });
      if(![12,14,16,18,20,22,24,26,28,30,32,34,36,40,44,48,54,60,66,72,80,90].includes(Number(obj.fontSize))){
        const opt=document.createElement('option'); opt.value=String(obj.fontSize); opt.textContent=obj.fontSize+' pt'; opt.selected=true; sizeSel.appendChild(opt);
      }
      sizeSel.addEventListener('change', ()=>{ obj.fontSize=Number(sizeSel.value); obj.stretchX=1; obj.stretchY=1; updateTextEl(obj); });
      fSize.appendChild(sizeSel);
      panel.appendChild(fSize);

      const fStyleCase = document.createElement('div');
      fStyleCase.className='row2';

      const styleWrap = document.createElement('div');
      styleWrap.className='field';
      styleWrap.innerHTML='<label>Style</label>';
      const styleSel = document.createElement('select');
      const STYLE_OPTS = [
        {v:'regular', label:'Regular', bold:false, italic:false},
        {v:'bold', label:'Bold', bold:true, italic:false},
        {v:'italic', label:'Italic', bold:false, italic:true},
        {v:'bolditalic', label:'Bold Italic', bold:true, italic:true}
      ];
      const curStyleV = STYLE_OPTS.find(o=>o.bold===!!obj.bold && o.italic===!!obj.italic)?.v || 'regular';
      STYLE_OPTS.forEach(o=>{
        const opt=document.createElement('option'); opt.value=o.v; opt.textContent=o.label;
        if(o.v===curStyleV) opt.selected=true;
        styleSel.appendChild(opt);
      });
      styleSel.addEventListener('change', ()=>{
        const chosen = STYLE_OPTS.find(o=>o.v===styleSel.value);
        obj.bold = chosen.bold; obj.italic = chosen.italic;
        updateTextEl(obj);
      });
      styleWrap.appendChild(styleSel);
      fStyleCase.appendChild(styleWrap);

      const caseWrap = document.createElement('div');
      caseWrap.className='field';
      caseWrap.innerHTML='<label>Case</label>';
      const caseSel = document.createElement('select');
      [['normal','Normal'],['caps','ALL CAPS']].forEach(([v,label])=>{
        const opt=document.createElement('option'); opt.value=v; opt.textContent=label;
        if((v==='caps')===!!obj.caps) opt.selected=true;
        caseSel.appendChild(opt);
      });
      caseSel.addEventListener('change', ()=>{
        obj.caps = caseSel.value==='caps';
        updateTextEl(obj);
      });
      caseWrap.appendChild(caseSel);
      fStyleCase.appendChild(caseWrap);

      panel.appendChild(fStyleCase);
    } else {
      const note = document.createElement('div');
      note.style.fontSize='12px';
      note.style.color='var(--steel)';
      note.textContent = 'Drag the logo to move it. Drag the red dot on its corner to resize.';
      panel.appendChild(note);

      const bgField = document.createElement('div');
      bgField.className='field';
      bgField.innerHTML = '<label>Background</label>';
      const bgBtn = document.createElement('button');
      bgBtn.className='btn';
      bgBtn.style.width='100%';
      bgBtn.textContent = obj.bgRemoved ? 'Restore Original' : 'Remove White Background';
      bgBtn.addEventListener('click', async ()=>{
        bgBtn.disabled = true;
        bgBtn.textContent = 'Working...';
        try{
          if(obj.bgRemoved){
            obj.src = obj.originalSrc;
            obj.bgRemoved = false;
          } else {
            obj.src = await removeWhiteBackground(obj.originalSrc);
            obj.bgRemoved = true;
          }
          const imgEl = objLayer.querySelector(`.obj[data-id="${obj.id}"] img`);
          if(imgEl) imgEl.src = obj.src;
        } catch(err){
          console.error(err);
        }
        renderObjPanel();
      });
      bgField.appendChild(bgBtn);
      const bgHint = document.createElement('div');
      bgHint.style.fontSize='11px';
      bgHint.style.color='var(--steel)';
      bgHint.style.marginTop='2px';
      bgHint.textContent = 'Best for logos on a plain white background - handy before placing on black or silver.';
      bgField.appendChild(bgHint);
      panel.appendChild(bgField);

      // Single-colour recolour - screen printing is charged per colour, so
      // multi-colour logos need to be forced to one flat colour.
      const recolorField = document.createElement('div');
      recolorField.className='field';
      recolorField.innerHTML = '<label>Print Colour</label>';

      const rcSwatchGrid = document.createElement('div');
      rcSwatchGrid.className = 'swatch-grid';
      activeArtworkColours().forEach(hex=>{
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'swatch-chip' + (((obj.recolorColor||'').toUpperCase()===hex) ? ' active':'');
        // setProperty(...,'important') so this beats the Magento isolation
        // stylesheet's "background:#fff !important" rule on all buttons -
        // a plain inline style loses to that, an inline !important wins.
        sw.style.setProperty('background', hex, 'important');
        if(hex==='#FFFFFF') sw.classList.add('swatch-chip-white');
        sw.title = hex;
        sw.addEventListener('click', async ()=>{
          if(sw.disabled) return;
          rcSwatchGrid.querySelectorAll('.swatch-chip').forEach(c=>{ c.classList.remove('active'); c.disabled=true; });
          sw.classList.add('active');
          try{
            // always recolor from the pre-recolor source, so toggling between
            // swatches re-applies cleanly instead of recoloring an
            // already-recolored image
            const baseSrc = obj.recolored ? obj.preRecolorSrc : obj.src;
            if(!obj.recolored) obj.preRecolorSrc = obj.src;
            obj.recolorColor = hex;
            obj.src = await recolorToSolid(baseSrc, hex);
            obj.recolored = true;
            const imgEl = objLayer.querySelector(`.obj[data-id="${obj.id}"] img`);
            if(imgEl) imgEl.src = obj.src;
          } catch(err){
            console.error(err);
          }
          renderObjPanel();
        });
        rcSwatchGrid.appendChild(sw);
      });
      recolorField.appendChild(rcSwatchGrid);

      const recolorRow = document.createElement('div');
      recolorRow.className='row2';

      const rcBtn = document.createElement('button');
      rcBtn.className='btn';
      rcBtn.style.width='100%';
      rcBtn.disabled = !obj.recolored;
      rcBtn.textContent = 'Restore Original Colours';
      rcBtn.addEventListener('click', ()=>{
        if(!obj.recolored) return;
        obj.src = obj.preRecolorSrc;
        obj.recolored = false;
        obj.recolorColor = null;
        const imgEl = objLayer.querySelector(`.obj[data-id="${obj.id}"] img`);
        if(imgEl) imgEl.src = obj.src;
        renderObjPanel();
      });
      recolorRow.appendChild(rcBtn);
      recolorField.appendChild(recolorRow);

      const rcHint = document.createElement('div');
      rcHint.style.fontSize='11px';
      rcHint.style.color='var(--steel)';
      rcHint.style.marginTop='2px';
      rcHint.textContent = 'Click a colour to apply it instantly - every visible pixel in the logo becomes that one flat colour (shape and transparency are kept). Click another to switch.';
      recolorField.appendChild(rcHint);

      panel.appendChild(recolorField);
    }

    host.appendChild(panel);
  }

  function updateTextEl(obj){
    const wrap = objLayer.querySelector(`.obj[data-id="${obj.id}"]`);
    const el = wrap ? wrap.querySelector('.obj-text') : null;
    if(!el) return;
    el.textContent = obj.caps ? (obj.text||'').toUpperCase() : obj.text;
    el.style.fontFamily = `'${obj.fontFamily}', sans-serif`;
    el.style.fontSize = (obj.fontSize*0.125)+'cqw';
    el.style.color = obj.color;
    el.style.fontWeight = obj.bold?'700':'400';
    el.style.fontStyle = obj.italic ? 'italic':'normal';
    el.style.textAlign = obj.align;
    if(wrap){
      wrap.style.transform = 'translate(-50%,-50%)';
    }
  }

  // ---------------- style / colour controls ----------------
  function renderColourRow(){
    const row = document.getElementById('colourRow');
    row.innerHTML = '';
    const isCover = state.plateType === 'cover';
    const swatches = isCover ? BAND_COLOR_SWATCHES : FRAME_COLOR_SWATCHES;
    row.className = isCover ? 'swatch-grid' : 'swatch-row';

    // Restore the original frame selector: its three labelled material
    // finishes are deliberately not the multi-colour chart.
    if(!isCover){
      swatches.forEach(sw=>{
        const option = document.createElement('div');
        option.className = 'swatch' + (state.color===sw.v ? ' active':'');
        option.dataset.color = sw.v;
        option.innerHTML = `<div class="swatch-dot ${sw.v}"></div>${sw.label}`;
        option.addEventListener('click', ()=>{
          state.color = sw.v;
          renderColourRow();
          renderStyleRow();
          redrawFrame();
        });
        row.appendChild(option);
      });
      return;
    }

    swatches.forEach(sw=>{
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'swatch-chip' + (state.color===sw.v ? ' active':'');
      chip.style.setProperty('background', sw.hex, 'important');
      if(sw.v==='white') chip.classList.add('swatch-chip-white');
      chip.title = sw.label;
      chip.addEventListener('click', ()=>{
        state.color = sw.v;
        renderColourRow();
        renderStyleRow();
        redrawFrame();
      });
      row.appendChild(chip);
    });
  }

  function renderBorderColourRow(){
    const row = document.getElementById('borderColourRow');
    row.innerHTML = '';
    BAND_COLOR_SWATCHES.forEach(sw=>{
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'swatch-chip' + (state.borderColor===sw.v ? ' active':'');
      chip.style.setProperty('background', sw.hex, 'important');
      if(sw.v==='white') chip.classList.add('swatch-chip-white');
      chip.title = sw.label;
      chip.addEventListener('click', ()=>{
        state.borderColor = sw.v;
        renderBorderColourRow();
        redrawFrame();
      });
      row.appendChild(chip);
    });
  }

  function renderMaterialRow(){
    document.querySelectorAll('#materialRow .swatch').forEach(sw=>{
      sw.classList.toggle('active', sw.dataset.material===state.material);
      sw.onclick = ()=>{
        state.material = sw.dataset.material;
        const metal = state.material==='metal';
        document.getElementById('metalOptions').hidden = !metal;
        if(!metal){
          state.embossed = false;
          document.getElementById('embossingToggle').checked = false;
        }
        renderMaterialRow();
        redrawFrame();
      };
    });
  }

  function renderPlateTypeRow(){
    document.querySelectorAll('#plateTypeRow .swatch').forEach(sw=>{
      sw.classList.toggle('active', sw.dataset.type===state.plateType);
      sw.onclick = ()=>{
        state.plateType = sw.dataset.type;
        // A frame can only be black, silver, or white.  If a Lexan-only band
        // colour was selected, return to the original black frame default.
        if(state.plateType === 'frame' && !FRAME_COLOR_SWATCHES.some(c=>c.v===state.color)){
          state.color = 'black';
        }
        renderPlateTypeRow();
        updatePlateTypeLabels();
        renderColourRow();
        renderStyleRow();
        redrawFrame();
      };
    });
  }

  function updatePlateTypeLabels(){
    const isCover = state.plateType==='cover';
    document.getElementById('colourLabel').textContent = isCover ? 'Background Colour' : 'Frame Colour';
    document.getElementById('styleLabel').textContent = isCover ? 'Lexan Style' : 'Frame Style';
    const banner = document.getElementById('modeBanner');
    if(banner){
      banner.textContent = isCover ? 'Now designing: Lexan Plate Cover' : 'Now designing: Licence Plate Frame';
      banner.className = 'mode-banner ' + (isCover ? 'mode-cover' : 'mode-frame');
    }
  }

  function renderStyleRow(){
    const row = document.getElementById('styleRow');
    if(!row) return;
    row.innerHTML='';
    const styles = currentStyleConfig();
    Object.keys(styles).forEach(sid=>{
      const btn = document.createElement('div');
      btn.className='style-btn' + (sid===state.styleId?' active':'');
      const cvs = document.createElement('canvas');
      cvs.width=180; cvs.height=Math.round(180*VH/VW);
      const c2 = cvs.getContext('2d');
      drawPlate(c2, sid, state.color, 180/VW, state.bottomHoles);
      btn.appendChild(cvs);
      const lab = document.createElement('span');
      lab.textContent = styles[sid].label;
      btn.appendChild(lab);
      btn.addEventListener('click', ()=>{ state.styleId=sid; renderStyleRow(); redrawFrame(); });
      row.appendChild(btn);
    });
  }

  // ---------------- upload / add text / download / reset ----------------

  document.getElementById('uploadBtn').addEventListener('click', ()=>{
    document.getElementById('fileInput').click();
  });
  document.getElementById('fileInput').addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{
      const img = new Image();
      img.onload = ()=> addImageObject(ev.target.result, img.naturalWidth, img.naturalHeight, file);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value='';
  });

  document.getElementById('addTextBtn').addEventListener('click', ()=>{
    addTextObject('YOUR TEXT HERE', {yPct: 50, fontSize:30, color: getContrastTextColor(state.color)});
  });

  function clearDesigner(){
    state.plateType = 'cover';
    state.plateHeight = 4;
    VH = 400;
    stage.style.aspectRatio = '700 / 400';
    state.styleId = '101';
    state.color = 'black';
    state.borderColor = 'white';
    state.borderWidth = 4;
    state.borderInset = 10;
    state.borderRadius = 16;
    state.embossed = false;
    state.bottomHoles = false;
    state.objects = [];
    state.selectedId = null;

    downloadNameInput.value = IS_MOTORCYCLE ? 'my-motorcycle-cover' : 'my-custom-plate';
    document.getElementById('borderWidthSelect').value = String(state.borderWidth);
    document.getElementById('borderInsetSelect').value = String(state.borderInset);
    document.getElementById('borderRadiusSelect').value = String(state.borderRadius);
    document.getElementById('embossingToggle').checked = false;
    if(IS_MOTORCYCLE){
      if(IS_MOTORCYCLE) document.getElementById('bottomHolesToggle').checked = false;
      document.getElementById('plateHeightInput').value = '4';
    }
    renderColourRow();
    renderBorderColourRow();
    renderStyleRow();
    redrawFrame();
    rebuildObjects();
  }

  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(!confirm('Remove the current design and start over?')) return;
    clearDesigner();
  });

  // Renders the full current design (plate + all objects) to an offscreen
  // canvas at the given scale and hands it to callback(canvas). Shared by
  // the download button and the live preview window so they never drift
  // out of sync with each other.
  function renderFullDesignToCanvas(scale, callback){
    const cvs = document.createElement('canvas');
    cvs.width = VW*scale; cvs.height = VH*scale;
    const ctx = cvs.getContext('2d');
    drawPlate(ctx, state.styleId, state.color, scale, state.bottomHoles);

    let pending = state.objects.filter(o=>o.type==='image').length;
    const finish = ()=>{
      state.objects.forEach(obj=>{
        if(obj.type!=='text') return;
        ctx.save();
        const fontStyle = obj.italic ? 'italic' : 'normal';
        ctx.font = `${fontStyle} ${obj.bold?'700':'400'} ${obj.fontSize*scale*0.85}px '${obj.fontFamily}', sans-serif`;
        ctx.fillStyle = obj.color;
        ctx.textAlign = obj.align;
        ctx.textBaseline = 'middle';
        const x = obj.xPct/100*VW*scale;
        const y = obj.yPct/100*VH*scale;
        const displayText = obj.caps ? (obj.text||'').toUpperCase() : obj.text;
        const lines = displayText.split('\n');
        const lh = obj.fontSize*scale*0.85*1.15;
        const startY = y - (lh*(lines.length-1))/2;
        ctx.translate(x, y);
        ctx.scale(1, 1);
        ctx.translate(-x, -y);
        lines.forEach((line,i)=> ctx.fillText(line, x, startY+i*lh));
        ctx.restore();
      });
      callback(cvs);
    };
    if(pending===0){ finish(); return; }
    state.objects.forEach(obj=>{
      if(obj.type!=='image') return;
      const img = new Image();
      img.onload = ()=>{
        const x = obj.xPct/100*VW*scale, y = obj.yPct/100*VH*scale;
        const w = obj.wPct/100*VW*scale, h = obj.hPct/100*VH*scale;
        ctx.drawImage(img, x, y, w, h);
        pending--;
        if(pending===0) finish();
      };
      img.src = obj.src;
    });
  }

  function downloadDesign(){
    renderFullDesignToCanvas(1, (cvs)=>{
      cvs.toBlob((blob)=>{
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const chosenName = sanitizeFileName(downloadNameInput.value);
        a.href = url;
        a.download = `${chosenName}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        clearDesigner();
      });
    });
  }

  // ---------------- live preview window ----------------
  let previewWin = null;

  function openLivePreview(){
    if(previewWin && !previewWin.closed){
      previewWin.focus();
      updatePreviewWindow();
      return;
    }
    previewWin = window.open('', 'platePreview', 'width=980,height=680');
    if(!previewWin){
      alert('The preview window was blocked by the browser. Please allow pop-ups for this page and try again.');
      return;
    }
    previewWin.document.write(
      '<!DOCTYPE html><html><head><title>Live Preview</title><meta charset="UTF-8">' +
      '<style>' +
      'html,body{margin:0;height:100%;background:#2b2b2c;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif;}' +
      '#wrap{display:flex;flex-direction:column;align-items:center;gap:14px;}' +
      'img{max-width:88vw;max-height:78vh;box-shadow:0 24px 60px rgba(0,0,0,0.5);border-radius:6px;background:#fff;}' +
      '#label{color:#cfcfcf;font-size:13px;letter-spacing:.04em;text-transform:uppercase;}' +
      '</style></head><body><div id="wrap"><img id="livePreviewImg" alt="Live preview"><div id="label">Live Preview - updates automatically</div></div></body></html>'
    );
    previewWin.document.close();
    updatePreviewWindow();
  }

  function updatePreviewWindow(){
    if(!previewWin || previewWin.closed) return;
    renderFullDesignToCanvas(2, (cvs)=>{
      if(!previewWin || previewWin.closed) return;
      const imgEl = previewWin.document.getElementById('livePreviewImg');
      if(imgEl) imgEl.src = cvs.toDataURL('image/png');
    });
  }

  // ---------------- deselect on empty stage click ----------------
  stage.addEventListener('pointerdown', (e)=>{
    if(e.target===stage || e.target===frameCanvas || e.target===objLayer){
      state.selectedId=null;
      rebuildObjects();
    }
  });
  document.addEventListener('keydown', (e)=>{
    if((e.key==='Delete'||e.key==='Backspace') && state.selectedId){
      const active = document.activeElement;
      if(active && (active.tagName==='TEXTAREA' || active.tagName==='INPUT')) return;
      deleteObject(state.selectedId);
    }
  });


  function setupPrintMethodControls(){
    const select = document.getElementById('printMethodSelect');
    const hint = document.getElementById('printMethodHint');
    if(!select) return;
    select.value = state.printMethod;
    const refresh = ()=>{
      state.printMethod = select.value === 'screen' ? 'screen' : 'digital';
      if(hint) hint.textContent = state.printMethod === 'screen'
        ? 'Screen Print mode: artwork colours are restricted to the approved stock ink palette.'
        : 'Full Colour Digital mode: the full artwork colour palette is available.';
      renderObjPanel();
      if(typeof renderColourRow === 'function') renderColourRow();
      if(typeof renderBorderColourRow === 'function') renderBorderColourRow();
      refreshSpecSummary();
      refreshFileNamePreview();
    };
    select.addEventListener('change', refresh);
    refresh();
  }

  function productLabelForProduction(){
    if(document.body.dataset.designer === 'motorcycle') return 'Motorcycle Plate Cover';
    if(document.body.dataset.designer === 'plate-cover') return 'Plate Sign';
    if(document.body.dataset.designer === 'lexan') return 'Lexan Plate Cover';
    if(document.body.dataset.designer === 'plate-frame') return 'Licence Plate Frame';
    return 'Wheels Design';
  }

  function productionDetailsText(){
    const lines=[];
    lines.push('WHEELS DESIGN STUDIO');
    lines.push('PRODUCTION DETAILS');
    lines.push('');
    lines.push(`Product: ${productLabelForProduction()}`);
    lines.push(`Print Method: ${state.printMethod === 'screen' ? 'Screen Print' : 'Full Colour Digital'}`);
    lines.push(`Design Summary: ${specSummary()}`);
    lines.push(`Created: ${new Date().toLocaleString()}`);
    lines.push('');

    const textObjects=state.objects.filter(o=>o.type==='text');
    lines.push('TEXT');
    if(!textObjects.length){
      lines.push('No text added.');
    }else{
      textObjects.forEach((o,i)=>{
        lines.push(`Text ${i+1}: ${o.text || ''}`);
        lines.push(`  Font: ${o.fontFamily || ''}`);
        lines.push(`  Font Size: ${o.fontSize || ''}`);
        lines.push(`  Colour: ${o.color || ''}`);
        lines.push(`  Bold: ${o.bold ? 'Yes' : 'No'}`);
        lines.push(`  Italic: ${o.italic ? 'Yes' : 'No'}`);
        lines.push(`  Position: X ${Number(o.xPct||0).toFixed(2)}%, Y ${Number(o.yPct||0).toFixed(2)}%`);
      });
    }
    lines.push('');

    const imageObjects=state.objects.filter(o=>o.type==='image');
    lines.push('UPLOADED ARTWORK');
    if(!imageObjects.length){
      lines.push('No customer artwork uploaded.');
    }else{
      imageObjects.forEach((o,i)=>{
        lines.push(`${i+1}. ${o.originalFileName || `artwork-${i+1}`}`);
        lines.push(`   Original file type: ${o.originalFileType || 'unknown'}`);
        lines.push(`   Position: X ${Number(o.xPct||0).toFixed(2)}%, Y ${Number(o.yPct||0).toFixed(2)}%`);
        lines.push(`   Size: ${Number(o.wPct||0).toFixed(2)}% x ${Number(o.hPct||0).toFixed(2)}%`);
      });
    }
    lines.push('');
    lines.push('FILES');
    lines.push('See the PNG proof for the customer-created layout.');
    lines.push('Original customer artwork files are included in the original-artwork folder.');
    lines.push('');
    lines.push('IMPORTANT');
    lines.push('Use the original uploaded artwork for production wherever possible. The PNG is the visual layout/proof.');
    return lines.join('\r\n');
  }

  async function buildProductionZip(cvs, baseName){
    const pngBlob=await new Promise(resolve=>cvs.toBlob(resolve,'image/png'));
    const entries=[
      {name:`${baseName}-Design-Proof.png`, data:pngBlob},
      {name:'Production-Details.txt', data:productionDetailsText()}
    ];

    const usedNames=new Set(entries.map(e=>e.name.toLowerCase()));
    let artworkNumber=1;
    for(const obj of state.objects){
      if(obj.type!=='image' || !obj.originalFileData) continue;
      let originalName=(obj.originalFileName || `artwork-${artworkNumber}`).replace(/[\/:*?\"<>|]+/g,'-');
      if(!originalName) originalName=`artwork-${artworkNumber}`;
      let zipName=`original-artwork/${originalName}`;
      const dot=originalName.lastIndexOf('.');
      const stem=dot>0 ? originalName.slice(0,dot) : originalName;
      const ext=dot>0 ? originalName.slice(dot) : '';
      let copy=2;
      while(usedNames.has(zipName.toLowerCase())) zipName=`original-artwork/${stem}-${copy++}${ext}`;
      usedNames.add(zipName.toLowerCase());
      entries.push({name:zipName,data:WheelsZip.dataUriToBytes(obj.originalFileData)});
      artworkNumber++;
    }
    return WheelsZip.make(entries);
  }

  function downloadProductionPackage(){
    const btn=document.getElementById('downloadPackageBtn');
    const oldLabel=btn ? btn.textContent : '';
    if(btn){ btn.disabled=true; btn.textContent='Creating ZIP...'; }

    renderFullDesignToCanvas(4, async (cvs)=>{
      try{
        const baseName=sanitizeFileName(downloadNameInput.value) || 'wheels-design';
        const zipBlob=await buildProductionZip(cvs, baseName);
        const url=URL.createObjectURL(zipBlob);
        const a=document.createElement('a');
        a.href=url; a.download=`${baseName}-all-files.zip`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
      }catch(err){
        console.error(err);
        alert('The ZIP could not be created. Please try again.');
      }finally{
        if(btn){ btn.disabled=false; btn.textContent=oldLabel || 'Download Files (ZIP)'; }
      }
    });
  }

  function configuredEmailEndpoint(){
    const meta=document.querySelector('meta[name="wheels-design-email-endpoint"]');
    return (window.WHEELS_DESIGN_EMAIL_ENDPOINT || (meta && meta.content) || '').trim();
  }

  function emailProductionPackage(){
    const endpoint=configuredEmailEndpoint();
    if(!endpoint){
      alert('Email submission is ready but is not connected to the Wheels email endpoint yet. Please use Download Files (ZIP) for now.');
      return;
    }
    const btn=document.getElementById('emailPackageBtn');
    const oldLabel=btn ? btn.textContent : '';
    if(btn){ btn.disabled=true; btn.textContent='Sending...'; }
    renderFullDesignToCanvas(4, async (cvs)=>{
      try{
        const baseName=sanitizeFileName(downloadNameInput.value) || 'wheels-design';
        const zipBlob=await buildProductionZip(cvs, baseName);
        const form=new FormData();
        form.append('design_files', zipBlob, `${baseName}-all-files.zip`);
        form.append('product', productLabelForProduction());
        form.append('print_method', state.printMethod === 'screen' ? 'Screen Print' : 'Full Colour Digital');
        form.append('design_summary', specSummary());
        form.append('file_name', baseName);
        const response=await fetch(endpoint,{method:'POST',body:form,credentials:'same-origin'});
        if(!response.ok) throw new Error(`Email endpoint returned ${response.status}`);
        alert('Design files were sent to the Wheels design department.');
      }catch(err){
        console.error(err);
        alert('The design could not be emailed. Please download the ZIP and send it to the design department.');
      }finally{
        if(btn){ btn.disabled=false; btn.textContent=oldLabel || 'Email Design Files'; }
      }
    });
  }

  function setupProductionPackage(){
    const btn=document.getElementById('downloadPackageBtn');
    if(btn) btn.addEventListener('click', downloadProductionPackage);
    const emailBtn=document.getElementById('emailPackageBtn');
    if(emailBtn) emailBtn.addEventListener('click', emailProductionPackage);
  }

  // ---------------- init ----------------
  function placeControlsInViewer(){
    const controls = document.querySelector('.below-stage-controls');
    const colourDock = document.getElementById('colourDock');
    if(controls && colourDock && controls.parentElement !== colourDock){
      colourDock.appendChild(controls);
    }
  }

  function init(){
    placeControlsInViewer();
    setupPrintMethodControls();
    setupProductionPackage();
    updatePlateGeometry();
    if(IS_MOTORCYCLE){
      const bottomHolesToggle = document.getElementById('bottomHolesToggle');
      if(bottomHolesToggle) bottomHolesToggle.checked = false;
    }
    renderColourRow();
    renderBorderColourRow();
    renderStyleRow();
    redrawFrame();
    rebuildObjects();

    downloadNameInput.addEventListener('input', refreshFileNamePreview);

    if(IS_MOTORCYCLE) document.getElementById('plateHeightInput').addEventListener('change', (e)=>{
      let value = Number(e.target.value);
      if(!Number.isFinite(value)) value = 4;
      value = Math.max(4, Math.round(value * 2) / 2);
      state.plateHeight = value;
      e.target.value = String(value);
      updatePlateGeometry();
      redrawFrame();
      rebuildObjects();
    });

    document.getElementById('borderWidthSelect').addEventListener('change', (e)=>{
      state.borderWidth = Number(e.target.value);
      redrawFrame();
    });

    document.getElementById('borderInsetSelect').addEventListener('change', (e)=>{
      state.borderInset = Number(e.target.value);
      redrawFrame();
    });

    document.getElementById('borderRadiusSelect').addEventListener('change', (e)=>{
      state.borderRadius = Number(e.target.value);
      redrawFrame();
    });

    document.getElementById('embossingToggle').addEventListener('change', (e)=>{
      state.embossed = e.target.checked;
      redrawFrame();
    });

    if(IS_MOTORCYCLE) document.getElementById('bottomHolesToggle').addEventListener('change', (e)=>{
      state.bottomHoles = e.target.checked;
      redrawFrame();
      renderStyleRow();
    });

    document.getElementById('topPreviewBtn').addEventListener('click', openLivePreview);
    document.getElementById('topDownloadBtn').addEventListener('click', downloadDesign);

    window.addEventListener('resize', redrawFrame);

    window.addEventListener('beforeunload', (e)=>{
      if(state.objects.length > 0){
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }
  init();

})();

  } else if (designer === "lexan" || designer === "frame") {
(function(){
  "use strict";

  const IS_LEXAN = document.body.dataset.designer === 'lexan';

  // ---------------- geometry / style config ----------------
  // Production geometry measured from the supplied CorelDRAW PDF.
  // Virtual width stays at 800 so all existing logo/text positioning,
  // drag/resize, downloads and previews continue to use the same coordinate system.
  // 800 x 404 closely matches the ~12.25 x 6.18 in production frame ratio.
  const VW = 800, VH = 404;
  const FRAME_STYLE_CFG = {
    '101': { radius:27, holes:'top2', insetT:29, insetB:30, l:31, r:31,
             tab:{x1:137, x2:663, topY:301}, label:'Style 101' },
    '102': { radius:27, holes:'top2', insetT:30, insetB:81, l:31, r:31,
             tab:null, label:'Style 102' },
    '103': { radius:27, holes:'top2', insetT:29, insetB:102, l:31, r:31,
             tab:null, label:'Style 103' },
    '104': { radius:27, holes:'four', insetT:30, insetB:32, l:31, r:31,
             tab:null, label:'Style 104' }
  };

  // The eight Lexan layouts shown in the approved style selector.
  const LEXAN_STYLE_CFG = {
    '101': { radius:32, holes:'top2', insetT:49, insetB:44, frameStyle:'101', label:'Style 101' },
    '102': { radius:30, holes:'top2', insetT:48, insetB:91, frameStyle:'102', label:'Style 102' },
    '103': { radius:30, holes:'top2', insetT:49, insetB:109, frameStyle:'103', label:'Style 103' },
    '104': { radius:24, holes:'four', insetT:42, insetB:40, frameStyle:'104', label:'Style 104' },
    '105': { radius:32, holes:'top2', insetT:49, insetB:44, label:'Style 105' },
    '106': { radius:30, holes:'top2', insetT:48, insetB:91, label:'Style 106' },
    '107': { radius:30, holes:'top2', insetT:49, insetB:109, label:'Style 107' },
    '108': { radius:24, holes:'four', insetT:42, insetB:40, label:'Style 108' }
  };

  function roundedRectPath(x,y,w,h,r){
    const p = new Path2D();
    r = Math.min(r, w/2, h/2);
    p.moveTo(x+r,y);
    p.arcTo(x+w,y,x+w,y+h,r);
    p.arcTo(x+w,y+h,x,y+h,r);
    p.arcTo(x,y+h,x,y,r);
    p.arcTo(x,y,x+w,y,r);
    p.closePath();
    return p;
  }

  // Lightens (positive percent) or darkens (negative) a hex colour by
  // shifting each channel - used to build a subtle material gradient for
  // any custom frame/band colour, the same way black/silver/white already have one.
  function shadeHex(hex, percent){
    const h = hex.replace('#','');
    let r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    const amt = Math.round(255*percent/100);
    r = Math.min(255, Math.max(0, r+amt));
    g = Math.min(255, Math.max(0, g+amt));
    b = Math.min(255, Math.max(0, b+amt));
    return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
  }

  // The frame/band colour list: the three original material finishes plus
  // the standard flat colour chart, so existing black/silver/white keep
  // their dedicated polished look while any other pick gets a generic
  // subtle-gradient material treatment built from its own hex value.
  const FRAME_COLOR_SWATCHES = [
    {v:'black', hex:'#111112', label:'Black'},
    {v:'silver', hex:'#b7b9b9', label:'Silver'},
    {v:'white', hex:'#eeeeeb', label:'White'}
  ];

  const BAND_COLOR_SWATCHES = [
    {v:'black', hex:'#111112', label:'Black'},
    {v:'silver', hex:'#b7b9b9', label:'Silver'},
    {v:'white', hex:'#eeeeeb', label:'White'},
    {v:'#C1272D', hex:'#C1272D', label:'Red'},
    {v:'#ED1C24', hex:'#ED1C24', label:'Bright Red'},
    {v:'#F7941D', hex:'#F7941D', label:'Orange'},
    {v:'#8DC63F', hex:'#8DC63F', label:'Lime Green'},
    {v:'#39B54A', hex:'#39B54A', label:'Green'},
    {v:'#26A9E0', hex:'#26A9E0', label:'Sky Blue'},
    {v:'#0071BC', hex:'#0071BC', label:'Blue'},
    {v:'#1B3F8B', hex:'#1B3F8B', label:'Royal Blue'},
    {v:'#0A2463', hex:'#0A2463', label:'Navy'}
  ];

  // Resolves a frame/band colour value (named or hex) to its actual hex,
  // then picks black or white text for readable contrast against it - used
  // for the default "Add Text" colour so it works for any of the 13
  // swatches, not just a literal check for the string 'white'.
  function getContrastTextColor(v){
    const entry = BAND_COLOR_SWATCHES.find(s=>s.v===v);
    const hex = (entry ? entry.hex : (typeof v==='string' && v.startsWith('#') ? v : '#000000')).replace('#','');
    const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
    return luminance > 0.6 ? '#17181c' : '#ffffff';
  }

  // Lexan is screen printed: every selected band colour must be one flat
  // colour, including the black, silver, and white swatches.
  function solidLexanColour(color){
    const entry = BAND_COLOR_SWATCHES.find(s=>s.v===color);
    return entry ? entry.hex : color;
  }

  function framePaint(ctx,color,x,y,w,h){
    let g;
    if(color==='black'){
      g = ctx.createLinearGradient(x,y,x,y+h);
      g.addColorStop(0,'#232324'); g.addColorStop(0.5,'#111112'); g.addColorStop(1,'#1c1c1d');
    } else if(color==='silver'){
      g = ctx.createLinearGradient(x,y,x,y+h);
      g.addColorStop(0,'#c7c8c8'); g.addColorStop(0.5,'#b7b9b9'); g.addColorStop(1,'#c2c3c3');
    } else if(color==='white'){
      g = '#eeeeeb';
    } else {
      g = ctx.createLinearGradient(x,y,x,y+h);
      g.addColorStop(0, shadeHex(color,12));
      g.addColorStop(0.5, color);
      g.addColorStop(1, shadeHex(color,-12));
    }
    return g;
  }

  function openBottomPath(x,y,w,h,r){
    const p = new Path2D();
    r = Math.min(r, w/2, h);
    p.moveTo(x, y+h);
    p.lineTo(x, y+r);
    p.arcTo(x, y, x+r, y, r);
    p.lineTo(x+w-r, y);
    p.arcTo(x+w, y, x+w, y+r, r);
    p.lineTo(x+w, y+h);
    return p;
  }

  const productionFrameImages = new Map();

  function productionFrameAsset(styleId, color){
    const suffix = color === 'silver' ? '-GRAY' : color === 'white' ? '-WHITE' : '';
    return `Images/LPF${styleId}${suffix}.svg`;
  }

  function loadProductionFrame(styleId, color){
    const src = productionFrameAsset(styleId, color);
    if(productionFrameImages.has(src)) return productionFrameImages.get(src);
    const img = new Image();
    img.src = src;
    productionFrameImages.set(src, img);
    return img;
  }

  function drawFrameLegacy(ctx, styleId, color, scale, addBottomHoles = false, useSolidColour = false){
    const cfg = FRAME_STYLE_CFG[styleId];
    const W = VW*scale, H = VH*scale;
    ctx.clearRect(0,0,W,H);
    ctx.save();

    const outerPath = roundedRectPath(0,0,W,H,cfg.radius*scale);
    const fillColour = useSolidColour ? solidLexanColour(color) : framePaint(ctx,color,0,0,W,H);
    ctx.fillStyle = fillColour;
    ctx.fill(outerPath);
    ctx.strokeStyle = useSolidColour ? fillColour : (color==='black' ? '#050505' : '#8f8f8a');
    ctx.lineWidth = 2*scale;
    ctx.stroke(outerPath);

    const wx = cfg.l*scale, wy = cfg.insetT*scale;
    const ww = (VW-cfg.l-cfg.r)*scale, wh = (VH-cfg.insetT-cfg.insetB)*scale;
    const wpath = roundedRectPath(wx,wy,ww,wh,10*scale);

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill(wpath);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = useSolidColour ? fillColour :
      (color === "black"  ? "#050505" :
       color === "silver" ? "#8a8a86" :
                            "#9a9a94");
    ctx.lineWidth = 2 * scale;
    ctx.stroke(wpath);
    ctx.restore();

    if(cfg.tab){
      const tx = cfg.tab.x1*scale, tw = (cfg.tab.x2-cfg.tab.x1)*scale;
      const ty = cfg.tab.topY*scale, th = H - ty;
      const tabOpen = openBottomPath(tx,ty,tw,th,8*scale);
      ctx.fillStyle = fillColour;
      ctx.fill(tabOpen);
    }

    // Real mounting-hole centres and boss size from the production PDF.
    // Holes are still physically punched through the canvas with clearRect,
    // preserving the existing transparent-hole behaviour.
    const holeX_l = 170*scale;
    const holeX_r = 628*scale;

    const topHoleR = 11.5*scale;
    const topPadW = 61*scale;
    const topPadH = 40*scale;
    const holeY_top = 48*scale;

    [
      [holeX_l, holeY_top],
      [holeX_r, holeY_top]
    ].forEach(([hx,hy])=>{
      const padPath = roundedRectPath(
        hx-topPadW/2,
        hy-topPadH/2,
        topPadW,
        topPadH,
        topPadH*0.42
      );

      ctx.fillStyle = fillColour;
      ctx.fill(padPath);

      ctx.save();
      ctx.beginPath();
      ctx.arc(hx,hy,topHoleR,0,Math.PI*2);
      ctx.clip();
      ctx.clearRect(
        hx-topHoleR,
        hy-topHoleR,
        topHoleR*2,
        topHoleR*2
      );
      ctx.restore();
    });

    if(styleId === '104'){
      const holeY_bot = 356*scale;

      [
        [holeX_l, holeY_bot],
        [holeX_r, holeY_bot]
      ].forEach(([hx,hy])=>{
        const padPath = roundedRectPath(
          hx-topPadW/2,
          hy-topPadH/2,
          topPadW,
          topPadH,
          topPadH*0.42
        );

        ctx.fillStyle = fillColour;
        ctx.fill(padPath);

        ctx.save();
        ctx.beginPath();
        ctx.arc(hx,hy,topHoleR,0,Math.PI*2);
        ctx.clip();
        ctx.clearRect(
          hx-topHoleR,
          hy-topHoleR,
          topHoleR*2,
          topHoleR*2
        );
        ctx.restore();
      });
    } else if(addBottomHoles){
      const bottomHoleYByStyle = {
        '101': 354,
        '102': 354,
        '103': 354
      };

      const bottomHoleR = 11.5*scale;
      const holeY_bot = bottomHoleYByStyle[styleId]*scale;

      [
        [holeX_l, holeY_bot],
        [holeX_r, holeY_bot]
      ].forEach(([hx,hy])=>{
        ctx.save();
        ctx.beginPath();
        ctx.arc(hx,hy,bottomHoleR,0,Math.PI*2);
        ctx.clip();
        ctx.clearRect(
          hx-bottomHoleR,
          hy-bottomHoleR,
          bottomHoleR*2,
          bottomHoleR*2
        );
        ctx.restore();
      });
    }

    ctx.restore();
  }


  function drawFrame(ctx, styleId, color, scale, addBottomHoles = false, useSolidColour = false){
    // Lexan keeps its existing renderer. Only Licence Plate Frame uses the
    // production SVG assets selected by the existing style/colour controls.
    if(useSolidColour){
      drawFrameLegacy(ctx, styleId, color, scale, addBottomHoles, true);
      return;
    }

    const W = VW*scale, H = VH*scale;
    ctx.clearRect(0,0,W,H);
    const img = loadProductionFrame(styleId, color);

    const paint = ()=>{
      ctx.clearRect(0,0,W,H);
      ctx.drawImage(img,0,0,W,H);

      // Keep the existing optional bottom-hole behaviour. The production
      // colour/style SVG itself does not change when this option is toggled.
      if(addBottomHoles && styleId !== '104'){
        const holeX_l = 170*scale;
        const holeX_r = 628*scale;
        const holeY_bot = 354*scale;
        const bottomHoleR = 11.5*scale;
        [[holeX_l,holeY_bot],[holeX_r,holeY_bot]].forEach(([hx,hy])=>{
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.arc(hx,hy,bottomHoleR,0,Math.PI*2);
          ctx.fill();
          ctx.restore();
        });
      }
    };

    if(img.complete && img.naturalWidth){
      paint();
    } else {
      img.addEventListener('load', paint, {once:true});
    }
  }

  // Lexan plate cover: a clear polycarbonate panel with a printed colour
  // band at the top and/or bottom (reusing the same insetT/insetB
  // proportions as the frame layouts as the band thickness), rather than a
  // solid moulded border. The middle stays genuinely transparent - no white
  // fill - since that's what real clear plastic looks like.
  function drawCover(ctx, styleId, color, scale, addBottomHoles = false){
    const cfg = LEXAN_STYLE_CFG[styleId];
    const W = VW*scale, H = VH*scale;
    ctx.clearRect(0,0,W,H);
    ctx.save();

    const outerPath = roundedRectPath(0,0,W,H,cfg.radius*scale);

    // faint clear-plastic sheen so the panel is visible even where there's
    // no printed band
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fill(outerPath);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 2*scale;
    ctx.stroke(outerPath);

    // printed bands - clipped to the panel's own rounded shape so the top
    // band picks up the rounded top corners and the bottom band the
    // rounded bottom corners automatically
    ctx.save();
    ctx.clip(outerPath);
    ctx.fillStyle = solidLexanColour(color);
    ctx.fillRect(0, 0, W, cfg.insetT*scale);
    if(cfg.insetB > 0){
      ctx.fillRect(0, H-cfg.insetB*scale, W, cfg.insetB*scale);
    }

    // Styles 105-108 reproduce the four frame-shaped silhouettes supplied
    // by the customer, but as ink bands on a transparent Lexan panel.
    // The centre remains clear in every case.
    if(cfg.bandLayout){
      const sideWidth = (cfg.bandLayout==='frame103' ? 38 : 34) * scale;
      ctx.fillRect(0, 0, sideWidth, H);
      ctx.fillRect(W-sideWidth, 0, sideWidth, H);
      if(cfg.bandLayout==='frame101'){
        ctx.fillRect(140*scale, 330*scale, 520*scale, H-(330*scale));
      }
    }
    ctx.restore();

    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 2*scale;
    ctx.stroke(outerPath);

    // mounting holes punched straight through the printed band, plain
    // circles (no raised pad - a printed band has no physical boss)
    const holeX_l = 176*scale;
    const holeX_r = 624*scale;
    const holeR = 9*scale;
    const holeY_top = (cfg.bandLayout ? cfg.insetT*1.15 : cfg.insetT*0.55)*scale;

    const punchHole = (hx,hy,r)=>{
      ctx.save();
      ctx.beginPath();
      ctx.arc(hx,hy,r,0,Math.PI*2);
      ctx.clip();
      ctx.clearRect(hx-r,hy-r,r*2,r*2);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1*scale;
      ctx.beginPath();
      ctx.arc(hx,hy,r,0,Math.PI*2);
      ctx.stroke();
    };

    [[holeX_l,holeY_top],[holeX_r,holeY_top]].forEach(([hx,hy])=>punchHole(hx,hy,holeR));

    if(cfg.holes==='four'){
      const holeY_bot = H - (cfg.bandLayout ? cfg.insetB*1.15 : cfg.insetB*0.55)*scale;
      [[holeX_l,holeY_bot],[holeX_r,holeY_bot]].forEach(([hx,hy])=>punchHole(hx,hy,holeR));
    } else if(addBottomHoles && cfg.insetB > 30){
      const holeY_bot = H - cfg.insetB*0.55*scale;
      [[holeX_l,holeY_bot],[holeX_r,holeY_bot]].forEach(([hx,hy])=>punchHole(hx,hy,holeR));
    }

    ctx.restore();
  }

  // Single entry point used everywhere instead of calling drawFrame/drawCover
  // directly, so every call site automatically renders the right plate type.
  function drawPlate(ctx, styleId, color, scale, addBottomHoles, plateType){
    if((plateType||state.plateType)==='cover'){
      const lexanStyle = LEXAN_STYLE_CFG[styleId];
      // Do not redraw an approximation: these four are deliberately the
      // same plate/frame designs, including the real screw-hole positions.
      if(lexanStyle && lexanStyle.frameStyle){
        drawFrame(ctx, lexanStyle.frameStyle, color, scale, addBottomHoles, true);
        return;
      }
      drawCover(ctx, styleId, color, scale, addBottomHoles);
    } else {
      drawFrame(ctx, styleId, color, scale, addBottomHoles);
    }
  }

  function currentStyleConfig(){
    return state.plateType === 'cover' ? LEXAN_STYLE_CFG : FRAME_STYLE_CFG;
  }

  function currentStyle(){
    return currentStyleConfig()[state.styleId];
  }

  // ---------------- state ----------------
  let uidCounter = 0;
  const state = {
    plateType: IS_LEXAN ? 'cover' : 'frame',
    styleId: '101',
    color: 'black',
    bottomHoles: false,
    printMethod: 'digital',
    objects: [],
    selectedId: null
  };

  const stage = document.getElementById('stage');
  const frameCanvas = document.getElementById('frameCanvas');
  const objLayer = document.getElementById('objLayer');
  const downloadNameInput = document.getElementById('downloadName');
  const fctx = frameCanvas.getContext('2d');

  // Center snapping guides for both text and uploaded artwork.
  const snapGuideV = document.createElement('div');
  snapGuideV.className = 'snap-guide snap-guide-v';
  const snapGuideH = document.createElement('div');
  snapGuideH.className = 'snap-guide snap-guide-h';
  stage.appendChild(snapGuideV);
  stage.appendChild(snapGuideH);

  function hideSnapGuides(){
    snapGuideV.classList.remove('show');
    snapGuideH.classList.remove('show');

    // Never leave a stale guide on screen. Inline display wins even if an
    // older cached stylesheet still has full-stage guide defaults.
    snapGuideV.style.display='none';
    snapGuideH.style.display='none';
  }

  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }

  // ---------------- production artwork geometry ----------------
  // Licence Plate Frame uses the ACTUAL production SVG as the material shape.
  // A 1 mm inward erosion of that shape becomes the safe-print contour.
  // Artwork may move freely; the contour is validated only when the user
  // downloads/submits production files.
  const FRAME_PHYSICAL_WIDTH_MM = 311.15; // 12.25 in production artwork width
  const FRAME_SAFE_MM = 1;
  const FRAME_SAFE_RADIUS_PX = (VW / FRAME_PHYSICAL_WIDTH_MM) * FRAME_SAFE_MM;
  const FRAME_SNAP_THRESHOLD_PCT = 1.5;
  const frameSafeMaskCache = new Map();
  const frameSnapZoneCache = new Map();

  function waitForImage(img){
    if(img.complete && img.naturalWidth) return Promise.resolve(img);
    return new Promise((resolve,reject)=>{
      img.addEventListener('load',()=>resolve(img),{once:true});
      img.addEventListener('error',reject,{once:true});
    });
  }

  function erodeMaterialMask(material,w,h,radius){
    const safe=new Uint8Array(w*h);
    const r=Math.ceil(radius);
    const rr=radius*radius;

    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const i=y*w+x;
        if(!material[i]) continue;

        let ok=true;
        for(let dy=-r;dy<=r && ok;dy++){
          for(let dx=-r;dx<=r;dx++){
            if(dx*dx+dy*dy>rr) continue;
            const xx=x+dx, yy=y+dy;
            if(xx<0 || yy<0 || xx>=w || yy>=h || !material[yy*w+xx]){
              ok=false;
              break;
            }
          }
        }
        if(ok) safe[i]=1;
      }
    }
    return safe;
  }

  async function getFrameSafeMask(){
    if(state.plateType!=='frame') return null;
    const key=state.styleId+'|'+(state.bottomHoles?'holes':'noholes');
    if(frameSafeMaskCache.has(key)) return frameSafeMaskCache.get(key);

    const promise=(async()=>{
      const cvs=document.createElement('canvas');
      cvs.width=VW;
      cvs.height=VH;
      const cx=cvs.getContext('2d',{willReadFrequently:true});
      const img=loadProductionFrame(state.styleId,'black');
      await waitForImage(img);
      cx.clearRect(0,0,VW,VH);
      cx.drawImage(img,0,0,VW,VH);

      // Optional bottom holes are created by the live renderer, so include
      // them in the geometry mask before the 1 mm erosion.
      if(state.bottomHoles && state.styleId!=='104'){
        cx.save();
        cx.globalCompositeOperation='destination-out';
        [[170,354],[628,354]].forEach(([x,y])=>{
          cx.beginPath();
          cx.arc(x,y,11.5,0,Math.PI*2);
          cx.fill();
        });
        cx.restore();
      }

      const data=cx.getImageData(0,0,VW,VH).data;
      const material=new Uint8Array(VW*VH);
      for(let i=0;i<material.length;i++) material[i]=data[i*4+3]>20 ? 1 : 0;

      return erodeMaterialMask(material,VW,VH,FRAME_SAFE_RADIUS_PX);
    })();

    frameSafeMaskCache.set(key,promise);
    return promise;
  }

  function ensureFrameContourCanvas(){
    let cvs=document.getElementById('frameSafeContourCanvas');
    if(cvs) return cvs;
    cvs=document.createElement('canvas');
    cvs.id='frameSafeContourCanvas';
    cvs.width=VW;
    cvs.height=VH;
    cvs.style.position='absolute';
    cvs.style.inset='0';
    cvs.style.width='100%';
    cvs.style.height='100%';
    cvs.style.pointerEvents='none';
    cvs.style.zIndex='4';
    stage.insertBefore(cvs,objLayer);
    return cvs;
  }

  async function renderFrameSafeContour(errorMode=false){
    const cvs=ensureFrameContourCanvas();
    const cx=cvs.getContext('2d');
    cx.clearRect(0,0,VW,VH);
    cvs.style.display=state.plateType==='frame' ? 'block' : 'none';
    if(state.plateType!=='frame') return;

    const safe=await getFrameSafeMask();
    // State may have changed while the SVG was loading.
    if(state.plateType!=='frame') return;

    const zoneKey=state.styleId+'|'+(state.bottomHoles?'holes':'noholes');
    frameSnapZoneCache.set(zoneKey,deriveFrameSnapZonesFromMask(safe));

    const image=cx.createImageData(VW,VH);
    const p=image.data;
    for(let y=1;y<VH-1;y++){
      for(let x=1;x<VW-1;x++){
        const i=y*VW+x;
        if(!safe[i]) continue;
        const edge=!safe[i-1] || !safe[i+1] || !safe[i-VW] || !safe[i+VW];
        if(!edge) continue;

        const o=i*4;
        p[o]=255;
        p[o+1]=35;
        p[o+2]=48;
        p[o+3]=errorMode ? 255 : 205;

        if(errorMode){
          // Make an invalid contour easier to see without changing geometry.
          for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
            const xx=x+dx, yy=y+dy;
            const oo=(yy*VW+xx)*4;
            p[oo]=255; p[oo+1]=35; p[oo+2]=48; p[oo+3]=225;
          }
        }
      }
    }
    cx.putImageData(image,0,0);
  }

  function maskRunVertical(mask,x,yStart,yEnd){
    x=Math.max(0,Math.min(VW-1,Math.round(x)));
    yStart=Math.max(0,Math.min(VH-1,Math.round(yStart)));
    yEnd=Math.max(0,Math.min(VH-1,Math.round(yEnd)));

    const runs=[];
    let start=-1;
    for(let y=yStart;y<=yEnd;y++){
      const on=!!mask[y*VW+x];
      if(on && start<0) start=y;
      if((!on || y===yEnd) && start>=0){
        const end=on && y===yEnd ? y : y-1;
        if(end-start>=3) runs.push({start,end});
        start=-1;
      }
    }
    return runs;
  }

  function maskRunHorizontal(mask,y,xSeed){
    y=Math.max(0,Math.min(VH-1,Math.round(y)));
    xSeed=Math.max(0,Math.min(VW-1,Math.round(xSeed)));
    if(!mask[y*VW+xSeed]) return null;

    let left=xSeed;
    let right=xSeed;
    while(left>0 && mask[y*VW+(left-1)]) left--;
    while(right<VW-1 && mask[y*VW+(right+1)]) right++;
    return {left,right};
  }

  function maskRunsHorizontal(mask,y){
    y=Math.max(0,Math.min(VH-1,Math.round(y)));
    const runs=[];
    let start=-1;
    for(let x=0;x<VW;x++){
      const on=!!mask[y*VW+x];
      if(on && start<0) start=x;
      if((!on || x===VW-1) && start>=0){
        const end=on && x===VW-1 ? x : x-1;
        if(end-start>=3) runs.push({left:start,right:end});
        start=-1;
      }
    }
    return runs;
  }

  function finishSnapZone(zone){
    zone.leftPct=zone.left/VW*100;
    zone.rightPct=zone.right/VW*100;
    zone.topPct=zone.top/VH*100;
    zone.bottomPct=zone.bottom/VH*100;
    zone.centerXPct=((zone.left+zone.right)/2)/VW*100;
    zone.centerYPct=((zone.top+zone.bottom)/2)/VH*100;
    zone.widthPct=zone.rightPct-zone.leftPct;
    zone.heightPct=zone.bottomPct-zone.topPct;
    return zone;
  }

  function deriveFrameSnapZonesFromMask(mask){
    if(!mask) return [];

    const zones=[];

    const makeFullHorizontalZone=(name,run)=>{
      const xProbe=Math.round(VW/2);
      const centerY=Math.round((run.start+run.end)/2);
      const horizontal=maskRunHorizontal(mask,centerY,xProbe);
      if(!horizontal) return null;
      return finishSnapZone({
        name,
        left:horizontal.left,
        right:horizontal.right,
        top:run.start,
        bottom:run.end
      });
    };

    // ================================================================
    // TOP FRAME SNAP GEOMETRY — FIXED MECHANICAL ZONES
    // ================================================================
    // These three rectangles come from the actual LPF production geometry
    // at the 800 x 400 design coordinate system after the 1 mm safe offset.
    //
    // IMPORTANT:
    // - They are deliberately NOT auto-detected from the mask.
    // - They stop at the straight-line tangent boundaries BEFORE the
    //   outer corner radii and mounting-boss radii begin.
    // - The top geometry is common to LPF101–LPF104.
    // - Left and right are exact mirrors.
    //
    // Production-safe rectangles:
    //
    //   TOP LEFT     x 25 → 142    y 2 → 27
    //   TOP CENTRE   x 202 → 596   y 2 → 39
    //   TOP RIGHT    x 657 → 774   y 2 → 27
    //
    // This is the three-box layout shown in the approved blue sketch.
    const topLeft=finishSnapZone({
      name:'top-left',
      left:25,
      right:142,
      top:2,
      bottom:27
    });

    const topCenter=finishSnapZone({
      name:'top-center',
      left:202,
      right:596,
      top:2,
      bottom:39
    });

    const topRight=finishSnapZone({
      name:'top-right',
      left:(VW-1)-topLeft.right,
      right:(VW-1)-topLeft.left,
      top:topLeft.top,
      bottom:topLeft.bottom
    });

    zones.push(topLeft,topCenter,topRight);

    // ================================================================
    // EXISTING BOTTOM / SIDE GEOMETRY
    // ================================================================
    // Leave the already-working lower/side logic alone. Only the top three
    // zones above are fixed/hard-coded.
    const xProbe=Math.round(VW/2);
    const verticalRuns=maskRunVertical(mask,xProbe,0,VH-1);

    let bottomZone=null;

    if(state.styleId==='104'){
      // Style 104 bottom is the exact vertical mirror of the approved
      // three top mechanical zones.
      const bottomLeft=finishSnapZone({
        name:'bottom-left',
        left:topLeft.left,
        right:topLeft.right,
        top:(VH-1)-topLeft.bottom,
        bottom:(VH-1)-topLeft.top
      });

      const bottomCenter=finishSnapZone({
        name:'bottom-center',
        left:topCenter.left,
        right:topCenter.right,
        top:(VH-1)-topCenter.bottom,
        bottom:(VH-1)-topCenter.top
      });

      const bottomRight=finishSnapZone({
        name:'bottom-right',
        left:topRight.left,
        right:topRight.right,
        top:bottomLeft.top,
        bottom:bottomLeft.bottom
      });

      zones.push(bottomLeft,bottomCenter,bottomRight);
      bottomZone=bottomCenter;
    } else {
      // Existing bottom-center logic stays untouched for Style 101 and
      // all other styles.
      if(verticalRuns.length>1){
        bottomZone=makeFullHorizontalZone('bottom',verticalRuns[verticalRuns.length-1]);
        if(bottomZone) zones.push(bottomZone);
      }

      if(state.styleId==='101'){
        // Style 101 already has its working large bottom-center zone.
        // Add ONLY the two missing side boxes, mirrored from the approved
        // top-left / top-right mechanical zones.
        const bottomLeft=finishSnapZone({
          name:'bottom-left',
          left:topLeft.left,
          right:topLeft.right,
          top:(VH-1)-topLeft.bottom,
          bottom:(VH-1)-topLeft.top
        });

        const bottomRight=finishSnapZone({
          name:'bottom-right',
          left:topRight.left,
          right:topRight.right,
          top:bottomLeft.top,
          bottom:bottomLeft.bottom
        });

        zones.push(bottomLeft,bottomRight);
      }
    }

    const sideProbeY=Math.round(VH/2);
    const sideRuns=maskRunsHorizontal(mask,sideProbeY);

    if(sideRuns.length>=2){
      const leftRun=sideRuns[0];
      const leftCenterX=Math.round((leftRun.left+leftRun.right)/2);
      const leftVerticalRuns=maskRunVertical(mask,leftCenterX,0,VH-1);
      const containing=leftVerticalRuns.find(r=>sideProbeY>=r.start && sideProbeY<=r.end);

      if(containing){
        // Side rails begin below the shallow top-left/top-right boxes.
        const topLimit=topLeft.bottom+Math.ceil(FRAME_SAFE_RADIUS_PX);
        const bottomLimit=bottomZone
          ? bottomZone.top-Math.ceil(FRAME_SAFE_RADIUS_PX)
          : containing.end;

        if(bottomLimit-topLimit>4){
          const sideLeft=finishSnapZone({
            name:'side-left',
            left:leftRun.left,
            right:leftRun.right,
            top:Math.max(containing.start,topLimit),
            bottom:Math.min(containing.end,bottomLimit)
          });

          const sideRight=finishSnapZone({
            name:'side-right',
            left:(VW-1)-sideLeft.right,
            right:(VW-1)-sideLeft.left,
            top:sideLeft.top,
            bottom:sideLeft.bottom
          });

          zones.push(sideLeft,sideRight);
        }
      }
    }

    return zones;
  }

  async function ensureFrameSnapZones(){
    if(state.plateType!=='frame') return [];
    const key=state.styleId+'|'+(state.bottomHoles?'holes':'noholes');
    if(frameSnapZoneCache.has(key)) return frameSnapZoneCache.get(key);

    const safe=await getFrameSafeMask();
    const zones=deriveFrameSnapZonesFromMask(safe);
    frameSnapZoneCache.set(key,zones);
    return zones;
  }

  function frameSnapZones(){
    if(state.plateType!=='frame') return [];
    const key=state.styleId+'|'+(state.bottomHoles?'holes':'noholes');
    return frameSnapZoneCache.get(key) || [];
  }

  function snapZoneForPoint(xPct,yPct,thresholdPct){
    const zones=frameSnapZones();
    let best=null, bestScore=Infinity;
    const margin=Math.max(thresholdPct*2,2.5);

    for(const zone of zones){
      if(
        xPct < zone.leftPct-margin ||
        xPct > zone.rightPct+margin ||
        yPct < zone.topPct-margin ||
        yPct > zone.bottomPct+margin
      ) continue;

      const dx=Math.abs(xPct-zone.centerXPct);
      const dy=Math.abs(yPct-zone.centerYPct);
      const score=dx+dy;
      if(score<bestScore){
        best=zone;
        bestScore=score;
      }
    }
    return best;
  }

  function showLocalSnapGuides(zone,snapX,snapY){
    if(!zone){ hideSnapGuides(); return; }

    // Vertical guide is physically clipped to the active zone.
    snapGuideV.style.left=zone.centerXPct+'%';
    snapGuideV.style.top=zone.topPct+'%';
    snapGuideV.style.right='auto';
    snapGuideV.style.bottom='auto';
    snapGuideV.style.width='2px';
    snapGuideV.style.height=zone.heightPct+'%';
    snapGuideV.style.display=snapX ? 'block' : 'none';
    snapGuideV.classList.toggle('show',!!snapX);

    // Horizontal guide is physically clipped to the active zone.
    snapGuideH.style.left=zone.leftPct+'%';
    snapGuideH.style.top=zone.centerYPct+'%';
    snapGuideH.style.right='auto';
    snapGuideH.style.bottom='auto';
    snapGuideH.style.width=zone.widthPct+'%';
    snapGuideH.style.height='2px';
    snapGuideH.style.display=snapY ? 'block' : 'none';
    snapGuideH.classList.toggle('show',!!snapY);
  }

  function nearestLocalZoneForObject(obj){
    const cx=obj.type==='image' ? obj.xPct+obj.wPct/2 : obj.xPct;
    const cy=obj.type==='image' ? obj.yPct+obj.hPct/2 : obj.yPct;
    const zones=frameSnapZones();
    if(!zones.length) return null;

    const distanceToZone=(z)=>{
      const dx=cx<z.leftPct ? z.leftPct-cx : cx>z.rightPct ? cx-z.rightPct : 0;
      const dy=cy<z.topPct ? z.topPct-cy : cy>z.bottomPct ? cy-z.bottomPct : 0;
      return dx*dx+dy*dy;
    };

    return zones.reduce((best,z)=>
      distanceToZone(z)<distanceToZone(best) ? z : best
    ,zones[0]);
  }

  function centerObjectHorizontally(obj){
    if(!obj) return;
    const zone=nearestLocalZoneForObject(obj);
    if(!zone){
      if(obj.type==='image') obj.xPct=50-obj.wPct/2;
      else obj.xPct=50;
    }else{
      if(obj.type==='image') obj.xPct=zone.centerXPct-obj.wPct/2;
      else obj.xPct=zone.centerXPct;
    }
    clearBoundaryValidationFeedback();
    rebuildObjects();
    if(zone){
      showLocalSnapGuides(zone,true,false);
      window.setTimeout(hideSnapGuides,500);
    }
  }

  function fitImageForInitialPlacement(naturalW,naturalH){
    const aspect=naturalW/naturalH;
    const k=(VW/VH)/aspect;

    if(state.plateType==='frame'){
      const zones=frameSnapZones();
      const zone=zones.find(z=>z.name==='bottom') || zones[0];
      if(zone){
        const usableW=zone.widthPct*.72;
        const usableH=zone.heightPct*.72;
        const wPct=Math.max(1,Math.min(usableW,usableH/k));
        const hPct=wPct*k;
        return {
          aspect,k,wPct,hPct,
          xPct:zone.centerXPct-wPct/2,
          yPct:zone.centerYPct-hPct/2
        };
      }
    }

    const wPct=24;
    return {aspect,k,wPct,hPct:wPct*k,xPct:38,yPct:50-(wPct*k)/2};
  }

  function ensureBoundaryErrorBanner(){
    let banner=document.getElementById('boundaryValidationError');
    if(banner) return banner;

    banner=document.createElement('div');
    banner.id='boundaryValidationError';
    banner.style.position='absolute';
    banner.style.left='50%';
    banner.style.top='12px';
    banner.style.transform='translateX(-50%)';
    banner.style.zIndex='20';
    banner.style.maxWidth='calc(100% - 24px)';
    banner.style.padding='10px 14px';
    banner.style.borderRadius='7px';
    banner.style.background='#d71920';
    banner.style.color='#fff';
    banner.style.font='700 13px/1.3 Inter,Arial,sans-serif';
    banner.style.boxShadow='0 5px 18px rgba(0,0,0,.28)';
    banner.style.pointerEvents='none';
    banner.style.display='none';
    banner.textContent='Artwork outside printable area. Move the highlighted item inside the 1 mm boundary before saving or exporting.';
    stage.appendChild(banner);
    return banner;
  }

  function clearBoundaryValidationFeedback(){
    state.objects.forEach(o=>{o.boundaryInvalid=false;});
    const banner=document.getElementById('boundaryValidationError');
    if(banner) banner.style.display='none';
    renderFrameSafeContour(false);
  }

  function drawObjectForValidation(ctx,obj,offsetX,offsetY){
    if(obj.type==='text'){
      ctx.save();
      const fontStyle=obj.italic ? 'italic' : 'normal';
      ctx.font=`${fontStyle} ${obj.bold?'700':'400'} ${obj.fontSize*0.85}px '${obj.fontFamily}', sans-serif`;
      ctx.fillStyle='#fff';
      ctx.textAlign=obj.align;
      ctx.textBaseline='middle';

      const x=offsetX+obj.xPct/100*VW;
      const y=offsetY+obj.yPct/100*VH;
      const displayText=obj.caps ? (obj.text||'').toUpperCase() : obj.text;
      const lines=displayText.split('\n');
      const lh=obj.fontSize*0.85*1.15;
      const startY=y-(lh*(lines.length-1))/2;
      lines.forEach((line,i)=>ctx.fillText(line,x,startY+i*lh));
      ctx.restore();
      return Promise.resolve();
    }

    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>{
        const x=offsetX+obj.xPct/100*VW;
        const y=offsetY+obj.yPct/100*VH;
        const w=obj.wPct/100*VW;
        const h=obj.hPct/100*VH;
        ctx.drawImage(img,x,y,w,h);
        resolve();
      };
      img.onerror=reject;
      img.src=obj.src;
    });
  }

  async function objectViolatesFrameBoundary(obj,safeMask){
    // Padding means visible artwork outside the stage is still detected,
    // instead of being silently clipped before validation.
    const pad=160;
    const cvs=document.createElement('canvas');
    cvs.width=VW+pad*2;
    cvs.height=VH+pad*2;
    const cx=cvs.getContext('2d',{willReadFrequently:true});
    await drawObjectForValidation(cx,obj,pad,pad);

    const pixels=cx.getImageData(0,0,cvs.width,cvs.height).data;
    for(let y=0;y<cvs.height;y++){
      for(let x=0;x<cvs.width;x++){
        const alpha=pixels[(y*cvs.width+x)*4+3];
        if(alpha<10) continue;

        const fx=x-pad;
        const fy=y-pad;
        if(fx<0 || fy<0 || fx>=VW || fy>=VH) return true;
        if(!safeMask[fy*VW+fx]) return true;
      }
    }
    return false;
  }

  async function validateArtworkBeforeProduction(){
    clearBoundaryValidationFeedback();
    if(state.plateType!=='frame' || state.objects.length===0) return true;

    const safeMask=await getFrameSafeMask();
    const invalid=[];
    for(const obj of state.objects){
      try{
        if(await objectViolatesFrameBoundary(obj,safeMask)){
          obj.boundaryInvalid=true;
          invalid.push(obj);
        }
      }catch(err){
        console.error('Boundary validation failed for object',obj.id,err);
        obj.boundaryInvalid=true;
        invalid.push(obj);
      }
    }

    if(!invalid.length){
      rebuildObjects();
      return true;
    }

    state.selectedId=invalid[0].id;
    rebuildObjects();
    const banner=ensureBoundaryErrorBanner();
    banner.style.display='block';
    renderFrameSafeContour(true);

    alert(
      'Artwork Outside Printable Area\n\n' +
      'One or more highlighted items cross the 1 mm safe boundary. ' +
      'Move the artwork completely inside the red contour before saving, downloading, or submitting.'
    );
    return false;
  }

  // Builds the style/colour/holes suffix used in both the downloaded
  // filename and the on-screen summary, so they always stay in sync.
  function specSuffix(){
    const styleLabel = (currentStyle() && currentStyle().label) || state.styleId;
    const styleSlug = styleLabel.replace(/\s+/g,'').toLowerCase();
    const productSlug = state.plateType === 'cover' ? 'lexan-cover' : 'licence-plate-frame';
    const colorSlug = state.color.replace('#','').toLowerCase();
    const printSlug = state.printMethod === 'screen' ? 'screen-print' : 'digital';
    const holesSlug = state.bottomHoles ? 'bottomholes' : 'nobottomholes';
    return `${productSlug}-${printSlug}-${styleSlug}-${colorSlug}-${holesSlug}`;
  }

  function specSummary(){
    const styleLabel = (currentStyle() && currentStyle().label) || state.styleId;
    const colorEntry = BAND_COLOR_SWATCHES.find(s=>s.v===state.color);
    const colorLabel = colorEntry ? colorEntry.label : state.color;
    const productLabel = state.plateType === 'cover' ? 'Lexan Plate Cover' : 'Licence Plate Frame';
    const colorRole = state.plateType === 'cover' ? 'Band' : 'Frame';
    const holesLabel = state.bottomHoles ? 'With bottom holes' : 'No bottom holes';
    return `${productLabel} - Print: ${state.printMethod === 'screen' ? 'Screen Print' : 'Full Colour Digital'} - ${styleLabel} - ${colorRole}: ${colorLabel} - ${holesLabel}`;
  }

  function sanitizeFileName(name){
    const cleaned = (name || '')
      .trim()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const base = cleaned || (state.plateType === 'cover' ? 'my-lexan-cover' : 'my-plate-frame');
    return `${base}-${specSuffix()}`;
  }

  function refreshSpecSummary(){
    const el = document.getElementById('specSummary');
    if(el) el.textContent = specSummary();
  }

  function refreshFileNamePreview(){
    const el = document.getElementById('fileNamePreview');
    if(el) el.textContent = sanitizeFileName(downloadNameInput.value) + '.png';
  }

  function redrawFrame(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    const cssW = stage.clientWidth || 700;
    const scale = (cssW/VW) * dpr;
    frameCanvas.width = VW*scale;
    frameCanvas.height = VH*scale;
    drawPlate(fctx, state.styleId, state.color, scale, state.bottomHoles);
    refreshSpecSummary();
    refreshFileNamePreview();
    renderFrameSafeContour(false);
    if(typeof updatePreviewWindow==='function') updatePreviewWindow();
  }

  // ---------------- object creation ----------------
  async function addImageObject(src, naturalW, naturalH, originalFile){
    if(state.plateType==='frame') await ensureFrameSnapZones();
    const fitted=fitImageForInitialPlacement(naturalW,naturalH);
    const obj = {
      id:'obj'+(uidCounter++), type:'image', src, originalSrc: src, originalFileName: originalFile?.name || 'uploaded-logo', originalFileType: originalFile?.type || '', originalFileData: src, bgRemoved:false,
      recolored:false, preRecolorSrc: null, recolorColor:'#c9171f',
      xPct:fitted.xPct, yPct:fitted.yPct,
      wPct:fitted.wPct, hPct:fitted.hPct, k:fitted.k, aspect:fitted.aspect
    };

    const forcedInk=selectedSingleScreenInk();
    if(forcedInk){
      obj.preRecolorSrc=src;
      obj.src=await recolorToSolid(src,forcedInk);
      obj.recolored=true;
      obj.recolorColor=forcedInk;
    }

    state.objects.push(obj);
    state.selectedId=obj.id;
    clearBoundaryValidationFeedback();
    rebuildObjects();

    if(state.plateType==='frame'){
      const zone=nearestLocalZoneForObject(obj);
      if(zone){
        showLocalSnapGuides(zone,true,true);
        window.setTimeout(hideSnapGuides,600);
      }
    }
  }

  function removeWhiteBackground(src){
    return new Promise((resolve,reject)=>{
      const img = new Image();
      img.onload = ()=>{
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const cx = c.getContext('2d');
        cx.drawImage(img,0,0);
        const data = cx.getImageData(0,0,c.width,c.height);
        const d = data.data;
        const solidBelow = 205, transparentAbove = 246;
        for(let i=0;i<d.length;i+=4){
          const r=d[i],g=d[i+1],b=d[i+2];
          const minc = Math.min(r,g,b);
          if(minc >= transparentAbove){
            d[i+3] = 0;
          } else if(minc > solidBelow){
            const t = (minc-solidBelow)/(transparentAbove-solidBelow);
            d[i+3] = Math.round(d[i+3]*(1-t));
          }
        }
        cx.putImageData(data,0,0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  // Forces every non-transparent pixel to one flat colour while keeping the
  // original alpha (including any antialiased/semi-transparent edges) -
  // turns a multi-colour logo into a single-colour version, since screen
  // printing is charged per colour.
  function recolorToSolid(src, hexColor){
    return new Promise((resolve,reject)=>{
      const img = new Image();
      img.onload = ()=>{
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const cx = c.getContext('2d');
        cx.drawImage(img,0,0);
        const data = cx.getImageData(0,0,c.width,c.height);
        const d = data.data;
        const rr = parseInt(hexColor.slice(1,3),16);
        const gg = parseInt(hexColor.slice(3,5),16);
        const bb = parseInt(hexColor.slice(5,7),16);
        for(let i=0;i<d.length;i+=4){
          if(d[i+3] > 0){
            d[i]=rr; d[i+1]=gg; d[i+2]=bb;
          }
        }
        cx.putImageData(data,0,0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function selectedSingleScreenInk(){
    if(state.printMethod!=='screen') return null;
    const selection=window.WheelsScreenPrintSelection;
    if(!selection || Number(selection.count)!==1) return null;
    const colours=selection.colours;
    if(!Array.isArray(colours) || colours.length!==1) return null;
    const hex=String(colours[0].hex||'').toUpperCase();
    return /^#[0-9A-F]{6}$/.test(hex) ? hex : null;
  }

  async function applySingleScreenInk(hex){
    if(state.printMethod!=='screen' || !/^#[0-9A-F]{6}$/.test(hex||'')) return;

    for(const obj of state.objects){
      if(obj.type==='text'){
        obj.color=hex;
        continue;
      }

      if(obj.type==='image'){
        // Preserve the current clean/base artwork (including any background
        // removal already performed), then derive the one-colour proof from it.
        const base=obj.preRecolorSrc || obj.src || obj.originalSrc;
        if(!base) continue;
        if(!obj.preRecolorSrc) obj.preRecolorSrc=base;
        try{
          obj.src=await recolorToSolid(obj.preRecolorSrc,hex);
          obj.recolored=true;
          obj.recolorColor=hex;
        }catch(err){
          console.error('Could not apply selected screen-print ink',err);
        }
      }
    }

    rebuildObjects();
    if(typeof updatePreviewWindow==='function') updatePreviewWindow();
  }

  window.addEventListener('wheels:screenprintselection',(event)=>{
    const detail=event.detail||{};
    if(state.printMethod!=='screen') return;
    if(Number(detail.count)!==1 || !Array.isArray(detail.colours) || detail.colours.length!==1) return;
    const hex=String(detail.colours[0].hex||'').toUpperCase();
    if(/^#[0-9A-F]{6}$/.test(hex)) applySingleScreenInk(hex);
  });

  function addTextObject(text, opts){
    opts = opts || {};
    const forcedInk=selectedSingleScreenInk();
    if(forcedInk) opts.color=forcedInk;
    const obj = Object.assign({
      id:'obj'+(uidCounter++), type:'text', text: text,
      xPct:50, yPct:12, fontFamily:'Oswald', fontSize:34,
      color:'#ffffff', bold:true, italic:false, caps:false,
      align:'center', stretchX:1, stretchY:1
    }, opts);
    state.objects.push(obj);
    selectObject(obj.id);
    rebuildObjects();
  }

  function deleteObject(id){
    state.objects = state.objects.filter(o=>o.id!==id);
    if(state.selectedId===id) state.selectedId=null;
    rebuildObjects();
  }

  function selectObject(id){
    state.selectedId = id;
    rebuildObjects();
  }

  function getObj(id){ return state.objects.find(o=>o.id===id); }

  // ---------------- DOM rendering of objects ----------------
  function rebuildObjects(){
    objLayer.innerHTML = '';
    state.objects.forEach(obj=>{
      const el = document.createElement('div');
      el.className = 'obj' + (obj.id===state.selectedId ? ' selected' : '');
      el.dataset.id = obj.id;
      if(obj.boundaryInvalid){
        el.style.outline='3px solid #ff2633';
        el.style.outlineOffset='2px';
        el.style.boxShadow='0 0 0 2px rgba(255,255,255,.85)';
      }

      if(obj.type==='image'){
        el.style.left = obj.xPct+'%';
        el.style.top = obj.yPct+'%';
        el.style.width = obj.wPct+'%';
        el.style.height = obj.hPct+'%';
        const img = document.createElement('img');
        img.className='obj-img';
        img.src = obj.src;
        img.draggable = false;
        el.appendChild(img);

        if(obj.id===state.selectedId){
          const handle = document.createElement('div');
          handle.className = 'handle';
          handle.addEventListener('pointerdown', (e)=>startResize(e,obj));
          el.appendChild(handle);
        }
      } else {
        el.style.left = obj.xPct+'%';
        el.style.top = obj.yPct+'%';
        el.style.transform = 'translate(-50%,-50%)';
        const txt = document.createElement('div');
        txt.className = 'obj-text';
        txt.textContent = obj.caps ? (obj.text||'').toUpperCase() : obj.text;
        txt.style.fontFamily = `'${obj.fontFamily}', sans-serif`;
        txt.style.fontSize = (obj.fontSize*0.125)+'cqw';
        txt.style.color = obj.color;
        txt.style.fontWeight = obj.bold ? '700':'400';
        txt.style.fontStyle = obj.italic ? 'italic':'normal';
        txt.style.textAlign = obj.align;
        el.appendChild(txt);
      }

      el.addEventListener('pointerdown', (e)=>{
        if(e.target.classList.contains('handle')) return;
        selectObject(obj.id);
        startDrag(e,obj);
      });

      objLayer.appendChild(el);
    });
    renderLayersList();
    renderObjPanel();
    if(typeof updatePreviewWindow==='function') updatePreviewWindow();
  }

  // ---------------- drag ----------------
  let dragState=null, resizeState=null;

  // Fail-safe cleanup: guides are only allowed while the user is actively
  // dragging/resizing. Losing the pointer/window can never leave them stuck.
  window.addEventListener('pointerup', hideSnapGuides);
  window.addEventListener('pointercancel', hideSnapGuides);
  window.addEventListener('blur', hideSnapGuides);
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden) hideSnapGuides();
  });

  function startDrag(e,obj){
    e.preventDefault();
    const rect = stage.getBoundingClientRect();
    dragState = {
      obj, rect,
      startClientX: e.clientX, startClientY: e.clientY,
      startXPct: obj.xPct, startYPct: obj.yPct
    };
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragEnd);
  }
  function onDragMove(e){
    if(!dragState) return;
    const {obj, rect, startClientX, startClientY, startXPct, startYPct} = dragState;
    const dxPct = (e.clientX-startClientX)/rect.width*100;
    const dyPct = (e.clientY-startClientY)/rect.height*100;
    let nx=startXPct+dxPct, ny=startYPct+dyPct;

    // Keep a small part of the object recoverable, but do NOT cage it inside
    // a top/bottom rectangle. The real 1 mm contour is checked on output.
    if(obj.type==='image'){
      nx=clamp(nx,-obj.wPct*.9,100-obj.wPct*.1);
      ny=clamp(ny,-obj.hPct*.9,100-obj.hPct*.1);
    }else{
      nx=clamp(nx,-10,110);
      ny=clamp(ny,-10,110);
    }

    const centerX=obj.type==='image' ? nx+obj.wPct/2 : nx;
    const centerY=obj.type==='image' ? ny+obj.hPct/2 : ny;
    const threshold=Math.max(FRAME_SNAP_THRESHOLD_PCT,10/rect.width*100);
    const zone=state.plateType==='frame' ? snapZoneForPoint(centerX,centerY,threshold) : null;

    let snapX=false, snapY=false;
    if(zone){
      snapX=Math.abs(centerX-zone.centerXPct)<=threshold;
      snapY=Math.abs(centerY-zone.centerYPct)<=threshold;
      if(snapX) nx=obj.type==='image' ? zone.centerXPct-obj.wPct/2 : zone.centerXPct;
      if(snapY) ny=obj.type==='image' ? zone.centerYPct-obj.hPct/2 : zone.centerYPct;
      showLocalSnapGuides(zone,snapX,snapY);
    }else{
      hideSnapGuides();
    }

    obj.xPct=nx;
    obj.yPct=ny;
    obj.boundaryInvalid=false;
    const el=objLayer.querySelector(`.obj[data-id="${obj.id}"]`);
    if(el){
      el.style.left=nx+'%';
      el.style.top=ny+'%';
      el.style.outline='';
      el.style.outlineOffset='';
      el.style.boxShadow='';
    }
    const banner=document.getElementById('boundaryValidationError');
    if(banner) banner.style.display='none';
  }
  function onDragEnd(){
    hideSnapGuides();
    dragState=null;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragEnd);
    if(typeof updatePreviewWindow==='function') updatePreviewWindow();
  }

  function startResize(e,obj){
    e.preventDefault(); e.stopPropagation();
    if(obj.type !== 'image') return;
    const rect = stage.getBoundingClientRect();
    resizeState = { obj, rect, kind:'image', startClientX:e.clientX, startWPct: obj.wPct };
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', onResizeEnd);
  }
  function onResizeMove(e){
    if(!resizeState) return;
    const {obj, rect, startClientX, startWPct} = resizeState;
    const dxPct=(e.clientX-startClientX)/rect.width*100;
    const nw=clamp(startWPct+dxPct,1,150);
    obj.wPct=nw;
    obj.hPct=nw*obj.k;
    obj.boundaryInvalid=false;
    const el=objLayer.querySelector(`.obj[data-id="${obj.id}"]`);
    if(el){
      el.style.width=nw+'%';
      el.style.height=obj.hPct+'%';
      el.style.outline='';
      el.style.outlineOffset='';
      el.style.boxShadow='';
    }
    const banner=document.getElementById('boundaryValidationError');
    if(banner) banner.style.display='none';
  }
  function onResizeEnd(){
    resizeState=null;
    window.removeEventListener('pointermove', onResizeMove);
    window.removeEventListener('pointerup', onResizeEnd);
    if(typeof updatePreviewWindow==='function') updatePreviewWindow();
  }

  // ---------------- layers list ----------------
  function renderLayersList(){
    const host = document.getElementById('layersList');
    host.innerHTML='';
    if(state.objects.length===0){
      host.innerHTML = '<div class="empty-note">Nothing added yet - upload a logo or add text.</div>';
      return;
    }
    [...state.objects].reverse().forEach(obj=>{
      const row = document.createElement('div');
      row.className = 'layer-item' + (obj.id===state.selectedId?' selected':'');
      const lbl = document.createElement('div');
      lbl.className='lbl';
      lbl.textContent = obj.type==='image' ? '[Img] Logo image' : ('[T] '+(obj.text||'').slice(0,22));
      row.appendChild(lbl);
      const del = document.createElement('button');
      del.textContent='x';
      del.title='Delete';
      del.addEventListener('click',(ev)=>{ ev.stopPropagation(); deleteObject(obj.id); });
      row.appendChild(del);
      row.addEventListener('click', ()=> selectObject(obj.id));
      host.appendChild(row);
    });
  }

  // ---------------- object property panel ----------------
  const FONT_OPTIONS = ['Oswald','Inter','Anton','Bebas Neue','Racing Sans One','Teko','Rajdhani','Archivo Black','Barlow Condensed','Orbitron','Big Shoulders Display','Staatliches','Saira Condensed','Fjalla One','Titan One','Russo One','Squada One','Pathway Gothic One','Khand','Exo 2','Michroma','Chakra Petch'];

  const SWATCH_COLORS = [
    '#FFFFFF', '#808080', '#000000',
    '#C1272D', '#ED1C24', '#F7941D', '#FFF200',
    '#8DC63F', '#39B54A', '#29ABE2', '#1B75BC',
    '#233A87', '#662D91'
  ];

  // SCREEN PRINT STOCK COLOURS
  // Replace this one list with the approved Wheels stock ink codes when supplied.
  // Screen Print mode uses ONLY this list; Digital mode uses the full palette above.
  const SCREEN_PRINT_COLORS = [
    '#000000', // HT Process Black / Black
    '#00AEEF', // HT Process Cyan
    '#EC008C', // HT Process Magenta
    '#FFF200', // HT Process Yellow
    '#ADADAD', // Grey 429 C
    '#C0C0C0', // Silver / Clear (screen approximation)
    '#D4AF37', // Gold / Clear (screen approximation)
    '#FFFFFF', // White
    '#008CCC', // Process Blue
    '#171796', // Reflex Blue
    '#6600A1', // Violet C
    '#BA1FB5', // Purple C
    '#E60094', // Rhodamine Red
    '#CF035C', // Rubine Red
    '#ED6E00', // Orange 021 C
    '#FF5E00', // Bright Orange
    '#F54029', // Warm Red
    '#D71920', // Fire Red (screen approximation)
    '#009645', // Emerald Green (355 C)
    '#00B394', // Green C
    '#F7D117', // Medium Yellow (116 C)
    '#F5ED59', // Primrose Yellow (101 C)
    '#F7E017'  // Yellow C
  ];

  const SCREEN_PRINT_BAND_SWATCHES = [
    {v:'black', hex:'#000000', label:'Black'},
    {v:'grey', hex:'#808080', label:'Grey'},
    {v:'white', hex:'#FFFFFF', label:'White'}
  ];

  function activeArtworkColours(){
    return state.printMethod === 'screen' ? SCREEN_PRINT_COLORS : SWATCH_COLORS;
  }

  // A fixed colour-chart grid used everywhere instead of the native OS
  // colour picker - onPick(hex) fires immediately when a chip is clicked.
  function buildSwatchGrid(currentHex, onPick){
    const grid = document.createElement('div');
    grid.className = 'swatch-grid';
    activeArtworkColours().forEach(hex=>{
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'swatch-chip' + ((currentHex||'').toUpperCase()===hex ? ' active':'');
      // setProperty(...,'important') so this beats the Magento isolation
      // stylesheet's "background:#fff !important" rule on all buttons -
      // a plain inline style loses to that, an inline !important wins.
      sw.style.setProperty('background', hex, 'important');
      if(hex==='#FFFFFF') sw.classList.add('swatch-chip-white');
      sw.title = hex;
      sw.addEventListener('click', ()=>{
        grid.querySelectorAll('.swatch-chip').forEach(c=>c.classList.remove('active'));
        sw.classList.add('active');
        onPick(hex);
      });
      grid.appendChild(sw);
    });
    return grid;
  }

  function renderObjPanel(){
    const host = document.getElementById('objPanelHost');
    host.innerHTML='';
    const obj = getObj(state.selectedId);
    if(!obj) return;

    const panel = document.createElement('div');
    panel.className='obj-panel';

    const title = document.createElement('div');
    title.className='obj-panel-title';
    title.innerHTML = `<span>${obj.type==='image'?'Logo Settings':'Text Settings'}</span>`;
    const delBtn = document.createElement('button');
    delBtn.textContent='Delete';
    delBtn.addEventListener('click', ()=> deleteObject(obj.id));
    title.appendChild(delBtn);
    panel.appendChild(title);

    const positionField=document.createElement('div');
    positionField.className='field';
    positionField.innerHTML='<label>Position</label>';
    const centerBtn=document.createElement('button');
    centerBtn.type='button';
    centerBtn.className='btn';
    centerBtn.style.width='100%';
    centerBtn.textContent='Center Horizontally';
    centerBtn.addEventListener('click',()=>centerObjectHorizontally(obj));
    positionField.appendChild(centerBtn);
    panel.appendChild(positionField);

    if(obj.type==='text'){
      const fText = document.createElement('div');
      fText.className='field';
      fText.innerHTML = '<label>Text</label>';
      const ta = document.createElement('textarea');
      ta.className='text-input';
      ta.value = obj.text;
      ta.addEventListener('input', ()=>{
        obj.text = ta.value;
        updateTextEl(obj);
      });
      fText.appendChild(ta);
      panel.appendChild(fText);

      const row2 = document.createElement('div');
      row2.className='row2';

      const fFont = document.createElement('div');
      fFont.className='field';
      fFont.innerHTML='<label>Font</label>';
      const sel = document.createElement('select');
      FONT_OPTIONS.forEach(f=>{
        const o=document.createElement('option'); o.value=f; o.textContent=f;
        if(f===obj.fontFamily) o.selected=true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', ()=>{ obj.fontFamily=sel.value; updateTextEl(obj); });
      fFont.appendChild(sel);
      row2.appendChild(fFont);

      const fColor = document.createElement('div');
      fColor.className='field';
      fColor.innerHTML='<label>Colour</label>';
      const colorGrid = buildSwatchGrid(obj.color, (hex)=>{ obj.color=hex; updateTextEl(obj); });
      colorGrid.style.gridTemplateColumns = 'repeat(4,1fr)';
      fColor.appendChild(colorGrid);
      row2.appendChild(fColor);

      panel.appendChild(row2);
      const fSize = document.createElement('div');
      fSize.className='field';
      fSize.innerHTML = '<label>Font Size</label>';
      const sizeSel = document.createElement('select');
      [12,14,16,18,20,22,24,26,28,30,32,34,36,40,44,48,54,60,66,72,80,90].forEach(size=>{
        const opt=document.createElement('option');
        opt.value=String(size); opt.textContent=size+' pt';
        if(size===Number(obj.fontSize)) opt.selected=true;
        sizeSel.appendChild(opt);
      });
      if(![12,14,16,18,20,22,24,26,28,30,32,34,36,40,44,48,54,60,66,72,80,90].includes(Number(obj.fontSize))){
        const opt=document.createElement('option'); opt.value=String(obj.fontSize); opt.textContent=obj.fontSize+' pt'; opt.selected=true; sizeSel.appendChild(opt);
      }
      sizeSel.addEventListener('change', ()=>{ obj.fontSize=Number(sizeSel.value); obj.stretchX=1; obj.stretchY=1; updateTextEl(obj); });
      fSize.appendChild(sizeSel);
      panel.appendChild(fSize);

      const fStyleCase = document.createElement('div');
      fStyleCase.className='row2';

      const styleWrap = document.createElement('div');
      styleWrap.className='field';
      styleWrap.innerHTML='<label>Style</label>';
      const styleSel = document.createElement('select');
      const STYLE_OPTS = [
        {v:'regular', label:'Regular', bold:false, italic:false},
        {v:'bold', label:'Bold', bold:true, italic:false},
        {v:'italic', label:'Italic', bold:false, italic:true},
        {v:'bolditalic', label:'Bold Italic', bold:true, italic:true}
      ];
      const curStyleV = STYLE_OPTS.find(o=>o.bold===!!obj.bold && o.italic===!!obj.italic)?.v || 'regular';
      STYLE_OPTS.forEach(o=>{
        const opt=document.createElement('option'); opt.value=o.v; opt.textContent=o.label;
        if(o.v===curStyleV) opt.selected=true;
        styleSel.appendChild(opt);
      });
      styleSel.addEventListener('change', ()=>{
        const chosen = STYLE_OPTS.find(o=>o.v===styleSel.value);
        obj.bold = chosen.bold; obj.italic = chosen.italic;
        updateTextEl(obj);
      });
      styleWrap.appendChild(styleSel);
      fStyleCase.appendChild(styleWrap);

      const caseWrap = document.createElement('div');
      caseWrap.className='field';
      caseWrap.innerHTML='<label>Case</label>';
      const caseSel = document.createElement('select');
      [['normal','Normal'],['caps','ALL CAPS']].forEach(([v,label])=>{
        const opt=document.createElement('option'); opt.value=v; opt.textContent=label;
        if((v==='caps')===!!obj.caps) opt.selected=true;
        caseSel.appendChild(opt);
      });
      caseSel.addEventListener('change', ()=>{
        obj.caps = caseSel.value==='caps';
        updateTextEl(obj);
      });
      caseWrap.appendChild(caseSel);
      fStyleCase.appendChild(caseWrap);

      panel.appendChild(fStyleCase);
    } else {
      const note = document.createElement('div');
      note.style.fontSize='12px';
      note.style.color='var(--steel)';
      note.textContent = 'Drag the logo to move it. Drag the red dot on its corner to resize.';
      panel.appendChild(note);

      const bgField = document.createElement('div');
      bgField.className='field';
      bgField.innerHTML = '<label>Background</label>';
      const bgBtn = document.createElement('button');
      bgBtn.className='btn';
      bgBtn.style.width='100%';
      bgBtn.textContent = obj.bgRemoved ? 'Restore Original' : 'Remove White Background';
      bgBtn.addEventListener('click', async ()=>{
        bgBtn.disabled = true;
        bgBtn.textContent = 'Working...';
        try{
          let baseSrc;
          if(obj.bgRemoved){
            baseSrc = obj.originalSrc;
            obj.bgRemoved = false;
          } else {
            baseSrc = await removeWhiteBackground(obj.originalSrc);
            obj.bgRemoved = true;
          }

          const forcedInk=selectedSingleScreenInk();
          if(forcedInk){
            obj.preRecolorSrc=baseSrc;
            obj.src=await recolorToSolid(baseSrc,forcedInk);
            obj.recolored=true;
            obj.recolorColor=forcedInk;
          }else{
            obj.src=baseSrc;
            if(obj.recolored) obj.preRecolorSrc=baseSrc;
          }

          const imgEl = objLayer.querySelector(`.obj[data-id="${obj.id}"] img`);
          if(imgEl) imgEl.src = obj.src;
        } catch(err){
          console.error(err);
        }
        renderObjPanel();
      });
      bgField.appendChild(bgBtn);
      const bgHint = document.createElement('div');
      bgHint.style.fontSize='11px';
      bgHint.style.color='var(--steel)';
      bgHint.style.marginTop='2px';
      bgHint.textContent = 'Best for logos on a plain white background - handy before placing on black or silver.';
      bgField.appendChild(bgHint);
      panel.appendChild(bgField);

      // Single-colour recolour - screen printing is charged per colour, so
      // multi-colour logos need to be forced to one flat colour.
      const recolorField = document.createElement('div');
      recolorField.className='field';
      recolorField.innerHTML = '<label>Print Colour</label>';

      const rcSwatchGrid = document.createElement('div');
      rcSwatchGrid.className = 'swatch-grid';
      activeArtworkColours().forEach(hex=>{
        const sw = document.createElement('button');
        sw.type = 'button';
        sw.className = 'swatch-chip' + (((obj.recolorColor||'').toUpperCase()===hex) ? ' active':'');
        // setProperty(...,'important') so this beats the Magento isolation
        // stylesheet's "background:#fff !important" rule on all buttons -
        // a plain inline style loses to that, an inline !important wins.
        sw.style.setProperty('background', hex, 'important');
        if(hex==='#FFFFFF') sw.classList.add('swatch-chip-white');
        sw.title = hex;
        sw.addEventListener('click', async ()=>{
          if(sw.disabled) return;
          rcSwatchGrid.querySelectorAll('.swatch-chip').forEach(c=>{ c.classList.remove('active'); c.disabled=true; });
          sw.classList.add('active');
          try{
            // always recolor from the pre-recolor source, so toggling between
            // swatches re-applies cleanly instead of recoloring an
            // already-recolored image
            const baseSrc = obj.recolored ? obj.preRecolorSrc : obj.src;
            if(!obj.recolored) obj.preRecolorSrc = obj.src;
            obj.recolorColor = hex;
            obj.src = await recolorToSolid(baseSrc, hex);
            obj.recolored = true;
            const imgEl = objLayer.querySelector(`.obj[data-id="${obj.id}"] img`);
            if(imgEl) imgEl.src = obj.src;
          } catch(err){
            console.error(err);
          }
          renderObjPanel();
        });
        rcSwatchGrid.appendChild(sw);
      });
      recolorField.appendChild(rcSwatchGrid);

      const recolorRow = document.createElement('div');
      recolorRow.className='row2';

      const rcBtn = document.createElement('button');
      rcBtn.className='btn';
      rcBtn.style.width='100%';
      rcBtn.disabled = !obj.recolored || !!selectedSingleScreenInk();
      rcBtn.textContent = 'Restore Original Colours';
      if(selectedSingleScreenInk()) rcBtn.title='Disabled while 1 Colour screen print is selected';
      rcBtn.addEventListener('click', ()=>{
        if(!obj.recolored) return;
        obj.src = obj.preRecolorSrc;
        obj.recolored = false;
        obj.recolorColor = null;
        const imgEl = objLayer.querySelector(`.obj[data-id="${obj.id}"] img`);
        if(imgEl) imgEl.src = obj.src;
        renderObjPanel();
      });
      recolorRow.appendChild(rcBtn);
      recolorField.appendChild(recolorRow);

      const rcHint = document.createElement('div');
      rcHint.style.fontSize='11px';
      rcHint.style.color='var(--steel)';
      rcHint.style.marginTop='2px';
      rcHint.textContent = 'Click a colour to apply it instantly - every visible pixel in the logo becomes that one flat colour (shape and transparency are kept). Click another to switch.';
      recolorField.appendChild(rcHint);

      panel.appendChild(recolorField);
    }

    host.appendChild(panel);
  }

  function updateTextEl(obj){
    obj.boundaryInvalid=false;
    const banner=document.getElementById('boundaryValidationError');
    if(banner) banner.style.display='none';
    const wrap = objLayer.querySelector(`.obj[data-id="${obj.id}"]`);
    const el = wrap ? wrap.querySelector('.obj-text') : null;
    if(!el) return;
    el.textContent = obj.caps ? (obj.text||'').toUpperCase() : obj.text;
    el.style.fontFamily = `'${obj.fontFamily}', sans-serif`;
    el.style.fontSize = (obj.fontSize*0.125)+'cqw';
    el.style.color = obj.color;
    el.style.fontWeight = obj.bold?'700':'400';
    el.style.fontStyle = obj.italic ? 'italic':'normal';
    el.style.textAlign = obj.align;
    if(wrap){
      wrap.style.transform = 'translate(-50%,-50%)';
    }
  }

  // ---------------- style / colour controls ----------------
  function renderColourRow(){
    const row = document.getElementById('colourRow');
    row.innerHTML = '';
    const isCover = state.plateType === 'cover';
    const swatches = isCover ? (state.printMethod === 'screen' ? SCREEN_PRINT_BAND_SWATCHES : BAND_COLOR_SWATCHES) : FRAME_COLOR_SWATCHES;
    row.className = isCover ? 'swatch-grid' : 'swatch-row';

    // Restore the original frame selector: its three labelled material
    // finishes are deliberately not the multi-colour chart.
    if(!isCover){
      swatches.forEach(sw=>{
        const option = document.createElement('div');
        option.className = 'swatch' + (state.color===sw.v ? ' active':'');
        option.dataset.color = sw.v;
        option.innerHTML = `<div class="swatch-dot ${sw.v}"></div>${sw.label}`;
        option.addEventListener('click', ()=>{
          state.color = sw.v;
          renderColourRow();
          renderStyleRow();
          redrawFrame();
        });
        row.appendChild(option);
      });
      return;
    }

    swatches.forEach(sw=>{
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'swatch-chip' + (state.color===sw.v ? ' active':'');
      chip.style.setProperty('background', sw.hex, 'important');
      if(sw.v==='white') chip.classList.add('swatch-chip-white');
      chip.title = sw.label;
      chip.addEventListener('click', ()=>{
        state.color = sw.v;
        renderColourRow();
        renderStyleRow();
        redrawFrame();
      });
      row.appendChild(chip);
    });
  }

  function renderPlateTypeRow(){
    document.querySelectorAll('#plateTypeRow .swatch').forEach(sw=>{
      sw.classList.toggle('active', sw.dataset.type===state.plateType);
      sw.onclick = ()=>{
        state.plateType = sw.dataset.type;
        // A frame can only be black, silver, or white.  If a Lexan-only band
        // colour was selected, return to the original black frame default.
        if(state.plateType === 'frame' && !FRAME_COLOR_SWATCHES.some(c=>c.v===state.color)){
          state.color = 'black';
        }
        renderPlateTypeRow();
        updatePlateTypeLabels();
        renderColourRow();
        renderStyleRow();
        redrawFrame();
      };
    });
  }

  function updatePlateTypeLabels(){
    const isCover = state.plateType==='cover';
    document.getElementById('colourLabel').textContent = isCover ? 'Background Colour' : 'Frame Colour';
    document.getElementById('styleLabel').textContent = isCover ? 'Lexan Style' : 'Frame Style';
    const banner = document.getElementById('modeBanner');
    if(banner){
      banner.textContent = isCover ? 'Now designing: Lexan Plate Cover' : 'Now designing: Licence Plate Frame';
      banner.className = 'mode-banner ' + (isCover ? 'mode-cover' : 'mode-frame');
    }
  }

  function renderStyleRow(){
    const row = document.getElementById('styleRow');
    row.innerHTML='';
    const styles = currentStyleConfig();
    Object.keys(styles).forEach(sid=>{
      const btn = document.createElement('div');
      btn.className='style-btn' + (sid===state.styleId?' active':'');
      const cvs = document.createElement('canvas');
      cvs.width=180; cvs.height=Math.round(180*VH/VW);
      const c2 = cvs.getContext('2d');
      drawPlate(c2, sid, state.color, 180/VW, state.bottomHoles);
      btn.appendChild(cvs);
      const lab = document.createElement('span');
      lab.textContent = styles[sid].label;
      btn.appendChild(lab);
      btn.addEventListener('click', ()=>{
        state.styleId=sid;
        clearBoundaryValidationFeedback();
        renderStyleRow();
        redrawFrame();
        ensureFrameSnapZones();
      });
      row.appendChild(btn);
    });
  }

  // ---------------- upload / add text / download / reset ----------------
  const bottomHolesToggle = document.getElementById('bottomHolesToggle');

  bottomHolesToggle.addEventListener('change', ()=>{
    state.bottomHoles = bottomHolesToggle.checked;
    redrawFrame();
    ensureFrameSnapZones();
    renderStyleRow();
  });

  document.getElementById('uploadBtn').addEventListener('click', ()=>{
    document.getElementById('fileInput').click();
  });
  document.getElementById('fileInput').addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{
      const img = new Image();
      img.onload = ()=> addImageObject(ev.target.result, img.naturalWidth, img.naturalHeight, file);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value='';
  });

  document.getElementById('addTextBtn').addEventListener('click', ()=>{
    addTextObject('YOUR TEXT HERE', {yPct: 50, fontSize:30, color: getContrastTextColor(state.color)});
  });

  function clearDesigner(){
    hideSnapGuides();
    state.plateType = IS_LEXAN ? 'cover' : 'frame';
    state.styleId = '101';
    state.color = 'black';
    state.bottomHoles = false;
    state.objects = [];
    state.selectedId = null;

    bottomHolesToggle.checked = false;
    bottomHolesToggle.checked = state.bottomHoles;
    downloadNameInput.value = state.plateType === 'cover' ? 'my-lexan-cover' : 'my-plate-frame';
    renderColourRow();
    renderStyleRow();
    redrawFrame();
    ensureFrameSnapZones();
    rebuildObjects();
  }

  document.getElementById('resetBtn').addEventListener('click', ()=>{
    if(!confirm('Remove the current design and start over?')) return;
    clearDesigner();
  });

  // Renders the full current design (plate + all objects) to an offscreen
  // canvas at the given scale and hands it to callback(canvas). Shared by
  // the download button and the live preview window so they never drift
  // out of sync with each other.
  // Render the proof/export with the SAME geometry used by the live designer.
  // The frame is still the actual imported LPF production SVG. Artwork is
  // rendered from the same x/y/size state, and text uses the exact live CSS
  // font-size and line-height math instead of a second 85%-scaled version.
  function renderFullDesignToCanvas(scale, callback){
    (async()=>{
      const cvs=document.createElement('canvas');
      cvs.width=VW*scale;
      cvs.height=VH*scale;
      const ctx=cvs.getContext('2d');

      // The licence-frame renderer uses an asynchronously loaded production
      // SVG. Make sure that exact asset is ready before drawing any artwork,
      // otherwise its late paint can clear artwork that was already drawn.
      if(state.plateType==='frame'){
        const frameImg=loadProductionFrame(state.styleId,state.color);
        await waitForImage(frameImg);
      }

      drawPlate(ctx,state.styleId,state.color,scale,state.bottomHoles);

      // Uploaded artwork uses the same percentage box as the live DOM layer.
      for(const obj of state.objects){
        if(obj.type!=='image') continue;

        await new Promise((resolve)=>{
          const img=new Image();
          img.onload=()=>{
            const x=obj.xPct/100*VW*scale;
            const y=obj.yPct/100*VH*scale;
            const w=obj.wPct/100*VW*scale;
            const h=obj.hPct/100*VH*scale;
            ctx.drawImage(img,x,y,w,h);
            resolve();
          };
          img.onerror=()=>{
            console.error('Could not render artwork in preview/export:',obj.originalFileName||obj.id);
            resolve();
          };
          img.src=obj.src;
        });
      }

      // Live CSS uses: font-size = obj.fontSize * 0.125cqw.
      // At the 800-unit design width, that is exactly obj.fontSize logical px.
      // It also uses line-height:1.05. Match those values here exactly.
      for(const obj of state.objects){
        if(obj.type!=='text') continue;

        const fontPx=obj.fontSize*scale;
        const fontStyle=obj.italic ? 'italic' : 'normal';
        const fontWeight=obj.bold ? '700' : '400';
        const fontSpec=`${fontStyle} ${fontWeight} ${fontPx}px '${obj.fontFamily}', sans-serif`;

        try{
          if(document.fonts && document.fonts.load){
            await document.fonts.load(fontSpec);
          }
        }catch(_){}

        ctx.save();
        ctx.font=fontSpec;
        ctx.fillStyle=obj.color;
        ctx.textBaseline='middle';

        const x=obj.xPct/100*VW*scale;
        const y=obj.yPct/100*VH*scale;
        const displayText=obj.caps ? (obj.text||'').toUpperCase() : (obj.text||'');
        const lines=displayText.split('\n');
        const lineHeight=fontPx*1.05;

        // The live .obj wrapper is translate(-50%,-50%), so its intrinsic
        // text block is centred on x/y. Reproduce that block geometry here.
        const widths=lines.map(line=>ctx.measureText(line).width);
        const blockWidth=Math.max(0,...widths);
        const blockHeight=Math.max(lineHeight,lineHeight*lines.length);
        const left=x-blockWidth/2;
        const top=y-blockHeight/2;

        lines.forEach((line,index)=>{
          let lineX=x;
          if(obj.align==='left'){
            ctx.textAlign='left';
            lineX=left;
          }else if(obj.align==='right'){
            ctx.textAlign='right';
            lineX=left+blockWidth;
          }else{
            ctx.textAlign='center';
            lineX=x;
          }

          const lineY=top+(index+.5)*lineHeight;
          ctx.fillText(line,lineX,lineY);
        });

        ctx.restore();
      }

      callback(cvs);
    })().catch(err=>{
      console.error('Could not render design preview/export:',err);
    });
  }

  document.getElementById('downloadBtn').addEventListener('click', async ()=>{
    if(!(await validateArtworkBeforeProduction())) return;
    renderFullDesignToCanvas(state.plateType === 'cover' ? 2 : 1, (cvs)=>{
      cvs.toBlob((blob)=>{
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const chosenName = sanitizeFileName(downloadNameInput.value);
        a.href = url;
        a.download = `${chosenName}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        clearDesigner();
      });
    });
  });

  // ---------------- live preview window ----------------
  let previewWin = null;

  function openLivePreview(){
    if(previewWin && !previewWin.closed){
      previewWin.focus();
      updatePreviewWindow();
      return;
    }
    previewWin = window.open('', 'platePreview', 'width=980,height=680');
    if(!previewWin){
      alert('The preview window was blocked by the browser. Please allow pop-ups for this page and try again.');
      return;
    }
    previewWin.document.write(
      '<!DOCTYPE html><html><head><title>Live Preview</title><meta charset="UTF-8">' +
      '<style>html,body{margin:0;height:100%;background:#2b2b2c;display:flex;align-items:center;justify-content:center;font-family:Arial,sans-serif}.wheels-preview-wrap{display:flex;flex-direction:column;align-items:center;gap:14px}#livePreviewImg{max-width:88vw;max-height:78vh;box-shadow:0 24px 60px rgba(0,0,0,.5);border-radius:6px;background:#fff}.wheels-preview-label{color:#cfcfcf;font-size:13px;letter-spacing:.04em;text-transform:uppercase}</style></head>' +
      '<body class="wheels-preview"><div class="wheels-preview-wrap"><img id="livePreviewImg" alt="Live preview"><div class="wheels-preview-label">Live Preview - updates automatically</div></div></body></html>'
    );
    previewWin.document.close();
    updatePreviewWindow();
  }

  function updatePreviewWindow(){
    if(!previewWin || previewWin.closed) return;
    renderFullDesignToCanvas(2, (cvs)=>{
      if(!previewWin || previewWin.closed) return;
      const imgEl = previewWin.document.getElementById('livePreviewImg');
      if(imgEl) imgEl.src = cvs.toDataURL('image/png');
    });
  }

  document.getElementById('openPreviewBtn').addEventListener('click', openLivePreview);

  window.addEventListener('pagehide', ()=>{
    if(previewWin && !previewWin.closed){
      try{ previewWin.close(); }catch(_){}
    }
    previewWin=null;
  });


  // ---------------- deselect on empty stage click ----------------
  stage.addEventListener('pointerdown', (e)=>{
    if(e.target===stage || e.target===frameCanvas || e.target===objLayer){
      state.selectedId=null;
      rebuildObjects();
    }
  });
  document.addEventListener('keydown', (e)=>{
    if((e.key==='Delete'||e.key==='Backspace') && state.selectedId){
      const active = document.activeElement;
      if(active && (active.tagName==='TEXTAREA' || active.tagName==='INPUT')) return;
      deleteObject(state.selectedId);
    }
  });


  function setupPrintMethodControls(){
    const select = document.getElementById('printMethodSelect');
    const hint = document.getElementById('printMethodHint');
    if(!select) return;

    // The dedicated screen-print page ships with value="screen".
    // Respect that existing page value instead of overwriting it with the
    // core's default "digital" before the page-specific script can run.
    if(select.value === 'screen') state.printMethod = 'screen';
    else select.value = state.printMethod;

    const refresh = ()=>{
      state.printMethod = select.value === 'screen' ? 'screen' : 'digital';
      if(hint) hint.textContent = state.printMethod === 'screen'
        ? 'Screen Print mode: artwork colours are restricted to the approved stock ink palette.'
        : 'Full Colour Digital mode: the full artwork colour palette is available.';
      renderObjPanel();
      if(typeof renderColourRow === 'function') renderColourRow();
      if(typeof renderBorderColourRow === 'function') renderBorderColourRow();
      refreshSpecSummary();
      refreshFileNamePreview();
    };
    select.addEventListener('change', refresh);
    refresh();
  }

  function productLabelForProduction(){
    if(document.body.dataset.designer === 'motorcycle') return 'Motorcycle Plate Cover';
    if(document.body.dataset.designer === 'plate-cover') return 'Plate Sign';
    if(document.body.dataset.designer === 'lexan') return 'Lexan Plate Cover';
    if(document.body.dataset.designer === 'plate-frame') return 'Licence Plate Frame';
    return 'Wheels Design';
  }

  function productionDetailsText(){
    const lines=[];
    lines.push('WHEELS DESIGN STUDIO');
    lines.push('PRODUCTION DETAILS');
    lines.push('');
    lines.push(`Product: ${productLabelForProduction()}`);
    lines.push(`Print Method: ${state.printMethod === 'screen' ? 'Screen Print' : 'Full Colour Digital'}`);
    lines.push(`Design Summary: ${specSummary()}`);
    lines.push(`Created: ${new Date().toLocaleString()}`);
    lines.push('');

    const textObjects=state.objects.filter(o=>o.type==='text');
    lines.push('TEXT');
    if(!textObjects.length){
      lines.push('No text added.');
    }else{
      textObjects.forEach((o,i)=>{
        lines.push(`Text ${i+1}: ${o.text || ''}`);
        lines.push(`  Font: ${o.fontFamily || ''}`);
        lines.push(`  Font Size: ${o.fontSize || ''}`);
        lines.push(`  Colour: ${o.color || ''}`);
        lines.push(`  Bold: ${o.bold ? 'Yes' : 'No'}`);
        lines.push(`  Italic: ${o.italic ? 'Yes' : 'No'}`);
        lines.push(`  Position: X ${Number(o.xPct||0).toFixed(2)}%, Y ${Number(o.yPct||0).toFixed(2)}%`);
      });
    }
    lines.push('');

    const imageObjects=state.objects.filter(o=>o.type==='image');
    lines.push('UPLOADED ARTWORK');
    if(!imageObjects.length){
      lines.push('No customer artwork uploaded.');
    }else{
      imageObjects.forEach((o,i)=>{
        lines.push(`${i+1}. ${o.originalFileName || `artwork-${i+1}`}`);
        lines.push(`   Original file type: ${o.originalFileType || 'unknown'}`);
        lines.push(`   Position: X ${Number(o.xPct||0).toFixed(2)}%, Y ${Number(o.yPct||0).toFixed(2)}%`);
        lines.push(`   Size: ${Number(o.wPct||0).toFixed(2)}% x ${Number(o.hPct||0).toFixed(2)}%`);
      });
    }
    lines.push('');
    lines.push('FILES');
    lines.push('See the PNG proof for the customer-created layout.');
    lines.push('Original customer artwork files are included in the original-artwork folder.');
    lines.push('');
    lines.push('IMPORTANT');
    lines.push('Use the original uploaded artwork for production wherever possible. The PNG is the visual layout/proof.');
    return lines.join('\r\n');
  }

  async function buildProductionZip(cvs, baseName){
    const pngBlob=await new Promise(resolve=>cvs.toBlob(resolve,'image/png'));
    const entries=[
      {name:`${baseName}-Design-Proof.png`, data:pngBlob},
      {name:'Production-Details.txt', data:productionDetailsText()}
    ];

    const usedNames=new Set(entries.map(e=>e.name.toLowerCase()));
    let artworkNumber=1;
    for(const obj of state.objects){
      if(obj.type!=='image' || !obj.originalFileData) continue;
      let originalName=(obj.originalFileName || `artwork-${artworkNumber}`).replace(/[\/:*?\"<>|]+/g,'-');
      if(!originalName) originalName=`artwork-${artworkNumber}`;
      let zipName=`original-artwork/${originalName}`;
      const dot=originalName.lastIndexOf('.');
      const stem=dot>0 ? originalName.slice(0,dot) : originalName;
      const ext=dot>0 ? originalName.slice(dot) : '';
      let copy=2;
      while(usedNames.has(zipName.toLowerCase())) zipName=`original-artwork/${stem}-${copy++}${ext}`;
      usedNames.add(zipName.toLowerCase());
      entries.push({name:zipName,data:WheelsZip.dataUriToBytes(obj.originalFileData)});
      artworkNumber++;
    }
    return WheelsZip.make(entries);
  }

  async function downloadProductionPackage(){
    if(!(await validateArtworkBeforeProduction())) return;
    const btn=document.getElementById('downloadPackageBtn');
    const oldLabel=btn ? btn.textContent : '';
    if(btn){ btn.disabled=true; btn.textContent='Creating ZIP...'; }

    renderFullDesignToCanvas(4, async (cvs)=>{
      try{
        const baseName=sanitizeFileName(downloadNameInput.value) || 'wheels-design';
        const zipBlob=await buildProductionZip(cvs, baseName);
        const url=URL.createObjectURL(zipBlob);
        const a=document.createElement('a');
        a.href=url; a.download=`${baseName}-all-files.zip`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
      }catch(err){
        console.error(err);
        alert('The ZIP could not be created. Please try again.');
      }finally{
        if(btn){ btn.disabled=false; btn.textContent=oldLabel || 'Download Files (ZIP)'; }
      }
    });
  }

  function configuredEmailEndpoint(){
    const meta=document.querySelector('meta[name="wheels-design-email-endpoint"]');
    return (window.WHEELS_DESIGN_EMAIL_ENDPOINT || (meta && meta.content) || '').trim();
  }

  async function emailProductionPackage(){
    if(!(await validateArtworkBeforeProduction())) return;
    const endpoint=configuredEmailEndpoint();
    if(!endpoint){
      alert('Email submission is ready but is not connected to the Wheels email endpoint yet. Please use Download Files (ZIP) for now.');
      return;
    }
    const btn=document.getElementById('emailPackageBtn');
    const oldLabel=btn ? btn.textContent : '';
    if(btn){ btn.disabled=true; btn.textContent='Sending...'; }
    renderFullDesignToCanvas(4, async (cvs)=>{
      try{
        const baseName=sanitizeFileName(downloadNameInput.value) || 'wheels-design';
        const zipBlob=await buildProductionZip(cvs, baseName);
        const form=new FormData();
        form.append('design_files', zipBlob, `${baseName}-all-files.zip`);
        form.append('product', productLabelForProduction());
        form.append('print_method', state.printMethod === 'screen' ? 'Screen Print' : 'Full Colour Digital');
        form.append('design_summary', specSummary());
        form.append('file_name', baseName);
        const response=await fetch(endpoint,{method:'POST',body:form,credentials:'same-origin'});
        if(!response.ok) throw new Error(`Email endpoint returned ${response.status}`);
        alert('Design files were sent to the Wheels design department.');
      }catch(err){
        console.error(err);
        alert('The design could not be emailed. Please download the ZIP and send it to the design department.');
      }finally{
        if(btn){ btn.disabled=false; btn.textContent=oldLabel || 'Email Design Files'; }
      }
    });
  }

  function setupProductionPackage(){
    const btn=document.getElementById('downloadPackageBtn');
    if(btn) btn.addEventListener('click', downloadProductionPackage);
    const emailBtn=document.getElementById('emailPackageBtn');
    if(emailBtn) emailBtn.addEventListener('click', emailProductionPackage);
  }

  // ---------------- init ----------------
  function init(){
    // A page load or hard refresh always starts visually clean. There are no
    // default artwork objects and no leftover snap guides.
    state.objects = [];
    state.selectedId = null;
    objLayer.innerHTML = '';
    hideSnapGuides();

    setupPrintMethodControls();
    setupProductionPackage();
    renderColourRow();
    renderStyleRow();
    redrawFrame();
    rebuildObjects();

    downloadNameInput.addEventListener('input', refreshFileNamePreview);

    window.addEventListener('resize', redrawFrame);

    window.addEventListener('beforeunload', (e)=>{
      if(state.objects.length > 0){
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }
  init();

})();

(function () {
  if (window.top === window.self) return;

  const designer = document.getElementById('plate-frame-designer');
  if (!designer) return;

  let branch = designer;

  while (branch && branch !== document.body) {
    const parent = branch.parentElement;

    Array.from(parent.children).forEach(function (child) {
      if (child !== branch && child.tagName !== 'SCRIPT') {
        child.style.display = 'none';
      }
    });

    parent.style.margin = '0';
    parent.style.padding = '0';
    parent.style.maxWidth = 'none';
    parent.style.width = '100%';

    branch = parent;
  }

  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.background = '#fff';
}());

  }
})();
