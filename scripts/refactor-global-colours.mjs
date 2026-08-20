import fs from 'node:fs';

const root='Wheels-Design-Studio';
const engine=`${root}/js/wheels-designers.js`;
const screen=`${root}/js/screen-print-limits.js`;
const pages=[
  `${root}/frame-digital.html`,
  `${root}/frame-screen-print.html`,
  `${root}/lexan-digital.html`,
  `${root}/lexan-screen-print.html`,
  `${root}/plate-sign.html`,
  `${root}/motorcycle-cover.html`
];

function replaceOrFail(text,pattern,replacement,label){
  if(!pattern.test(text)) throw new Error(`Could not find ${label}`);
  return text.replace(pattern,replacement);
}

let js=fs.readFileSync(engine,'utf8');

js=replaceOrFail(
  js,
  /const SWATCH_COLORS = \[[\s\S]*?\n  \];\n\n  \/\/ SCREEN PRINT STOCK COLOURS[\s\S]*?const SCREEN_PRINT_COLORS = \[[\s\S]*?\n  \];/,
  `const GLOBAL_ARTWORK_COLOURS = (window.WHEELS_GLOBAL_COLOURS || []).map(colour=>colour.hex.toUpperCase());\n\n  // One master artwork palette for every designer.\n  // Text and logo recolour controls both use this exact list.\n  const SWATCH_COLORS = GLOBAL_ARTWORK_COLOURS;\n  const SCREEN_PRINT_COLORS = GLOBAL_ARTWORK_COLOURS;`,
  'artwork colour constants'
);

js=replaceOrFail(
  js,
  /function activeArtworkColours\(\)\{\s*return state\.printMethod === 'screen' \? SCREEN_PRINT_COLORS : SWATCH_COLORS;\s*\}/,
  `function activeArtworkColours(){\n    return GLOBAL_ARTWORK_COLOURS;\n  }`,
  'activeArtworkColours'
);

fs.writeFileSync(engine,js);

let sl=fs.readFileSync(screen,'utf8');
sl=replaceOrFail(
  sl,
  /const STOCK=\[[\s\S]*?\n  \];/,
  `const STOCK=(window.WHEELS_GLOBAL_COLOURS || []).map(colour=>[colour.name,colour.hex.toUpperCase()]);`,
  'screen print STOCK palette'
);
fs.writeFileSync(screen,sl);

for(const page of pages){
  let html=fs.readFileSync(page,'utf8');
  html=html
    .replace(/<link rel="stylesheet" href="css\/artwork-colour-picker\.css(?:\?[^\"]*)?">/g,'')
    .replace(/<script src="js\/artwork-colour-picker\.js(?:\?[^\"]*)?" defer><\/script>/g,'');

  if(!html.includes('js/global-colours.js')){
    html=html.replace(
      /<script src="js\/wheels-designers\.js" defer><\/script>/,
      '<script src="js/global-colours.js?v=1" defer></script><script src="js/wheels-designers.js?v=global-colours-1" defer></script>'
    );
  } else {
    html=html.replace(/js\/global-colours\.js(?:\?[^\"]*)?/g,'js/global-colours.js?v=1');
    html=html.replace(/js\/wheels-designers\.js(?:\?[^\"]*)?/g,'js/wheels-designers.js?v=global-colours-1');
  }
  html=html.replace(/js\/screen-print-limits\.js(?:\?[^\"]*)?/g,'js/screen-print-limits.js?v=global-colours-1');
  fs.writeFileSync(page,html);
}

console.log('Global palette refactor complete.');
