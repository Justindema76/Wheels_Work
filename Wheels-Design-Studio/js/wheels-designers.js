/* Wheels Design Studio — shared designer bootstrap.
   Keep this narrow: the text settings Font and Colour fields must stack.
   No CSS changes and no new colour component.
*/
(async function(){
  'use strict';

  const master=(window.WHEELS_GLOBAL_COLOUR_HEXES || []).map(hex=>String(hex).toUpperCase());
  if(!master.length){
    console.error('Wheels Design Studio: global colour palette was not loaded.');
    return;
  }

  try{
    const response=await fetch('js/wheels-designers-core.js?v=row2-final-1',{cache:'no-store'});
    if(!response.ok) throw new Error('Could not load designer core: '+response.status);

    let source=await response.text();

    // Keep the one global artwork palette already used by the app.
    const paletteReplacement=`const GLOBAL_ARTWORK_COLOURS = window.WHEELS_GLOBAL_COLOUR_HEXES.slice();\n\n  const SWATCH_COLORS = GLOBAL_ARTWORK_COLOURS;\n  const SCREEN_PRINT_COLORS = GLOBAL_ARTWORK_COLOURS;`;
    const palettePattern=/const SWATCH_COLORS = \[[\s\S]*?\n  \];\n\n  \/\/ SCREEN PRINT STOCK COLOURS[\s\S]*?const SCREEN_PRINT_COLORS = \[[\s\S]*?\n  \];/g;
    const methodPattern=/function activeArtworkColours\(\)\{\s*return state\.printMethod === 'screen' \? SCREEN_PRINT_COLORS : SWATCH_COLORS;\s*\}/g;
    source=source.replace(palettePattern,paletteReplacement);
    source=source.replace(methodPattern,"function activeArtworkColours(){ return GLOBAL_ARTWORK_COLOURS; }");

    // ROW2 FIX ONLY:
    // Font and Colour were both appended to row2, forcing them side-by-side.
    // Append each field directly to the Text Settings panel instead.
    source=source.replace(/row2\.appendChild\(fFont\);/g,'panel.appendChild(fFont);');
    source=source.replace(/row2\.appendChild\(fColor\);/g,'panel.appendChild(fColor);');

    // Remove the now-empty row2 before Font Size.
    source=source.replace(/\s*panel\.appendChild\(row2\);\s*(?=const fSize = document\.createElement\('div'\);)/g,'\n      ');

    // Text Colour must use the existing swatch-grid sizing, exactly like Logo Print Colour.
    source=source.replace(/\s*colorGrid\.style\.gridTemplateColumns\s*=\s*'repeat\(4,1fr\)';/g,'');

    // Same wording as the logo control.
    source=source.replace("fColor.innerHTML='<label>Colour</label>';","fColor.innerHTML='<label>Print Colour</label>';" );

    Function(source+'\n//# sourceURL=wheels-designers-core-runtime.js')();
  }catch(error){
    console.error('Wheels Design Studio failed to start:',error);
  }
})();
