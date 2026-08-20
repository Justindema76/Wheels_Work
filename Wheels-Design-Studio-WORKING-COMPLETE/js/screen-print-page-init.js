(function(){
  'use strict';
  const method = document.getElementById('printMethodSelect');
  if(!method) return;
  method.value = 'screen';
  method.dispatchEvent(new Event('change',{bubbles:true}));
})();
