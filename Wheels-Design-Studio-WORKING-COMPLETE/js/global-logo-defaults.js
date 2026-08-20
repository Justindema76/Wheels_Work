(function(){
  'use strict';

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