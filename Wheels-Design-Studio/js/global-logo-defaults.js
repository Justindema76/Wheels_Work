(function(){
  'use strict';

  /*
   * Shared designer modules.
   * All current designer pages already load this file, so it acts as the
   * compatibility bootstrap while the application is being cleaned up.
   */
  function loadSharedFontLibrary(){
    if(document.querySelector('script[data-wheels-font-library]')) return;

    const currentScript = document.currentScript;
    const base = currentScript && currentScript.src
      ? new URL('.', currentScript.src)
      : new URL('js/', window.location.href);

    const script = document.createElement('script');
    script.src = new URL('font-library.js', base).href;
    script.defer = true;
    script.dataset.wheelsFontLibrary = 'true';
    document.head.appendChild(script);
  }

  loadSharedFontLibrary();

  function removeWhiteBackgroundByDefault(){
    const host=document.getElementById('objPanelHost');
    if(!host) return;

    const removeButton=[...host.querySelectorAll('button')]
      .find(btn=>btn.textContent.trim()==='Remove White Background');

    if(removeButton && !removeButton.disabled && removeButton.dataset.autoWhiteRemoval!=='done'){
      removeButton.dataset.autoWhiteRemoval='done';
      removeButton.click();
    }
  }

  function start(){
    const host=document.getElementById('objPanelHost');
    if(!host) return;

    new MutationObserver(()=>{
      window.setTimeout(removeWhiteBackgroundByDefault,0);
    }).observe(host,{childList:true,subtree:true});

    const fileInput=document.getElementById('fileInput');
    if(fileInput){
      fileInput.addEventListener('change',()=>{
        window.setTimeout(removeWhiteBackgroundByDefault,100);
        window.setTimeout(removeWhiteBackgroundByDefault,250);
      });
    }

    removeWhiteBackgroundByDefault();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();