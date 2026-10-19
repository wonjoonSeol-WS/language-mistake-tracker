(function () {
  const { el, currentScope, okRows } = window.LMT;
  const MIN_COLUMN_WIDTH = 56;

  const columns = [
    { key: 'date',      label: 'Date',      defaultWidth: 104, cellClass: 'gt-nowrap gt-muted gt-date' },
    { key: 'language',  label: 'Language',  defaultWidth: 96,  cellClass: 'gt-nowrap' },
    { key: 'category',  label: 'Type',      defaultWidth: 170, cellClass: 'gt-nowrap' },
    { key: 'original',  label: 'You wrote', defaultWidth: 230, cellClass: 'gt-wrong' },
    { key: 'corrected', label: 'Fix',       defaultWidth: 240, cellClass: 'gt-right' },
    { key: 'rule',      label: 'Why',       defaultWidth: 340, cellClass: 'gt-muted' }
  ].map(column => ({ ...column, width: column.defaultWidth, node: el('col') }));

  const table = document.getElementById('table');
  const tbody = document.getElementById('tbody');
  const search = document.getElementById('search');
  const filterLabel = document.getElementById('filter-label');

  function applyColumnWidths() {
    columns.forEach(column => { column.node.style.width = column.width + 'px'; });
    table.style.width = d3.sum(columns, column => column.width) + 'px';
  }

  function resizeHandle(column) {
    const handle = el('span', 'gt-resizer');
    handle.title = 'Drag to resize, double-click to reset';
    let startX, startWidth;
    d3.select(handle).call(d3.drag()
      .on('start', ev => {
        startX = ev.x;
        startWidth = column.width;
        handle.classList.add('is-active');
      })
      .on('drag', ev => {
        column.width = Math.max(MIN_COLUMN_WIDTH, Math.round(startWidth + ev.x - startX));
        applyColumnWidths();
      })
      .on('end', () => handle.classList.remove('is-active')));
    handle.addEventListener('dblclick', () => {
      column.width = column.defaultWidth;
      applyColumnWidths();
    });
    return handle;
  }

  function headerCell(column) {
    const th = el('th', null, column.label);
    th.setAttribute('data-field', column.key);
    th.append(resizeHandle(column));
    return th;
  }

  function matchesSearch(row, query) {
    return !query || columns.some(column => String(row[column.key] ?? '').toLowerCase().includes(query));
  }

  function tableRow(row) {
    const tr = el('tr');
    tr.setAttribute('data-key', [row.scope, row.id].map(encodeURIComponent).join(','));
    tr.append(...columns.map(column => el('td', column.cellClass, row[column.key] ?? '')));
    return tr;
  }

  function messageRow(className, text) {
    const td = el('td', className, text);
    td.colSpan = columns.length;
    const tr = el('tr');
    tr.append(td);
    return tr;
  }

  function drawTable() {
    const category = dash.params().category;
    filterLabel.textContent = category ? 'Showing type: ' + category : '';
    tbody.replaceChildren();
    if (dash.data('scoped').status === 'error') {
      tbody.append(messageRow('gt-fail', 'Failed to load'));
      return;
    }
    const rows = okRows('scoped');
    if (!rows) return;
    const query = search.value.trim().toLowerCase();
    const visible = rows
      .filter(r => r.scope === currentScope())
      .filter(r => !category || r.category === category)
      .filter(r => matchesSearch(r, query))
      .sort((a, b) => b.day.localeCompare(a.day) || b.id - a.id);
    tbody.append(...(visible.length ? visible.map(tableRow) : [messageRow('gt-empty', 'No corrections match')]));
  }

  document.getElementById('cols').replaceChildren(...columns.map(column => column.node));
  document.getElementById('thead-row').replaceChildren(...columns.map(headerCell));
  applyColumnWidths();

  search.addEventListener('input', drawTable);
  document.getElementById('clear').addEventListener('click', () => {
    search.value = '';
    dash.setParams({ category: null });
    drawTable();
  });

  dash.onData(drawTable);
})();
