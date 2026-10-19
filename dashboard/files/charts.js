(function () {
  const { el, fmtInt, fmtPct, fmtDay, parseDay, currentScope, scopedRowsIn } = window.LMT;
  const fmtDayShort = d3.utcFormat('%b %-d');

  function chartSvg(box, width, height, label) {
    return d3.select(box).append('svg')
      .attr('width', '100%').attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img').attr('aria-label', label);
  }

  function textWidth(svg, text) {
    const probe = svg.append('text').text(text);
    const width = probe.node().getComputedTextLength();
    probe.remove();
    return width;
  }

  function attachTooltip(box, targets, linesFor) {
    const tooltip = el('div', 'gt-tooltip');
    box.append(tooltip);
    const place = ev => {
      const [x, y] = d3.pointer(ev, box);
      const fitsRight = x + 12 + tooltip.offsetWidth <= box.clientWidth;
      const fitsAbove = y - tooltip.offsetHeight - 8 >= 0;
      tooltip.style.left = (fitsRight ? x + 12 : Math.max(0, x - tooltip.offsetWidth - 12)) + 'px';
      tooltip.style.top = (fitsAbove ? y - tooltip.offsetHeight - 8 : y + 12) + 'px';
    };
    targets
      .on('mouseenter', (ev, d) => {
        tooltip.replaceChildren(...linesFor(d).map((line, i) => el('div', i === 0 ? 'gt-tooltip-title' : null, line)));
        tooltip.style.display = 'block';
        place(ev);
      })
      .on('mousemove', place)
      .on('mouseleave', () => { tooltip.style.display = 'none'; });
  }

  function filterTableByCategory(category) {
    dash.setParams({ category });
    document.getElementById('list-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function drawCategoryChart() {
    const box = document.getElementById('chart-cat');
    const rows = scopedRowsIn(box, 'by_category');
    if (!rows.length) return;

    const scope = currentScope();
    const width = Math.max(240, box.clientWidth);
    const rowHeight = 32, labelHeight = 14, barHeight = 12, top = 2;
    const svg = chartSvg(box, width, top + rows.length * rowHeight, 'Corrections by mistake type');
    const maxCount = d3.max(rows, r => r.count);
    const valueLabelWidth = textWidth(svg, fmtInt(maxCount) + ' (100%)') + 10;
    const x = d3.scaleLinear([0, maxCount], [0, Math.max(40, width - valueLabelWidth)]);
    const barWidth = r => Math.max(2, x(r.count));

    const row = svg.selectAll('g').data(rows).join('g')
      .attr('transform', (r, i) => `translate(0,${top + i * rowHeight})`);
    row.append('text').attr('class', 'gt-chart-label').attr('y', labelHeight - 3).text(r => r.category);
    row.append('rect')
      .attr('y', labelHeight + 2).attr('height', barHeight).attr('rx', 4).attr('width', barWidth)
      .style('fill', r => r.rank === 1 ? dash.colors[0] : 'var(--cds-chart-muted)');
    row.append('text')
      .attr('x', r => barWidth(r) + 6).attr('y', labelHeight + barHeight)
      .text(r => `${fmtInt(r.count)} (${fmtPct(r.share)})`);
    const hitAreas = row.append('rect').attr('class', 'gt-hit').attr('width', width).attr('height', rowHeight)
      .on('click', (ev, r) => filterTableByCategory(r.category));
    attachTooltip(box, hitAreas, r => [
      r.category,
      fmtInt(r.count) + ' corrections',
      `${fmtPct(r.share)} of ${scope === 'All' ? 'all' : scope}`
    ]);
  }

  function drawDayChart() {
    const box = document.getElementById('chart-day');
    const rows = scopedRowsIn(box, 'by_day');
    if (!rows.length) return;

    const width = Math.max(240, box.clientWidth), height = 180;
    const svg = chartSvg(box, width, height, 'Corrections per day');
    const y = d3.scaleLinear([0, d3.max(rows, r => r.count)], [height - 24, 8]).nice();
    const ticks = y.ticks(3).filter(Number.isInteger);
    const left = textWidth(svg, fmtInt(d3.max(ticks) || 0)) + 10;
    const right = width - 4;
    const x = d3.scaleBand(rows.map(r => r.date), [left, right]).padding(0.3);
    const barWidth = Math.min(32, x.bandwidth());

    svg.append('g').selectAll('line').data(ticks).join('line')
      .attr('class', 'gt-grid-line').attr('x1', left).attr('x2', right).attr('y1', y).attr('y2', y);
    svg.append('g').selectAll('text').data(ticks).join('text')
      .attr('x', left - 6).attr('y', t => y(t) + 4).attr('text-anchor', 'end').text(fmtInt);
    svg.append('g').selectAll('rect').data(rows).join('rect')
      .attr('x', r => x(r.date) + (x.bandwidth() - barWidth) / 2).attr('width', barWidth)
      .attr('y', r => y(r.count)).attr('height', r => y(0) - y(r.count)).attr('rx', 4)
      .style('fill', dash.colors[0]);
    svg.append('line').attr('class', 'gt-axis').attr('x1', left).attr('x2', right).attr('y1', y(0)).attr('y2', y(0));

    const minLabelSpacing = 60;
    const labelEvery = Math.ceil(rows.length / Math.max(1, Math.floor((width - left) / minLabelSpacing)));
    svg.append('g').selectAll('text').data(rows.filter((r, i) => i % labelEvery === 0)).join('text')
      .attr('x', r => x(r.date) + x.bandwidth() / 2).attr('y', height - 6).attr('text-anchor', 'middle')
      .text(r => fmtDayShort(parseDay(r.date)));

    const hitAreas = svg.append('g').selectAll('rect').data(rows).join('rect')
      .attr('class', 'gt-hit').attr('x', r => x(r.date)).attr('width', x.bandwidth()).attr('height', height - 20);
    attachTooltip(box, hitAreas, r => [fmtDay(parseDay(r.date)), fmtInt(r.count) + ' corrections']);
  }

  dash.onData(drawCategoryChart);
  dash.onData(drawDayChart);
})();
