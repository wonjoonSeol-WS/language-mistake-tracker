(function () {
  const { el, currentLang } = window.LMT;

  const COLUMNS = [
    { key: 'date',      label: 'Date',      width: 104, cls: 'gt-nowrap gt-muted gt-date' },
    { key: 'language',  label: 'Language',  width: 96,  cls: 'gt-nowrap' },
    { key: 'category',  label: 'Type',      width: 170, cls: 'gt-nowrap' },
    { key: 'original',  label: 'You wrote', width: 230, cls: 'gt-wrong' },
    { key: 'corrected', label: 'Fix',       width: 240, cls: 'gt-right' },
    { key: 'rule',      label: 'Why',       width: 340, cls: 'gt-muted' }
  ];
  const MIN_COL_WIDTH = 56;

  const table = document.getElementById('table');
  const search = document.getElementById('search');
  const filterLabel = document.getElementById('filter-label');
  const colWidths = Object.fromEntries(COLUMNS.map(c => [c.key, c.width]));
  const colNodes = COLUMNS.map(() => el('col'));
  let category = null;

  function applyColWidths() {
    COLUMNS.forEach((c, i) => { colNodes[i].style.width = colWidths[c.key] + 'px'; });
    table.style.width = d3.sum(COLUMNS, c => colWidths[c.key]) + 'px';
  }

  function resizeHandle(column) {
    const handle = el('span', 'gt-resizer');
    handle.title = 'Drag to resize, double-click to reset';
    handle.addEventListener('pointerdown', down => {
      down.preventDefault();
      down.stopPropagation();
      const startX = down.clientX, startW = colWidths[column.key];
      handle.setPointerCapture(down.pointerId);
      handle.classList.add('is-active');
      const move = ev => {
        colWidths[column.key] = Math.max(MIN_COL_WIDTH, Math.round(startW + ev.clientX - startX));
        applyColWidths();
      };
      const up = () => {
        handle.classList.remove('is-active');
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', up);
        handle.removeEventListener('pointercancel', up);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
      handle.addEventListener('pointercancel', up);
    });
    handle.addEventListener('dblclick', () => { colWidths[column.key] = column.width; applyColWidths(); });
    return handle;
  }

  function headerCell(column) {
    const th = el('th', null, column.label);
    th.setAttribute('data-field', column.key);
    th.append(resizeHandle(column));
    return th;
  }

  function setCategory(cat) {
    category = cat;
    filterLabel.textContent = cat ? 'Showing type: ' + cat : '';
  }

  function clearCategory() {
    setCategory(null);
  }

  function showCategory(cat) {
    setCategory(cat);
    drawTable();
    document.getElementById('list-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function matchesSearch(row, query) {
    return !query || COLUMNS.some(c => String(row[c.key] ?? '').toLowerCase().includes(query));
  }

  function tableRow(correction) {
    const tr = el('tr');
    tr.setAttribute('data-key', String(correction.id));
    tr.append(...COLUMNS.map(c => el('td', c.cls, correction[c.key] ?? '')));
    return tr;
  }

  function drawTable() {
    const tbody = document.getElementById('tbody');
    tbody.replaceChildren();
    const d = dash.data('corrections');
    if (d.status !== 'ok') return;
    const lang = currentLang();
    const query = search.value.trim().toLowerCase();
    const rows = (d.data || [])
      .filter(r => lang === 'All' || (r.language || 'English') === lang)
      .filter(r => !category || r.category === category)
      .filter(r => matchesSearch(r, query))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || +b.id - +a.id);
    tbody.append(...rows.map(tableRow));
  }

  document.getElementById('cols').replaceChildren(...colNodes);
  document.getElementById('thead-row').replaceChildren(...COLUMNS.map(headerCell));
  applyColWidths();

  search.addEventListener('input', drawTable);
  document.getElementById('clear').addEventListener('click', () => {
    search.value = '';
    clearCategory();
    drawTable();
  });

  Object.assign(window.LMT, { drawTable, clearCategory, showCategory });
})();
