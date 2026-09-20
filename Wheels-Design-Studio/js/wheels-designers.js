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
    const response=await fetch('js/wheels-designers-core.js?v=row2-final-2',{cache:'no-store'});
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

    // Shared mobile accordion behaviour. Desktop markup and behaviour stay untouched.
    function setupMobileAccordions(){
      if(!window.matchMedia('(max-width: 640px)').matches) return;
      const root=document.getElementById('plate-frame-designer');
      if(!root) return;

      const enhance=(panel,index)=>{
        if(!panel || panel.dataset.mobileAccordion==='1') return;
        let title=panel.querySelector(':scope > .panel-label, :scope > .obj-panel-title');
        if(!title) return;

        const label=(title.childNodes[0] && title.childNodes[0].textContent || title.textContent || 'Settings').trim();
        const head=document.createElement('button');
        head.type='button';
        head.className='mobile-accordion-head';
        head.textContent=label || 'Settings';

        const body=document.createElement('div');
        body.className='mobile-accordion-body';

        Array.from(panel.children).forEach(child=>{
          if(child!==title) body.appendChild(child);
        });
        title.remove();

        panel.insertBefore(head,panel.firstChild);
        panel.appendChild(body);
        panel.classList.add('mobile-accordion');
        panel.dataset.mobileAccordion='1';

        // Keep the first useful settings group open; everything else is compact.
        if(index===0) panel.classList.add('is-open');
        head.addEventListener('click',()=>{
          const opening=!panel.classList.contains('is-open');
          const scope=panel.closest('.sidebar, #colourDock, .lexan-types-panel') || root;
          scope.querySelectorAll('.mobile-accordion.is-open').forEach(other=>{
            if(other!==panel) other.classList.remove('is-open');
          });
          panel.classList.toggle('is-open',opening);
        });
      };

      const scan=()=>{
        const panels=[
          ...root.querySelectorAll('.sidebar > .panel-block'),
          ...root.querySelectorAll('.sidebar > #objPanelHost > .obj-panel'),
          ...root.querySelectorAll('#colourDock > .panel-block'),
          ...root.querySelectorAll('#colourDock .below-stage-controls > .panel-block'),
          ...root.querySelectorAll('.lexan-types-panel .panel-block')
        ];
        panels.forEach((panel,index)=>enhance(panel,index));
      };

      scan();
      const host=root.querySelector('#objPanelHost');
      if(host) new MutationObserver(scan).observe(host,{childList:true,subtree:false});
    }
    setupMobileAccordions();
  }catch(error){
    console.error('Wheels Design Studio failed to start:',error);
  }
})();
