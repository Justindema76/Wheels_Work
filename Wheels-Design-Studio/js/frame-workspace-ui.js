
(function(){
  'use strict';

  const root=document.getElementById('plate-frame-designer');
  if(!root || !root.classList.contains('frame-workspace-app')) return;

  const tabs=[...root.querySelectorAll('.inspector-tab')];
  const panes=[...root.querySelectorAll('.inspector-pane')];
  const objHost=root.querySelector('#objPanelHost');

  function activate(name){
    tabs.forEach(btn=>{
      const active=btn.dataset.inspectorTarget===name;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',active?'true':'false');
    });
    panes.forEach(pane=>{
      pane.classList.toggle('active',pane.dataset.inspectorPane===name);
    });
  }

  tabs.forEach(btn=>{
    btn.addEventListener('click',()=>activate(btn.dataset.inspectorTarget));
  });

  if(objHost){
    const watch=()=>{
      if(objHost.children.length) activate('object');
    };
    new MutationObserver(watch).observe(objHost,{childList:true});
  }

  activate('object');
})();
