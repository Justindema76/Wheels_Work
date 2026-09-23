/* Wheels Design Studio — shared designer bootstrap.
   Keep this narrow: shared colour data and text settings layout.
   No CSS changes and no duplicate colour components.
*/
(async function(){
  'use strict';

  const master=(window.WHEELS_GLOBAL_COLOUR_HEXES || []).map(hex=>String(hex).toUpperCase());
  if(!master.length){
    console.error('Wheels Design Studio: global colour palette was not loaded.');
    return;
  }

  try{
    const response=await fetch('js/wheels-designers-core.js?v=contour-validation-1',{cache:'no-store'});
    if(!response.ok) throw new Error('Could not load designer core: '+response.status);

    let source=await response.text();

    // One global artwork palette for logo, text and screen-print ink selection.
    const paletteReplacement=`const GLOBAL_ARTWORK_COLOURS = window.WHEELS_GLOBAL_COLOUR_HEXES.slice();\n\n  const SWATCH_COLORS = GLOBAL_ARTWORK_COLOURS;\n  const SCREEN_PRINT_COLORS = GLOBAL_ARTWORK_COLOURS;`;
    const palettePattern=/const SWATCH_COLORS = \[[\s\S]*?\n  \];\n\n  \/\/ SCREEN PRINT STOCK COLOURS[\s\S]*?const SCREEN_PRINT_COLORS = \[[\s\S]*?\n  \];/g;
    const methodPattern=/function activeArtworkColours\(\)\{\s*return state\.printMethod === 'screen' \? SCREEN_PRINT_COLORS : SWATCH_COLORS;\s*\}/g;
    source=source.replace(palettePattern,paletteReplacement);
    source=source.replace(methodPattern,"function activeArtworkColours(){ return GLOBAL_ARTWORK_COLOURS; }");

    // Lexan Background Colour / colour dock uses the exact same global palette.
    source=source.replace(
      /const BAND_COLOR_SWATCHES = \[[\s\S]*?\n  \];/g,
      "const BAND_COLOR_SWATCHES = (window.WHEELS_GLOBAL_COLOURS || []).map(colour=>({v:colour.hex, hex:colour.hex, label:colour.name}));"
    );

    // Font and Colour stack vertically in Text Settings.
    source=source.replace(/row2\.appendChild\(fFont\);/g,'panel.appendChild(fFont);');
    source=source.replace(/row2\.appendChild\(fColor\);/g,'panel.appendChild(fColor);');
    source=source.replace(/\s*panel\.appendChild\(row2\);\s*(?=const fSize = document\.createElement\('div'\);)/g,'\n      ');
    source=source.replace(/\s*colorGrid\.style\.gridTemplateColumns\s*=\s*'repeat\(4,1fr\)';/g,'');
    source=source.replace("fColor.innerHTML='<label>Colour</label>';","fColor.innerHTML='<label>Print Colour</label>';" );

    Function(source+'\n//# sourceURL=wheels-designers-core-runtime.js')();

    // Mobile preview must always have an obvious way back to the designer.
    source=source.replace(
      '<body class="wheels-preview"><div class="wheels-preview-wrap">',
      '<body class="wheels-preview"><button type="button" class="wheels-preview-close" onclick="window.close()">← Back to Designer</button><div class="wheels-preview-wrap">'
    );
    source=source.replace(
      '</style></head>',
      '.wheels-preview-close{position:fixed;top:max(16px,env(safe-area-inset-top));left:16px;z-index:20;padding:11px 14px;border:1px solid #555;border-radius:8px;background:#fff;color:#17181c;font:700 14px Arial,sans-serif;cursor:pointer}</style></head>'
    );

    // Shared mobile accordion behaviour. Desktop markup and behaviour stay untouched.
    function setupMobileAccordions(){
      if(!window.matchMedia('(max-width: 640px)').matches) return;
      const root=document.getElementById('plate-frame-designer');
      if(!root) return;

      function directTitle(panel){
        for(const child of Array.from(panel.children)){
          if(child.classList && (child.classList.contains('panel-label') || child.classList.contains('obj-panel-title'))) return child;
        }
        return null;
      }

      function enhance(panel,openFirst){
        if(!panel || panel.dataset.mobileAccordion==='1') return;
        const title=directTitle(panel);
        if(!title) return;

        const head=document.createElement('button');
        head.type='button';
        head.className='mobile-accordion-head';
        const raw=(title.textContent || 'Settings').trim();
        head.textContent=raw.replace(/Delete$/i,'').trim() || 'Settings';

        const body=document.createElement('div');
        body.className='mobile-accordion-body';
        Array.from(panel.children).forEach(child=>body.appendChild(child));

        panel.insertBefore(head,panel.firstChild);
        panel.appendChild(body);
        panel.classList.add('mobile-accordion');
        panel.dataset.mobileAccordion='1';
        if(openFirst) panel.classList.add('is-open');

        head.addEventListener('click',function(){
          const opening=!panel.classList.contains('is-open');
          const scope=panel.parentElement;
          if(scope){
            Array.from(scope.children).forEach(other=>{
              if(other!==panel && other.classList && other.classList.contains('mobile-accordion')) other.classList.remove('is-open');
            });
          }
          panel.classList.toggle('is-open',opening);
        });
      }

      function scan(){
        const groups=[];
        const sidebar=root.querySelector('.sidebar');
        if(sidebar) Array.from(sidebar.children).forEach(el=>{
          if(el.classList && el.classList.contains('panel-block')) groups.push(el);
        });
        const colourDock=root.querySelector('#colourDock');
        if(colourDock){
          Array.from(colourDock.children).forEach(el=>{
            if(el.classList && el.classList.contains('panel-block')) groups.push(el);
          });
          colourDock.querySelectorAll('.below-stage-controls > .panel-block').forEach(el=>groups.push(el));
        }
        root.querySelectorAll('.lexan-types-panel .panel-block').forEach(el=>groups.push(el));
        const host=root.querySelector('#objPanelHost');
        if(host) Array.from(host.children).forEach(el=>{
          if(el.classList && el.classList.contains('obj-panel')) groups.push(el);
        });

        groups.forEach((panel,index)=>enhance(panel,index===0));
      }

      scan();
      const host=root.querySelector('#objPanelHost');
      if(host) new MutationObserver(scan).observe(host,{childList:true});
    }
    setupMobileAccordions();
  }catch(error){
    console.error('Wheels Design Studio failed to start:',error);
  }
})();
