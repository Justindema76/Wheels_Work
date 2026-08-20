/* Wheels Design Studio — designer engine bootstrap.
   The working designer engine is preserved in wheels-designers-core.js.
   This bootstrap injects the single master artwork palette before executing it,
   so text and logo controls use the same colours in every designer. */
(async function(){
  'use strict';

  const master=(window.WHEELS_GLOBAL_COLOUR_HEXES || []).map(hex=>String(hex).toUpperCase());
  if(!master.length){
    console.error('Wheels Design Studio: global colour palette was not loaded.');
    return;
  }

  try{
    const response=await fetch('js/wheels-designers-core.js?v=global-colours-1',{cache:'no-store'});
    if(!response.ok) throw new Error('Could not load designer core: '+response.status);
    let source=await response.text();

    const paletteReplacement=`const GLOBAL_ARTWORK_COLOURS = window.WHEELS_GLOBAL_COLOUR_HEXES.slice();\n\n  // One master artwork palette for every designer.\n  const SWATCH_COLORS = GLOBAL_ARTWORK_COLOURS;\n  const SCREEN_PRINT_COLORS = GLOBAL_ARTWORK_COLOURS;`;

    const palettePattern=/const SWATCH_COLORS = \[[\s\S]*?\n  \];\n\n  \/\/ SCREEN PRINT STOCK COLOURS[\s\S]*?const SCREEN_PRINT_COLORS = \[[\s\S]*?\n  \];/g;
    const methodPattern=/function activeArtworkColours\(\)\{\s*return state\.printMethod === 'screen' \? SCREEN_PRINT_COLORS : SWATCH_COLORS;\s*\}/g;

    source=source.replace(palettePattern,paletteReplacement);
    source=source.replace(methodPattern,"function activeArtworkColours(){ return GLOBAL_ARTWORK_COLOURS; }");

    if(!source.includes('const GLOBAL_ARTWORK_COLOURS = window.WHEELS_GLOBAL_COLOUR_HEXES.slice();')){
      throw new Error('Global palette injection did not match the designer core.');
    }

    Function(source+'\n//# sourceURL=wheels-designers-core-runtime.js')();
  }catch(error){
    console.error('Wheels Design Studio failed to start:',error);
  }
})();
