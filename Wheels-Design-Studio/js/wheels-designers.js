/* Wheels Design Studio — designer engine bootstrap.
   This file does NOT contain layout CSS.
   It loads the preserved designer core and applies shared application rules:
   1) one global artwork colour palette,
   2) the same swatch component for logo and text,
   3) Text Colour is placed BELOW Font at full panel width.
*/
(async function(){
  'use strict';

  const master=(window.WHEELS_GLOBAL_COLOUR_HEXES || []).map(hex=>String(hex).toUpperCase());

  if(!master.length){
    console.error('Wheels Design Studio: global colour palette was not loaded.');
    return;
  }

  try{
    const response=await fetch('js/wheels-designers-core.js?v=global-colours-4',{cache:'no-store'});

    if(!response.ok){
      throw new Error('Could not load designer core: '+response.status);
    }

    let source=await response.text();

    const paletteReplacement=
`const GLOBAL_ARTWORK_COLOURS = window.WHEELS_GLOBAL_COLOUR_HEXES.slice();

  // One master artwork palette for every designer.
  const SWATCH_COLORS = GLOBAL_ARTWORK_COLOURS;
  const SCREEN_PRINT_COLORS = GLOBAL_ARTWORK_COLOURS;`;

    const palettePattern=
      /const SWATCH_COLORS = \[[\s\S]*?\n  \];\n\n  \/\/ SCREEN PRINT STOCK COLOURS[\s\S]*?const SCREEN_PRINT_COLORS = \[[\s\S]*?\n  \];/g;

    const methodPattern=
      /function activeArtworkColours\(\)\{\s*return state\.printMethod === 'screen' \? SCREEN_PRINT_COLORS : SWATCH_COLORS;\s*\}/g;

    source=source.replace(palettePattern,paletteReplacement);
    source=source.replace(
      methodPattern,
      "function activeArtworkColours(){ return GLOBAL_ARTWORK_COLOURS; }"
    );

    // Text and Logo use the same shared swatch-grid CSS.
    source=source.replace(
      /\s*colorGrid\.style\.gridTemplateColumns\s*=\s*'repeat\(4,1fr\)';/g,
      ''
    );

    // Put Text Colour BELOW Font so the palette gets the full panel width.
    source=source.replace(
      /const row2 = document\.createElement\('div'\);\s*row2\.className='row2';\s*([\s\S]*?)fFont\.appendChild\(sel\);\s*row2\.appendChild\(fFont\);\s*([\s\S]*?)fColor\.appendChild\(colorGrid\);\s*row2\.appendChild\(fColor\);\s*panel\.appendChild\(row2\);/,
      (match, fontBlock, colorBlock) => {
        return `const row2 = document.createElement('div');
      row2.className='row2';

      ${fontBlock}fFont.appendChild(sel);
      panel.appendChild(fFont);

      ${colorBlock}fColor.appendChild(colorGrid);
      panel.appendChild(fColor);`;
      }
    );

    if(!source.includes(
      'const GLOBAL_ARTWORK_COLOURS = window.WHEELS_GLOBAL_COLOUR_HEXES.slice();'
    )){
      throw new Error('Global palette injection did not match the designer core.');
    }

    Function(source+'\n//# sourceURL=wheels-designers-core-runtime.js')();

  }catch(error){
    console.error('Wheels Design Studio failed to start:',error);
  }
})();
