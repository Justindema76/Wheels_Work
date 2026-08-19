(() => {
  const designers = window.WHEELS_DESIGNERS || [];
  const tabs = document.getElementById('designerTabs');
  const frame = document.getElementById('designerFrame');
  const title = document.getElementById('currentTitle');
  const description = document.getElementById('currentDescription');
  const openDirect = document.getElementById('openDirect');

  function getRequestedDesigner() {
    const requested = new URLSearchParams(location.search).get('designer');
    return designers.find(d => d.id === requested) || designers[0];
  }

  function loadDesigner(designer, updateUrl = true) {
    if (!designer) return;
    frame.src = designer.source;
    title.textContent = designer.name;
    description.textContent = designer.description;
    openDirect.href = designer.source;
    openDirect.textContent = 'Open ' + designer.name;
    [...tabs.querySelectorAll('button')].forEach(button => {
      const active = button.dataset.id === designer.id;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('designer', designer.id);
      history.replaceState({}, '', url);
    }
  }

  designers.forEach(designer => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.id = designer.id;
    button.textContent = designer.name;
    button.addEventListener('click', () => loadDesigner(designer));
    tabs.appendChild(button);
  });

  loadDesigner(getRequestedDesigner(), false);
})();
