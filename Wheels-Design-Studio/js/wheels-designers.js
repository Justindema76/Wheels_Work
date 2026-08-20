/* Wheels Design Studio — designer engine bootstrap.
   Shared application rules only. No CSS/layout stylesheet changes here.

   Rules:
   - one global artwork colour palette
   - Logo Print Colour and Text Print Colour use the SAME swatch-grid component
   - Text Font is full width
   - Text Print Colour sits directly underneath Font at full width
   - Screen Print still limits artwork choices through screen-print-limits.js
*/
(async function(){
  'use strict';

  const master=(window.WHEELS_GLOBAL_COLOUR_HEXES || []).map(hex=>String(hex).toUpperCase());
  if(!master.length){
    console.error('Wheels Design Studio: global colour palette was not loaded.');
    return;
  }

  try{
    const response=await fetch('js/wheels-designers-core.js?v=global-colours-5',{cache:'no-store'});
    if(!response.ok) throw new Error('Could not load designer core: '+response.status);

    let source=await response.text();

    // One master palette for logo and text artwork everywhere.
    const paletteReplacement=`const GLOBAL_ARTWORK_COLOURS = window.WHEELS_GLOBAL_COLOUR_HEXES.slice();\n\n  const SWATCH_COLORS = GLOBAL_ARTWORK_COLOURS;\n  const SCREEN_PRINT_COLORS = GLOBAL_ARTWORK_COLOURS;`;
    const palettePattern=/const SWATCH_COLORS = \[[\s\S]*?\n  \];\n\n  \/\/ SCREEN PRINT STOCK COLOURS[\s\S]*?const SCREEN_PRINT_COLORS = \[[\s\S]*?\n  \];/g;
    const methodPattern=/function activeArtworkColours\(\)\{\s*return state\.printMethod === 'screen' \? SCREEN_PRINT_COLORS : SWATCH_COLORS;\s*\}/g;

    source=source.replace(palettePattern,paletteReplacement);
    source=source.replace(methodPattern,"function activeArtworkColours(){ return GLOBAL_ARTWORK_COLOURS; }");

    // Never allow Text Colour to force its own tiny four-column grid.
    source=source.replace(/\s*colorGrid\.style\.gridTemplateColumns\s*=\s*'repeat\(4,1fr\)';/g,'');

    // Reuse the exact same full-width swatch-grid component used by Logo Settings.
    // This replaces only the Font + Colour block in Text Settings.
    const textFontColourBlock=/\s*const row2 = document\.createElement\('div'\);\s*row2\.className='row2';[\s\S]*?panel\.appendChild\(row2\);\s*const fSize = document\.createElement\('div'\);/;

    const textFontColourReplacement=`
      const fFont = document.createElement('div');
      fFont.className='field';
      fFont.innerHTML='<label>Font</label>';
      const sel = document.createElement('select');
      FONT_OPTIONS.forEach(f=>{
        const o=document.createElement('option');
        o.value=f;
        o.textContent=f;
        if(f===obj.fontFamily) o.selected=true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', ()=>{
        obj.fontFamily=sel.value;
        updateTextEl(obj);
      });
      fFont.appendChild(sel);
      panel.appendChild(fFont);

      const fColor = document.createElement('div');
      fColor.className='field';
      fColor.innerHTML='<label>Print Colour</label>';
      const colorGrid = buildSwatchGrid(obj.color, (hex)=>{
        obj.color=hex;
        updateTextEl(obj);
      });
      fColor.appendChild(colorGrid);
      panel.appendChild(fColor);

      const fSize = document.createElement('div');`;

    if(!textFontColourBlock.test(source)){
      throw new Error('Text Settings Font/Colour block did not match the designer core.');
    }
    source=source.replace(textFontColourBlock,textFontColourReplacement);

    if(!source.includes('const GLOBAL_ARTWORK_COLOURS = window.WHEELS_GLOBAL_COLOUR_HEXES.slice();')){
      throw new Error('Global palette injection did not match the designer core.');
    }

    Function(source+'\n//# sourceURL=wheels-designers-core-runtime.js')();
  }catch(error){
    console.error('Wheels Design Studio failed to start:',error);
  }
})();
