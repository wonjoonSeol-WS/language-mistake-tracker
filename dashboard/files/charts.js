(function () {
  const { EMPTY_LANGUAGE_TEXT, el, rowsFor, showEmpty, fmtInt, fmtPct, fmtDay, fmtDayShort, parseDay, currentLang } = window.LMT;

  function chartSvg(box, width, height, label) {
    return d3.select(box).insert('svg', ':first-child')
      .attr('width', '100%').attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img').attr('aria-label', label);
  }

  function captionWidth(svg, text) {
    const probe = svg.append('text').style('font-size', 'var(--cds-font-size-caption)').text(text);
    const width = probe.node().getComputedTextLength();
    probe.remove();
    return width;
  }

  function addTooltip(box) {
    const tip = el('div', 'gt-tip-pop');
    box.append(tip);
    return {
      show(lines, x, y) {
        tip.replaceChildren(...lines.map((line, i) => el('div', i === 0 ? 'k' : null, line)));
        tip.style.display = 'block';
        const left = x + 12 + tip.offsetWidth > box.clientWidth ? Math.max(0, x - tip.offsetWidth - 12) : x + 12;
        const top = y - tip.offsetHeight - 8 < 0 ? y + 12 : y - tip.offsetHeight - 8;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
      },
      hide() { tip.style.display = 'none'; }
    };
  }

  function drawCat() {
    const box = document.getElementById('chart-cat');
    const all = rowsFor(box, 'by_category');
    if (!all) return;
    const lang = currentLang();
    const rows = all.filter(r => r.language === lang);
    if (!rows.length) { showEmpty(box, EMPTY_LANGUAGE_TEXT); return; }

    const width = Math.max(240, box.clientWidth);
    const rowH = 32, labelH = 14, barH = 12, pad = 2;
    const svg = chartSvg(box, width, pad + rows.length * rowH, 'Corrections by mistake type');
    const tip = addTooltip(box);
    const maxCount = d3.max(rows, r => r.count);
    const valueLabelW = captionWidth(svg, fmtInt(maxCount) + ' (100%)') + 10;
    const x = d3.scaleLinear([0, maxCount], [0, Math.max(40, width - valueLabelW)]);
    const barW = r => Math.max(2, x(r.count));

    const row = svg.selectAll('g').data(rows).join('g')
      .attr('transform', (r, i) => `translate(0,${pad + i * rowH})`);
    row.append('text').attr('y', labelH - 3)
      .style('fill', 'var(--color-fg)').style('font-size', 'var(--cds-font-size-caption)')
      .text(r => r.category);
    row.append('rect').attr('y', labelH + 2).attr('height', barH).attr('rx', 4).attr('width', barW)
      .style('fill', (r, i) => i === 0 ? dash.colors[0] : 'var(--cds-chart-muted)');
    row.append('text').attr('x', r => barW(r) + 6).attr('y', labelH + barH)
      .style('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)')
      .style('font-variant-numeric', 'tabular-nums')
      .text(r => fmtInt(r.count) + ' (' + fmtPct(r.share) + ')');
    row.append('rect').attr('width', width).attr('height', rowH)
      .style('fill', 'transparent').style('cursor', 'pointer')
      .on('mousemove', (ev, r) => {
        const [mx, my] = d3.pointer(ev, box);
        tip.show([r.category, fmtInt(r.count) + ' corrections', fmtPct(r.share) + ' of ' + (lang === 'All' ? 'all' : lang)], mx, my);
      })
      .on('mouseleave', tip.hide)
      .on('click', (ev, r) => window.LMT.showCategory(r.category));
  }

  function drawDay() {
    const box = document.getElementById('chart-day');
    const all = rowsFor(box, 'by_day');
    if (!all) return;
    const lang = currentLang();
    const rows = all.filter(r => r.language === lang);
    if (!rows.length) { showEmpty(box, EMPTY_LANGUAGE_TEXT); return; }

    const width = Math.max(240, box.clientWidth), height = 180;
    const svg = chartSvg(box, width, height, 'Corrections per day');
    const tip = addTooltip(box);
    const y = d3.scaleLinear([0, d3.max(rows, r => r.count)], [height - 24, 8]).nice();
    const ticks = y.ticks(3).filter(Number.isInteger);
    const left = captionWidth(svg, fmtInt(d3.max(ticks) || 0)) + 10;
    const right = width - 4;
    const x = d3.scaleBand(rows.map(r => r.date), [left, right]).padding(0.3);
    const barW = Math.min(32, x.bandwidth());
    const caption = sel => sel.style('fill', 'var(--color-fg-muted)').style('font-size', 'var(--cds-font-size-caption)');

    svg.append('g').selectAll('line').data(ticks).join('line')
      .attr('x1', left).attr('x2', right).attr('y1', y).attr('y2', y)
      .style('stroke', 'var(--cds-chart-grid)');
    svg.append('g').selectAll('text').data(ticks).join('text')
      .attr('x', left - 6).attr('y', t => y(t) + 4).attr('text-anchor', 'end')
      .call(caption).text(fmtInt);
    svg.append('g').selectAll('rect').data(rows).join('rect')
      .attr('x', r => x(r.date) + (x.bandwidth() - barW) / 2).attr('width', barW)
      .attr('y', r => y(r.count)).attr('height', r => Math.max(0, y(0) - y(r.count))).attr('rx', 4)
      .style('fill', dash.colors[0]);
    svg.append('line').attr('x1', left).attr('x2', right).attr('y1', y(0)).attr('y2', y(0))
      .style('stroke', 'var(--cds-chart-axis)');

    const labelEvery = Math.ceil(rows.length / Math.max(1, Math.floor((width - left) / 60)));
    svg.append('g').selectAll('text').data(rows.filter((r, i) => i % labelEvery === 0)).join('text')
      .attr('x', r => x(r.date) + x.bandwidth() / 2).attr('y', height - 6).attr('text-anchor', 'middle')
      .call(caption).text(r => fmtDayShort(parseDay(r.date)));

    svg.append('g').selectAll('rect').data(rows).join('rect')
      .attr('x', r => x(r.date)).attr('width', x.bandwidth()).attr('height', height - 20)
      .style('fill', 'transparent')
      .on('mousemove', (ev, r) => {
        const [mx, my] = d3.pointer(ev, box);
        tip.show([fmtDay(parseDay(r.date)), fmtInt(r.count) + ' corrections'], mx, my);
      })
      .on('mouseleave', tip.hide);
  }

  Object.assign(window.LMT, { drawCat, drawDay });
})();
