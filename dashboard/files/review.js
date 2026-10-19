(function () {
  const { el, fmtInt, currentScope, okRows, noteIn, resetPanel, scopedRowsIn, guideFor } = window.LMT;

  function exampleNode(tag, wrong, right) {
    const node = el(tag, 'gt-ex');
    node.append(el('span', 'gt-wrong', wrong ?? ''));
    if (right) node.append(el('span', 'gt-arrow', ' → '), el('span', 'gt-right', right));
    return node;
  }

  function reviewItem({ name, count, rule, wrong, right }) {
    const top = el('div', 'gt-rv-top');
    top.append(el('span', 'gt-rv-name', name), el('span', 'gt-rv-count', count));
    const item = el('li');
    item.append(top, el('p', 'gt-rv-rule', rule ?? ''), exampleNode('p', wrong, right));
    return item;
  }

  function drawTopMistakes() {
    const box = document.getElementById('review-top');
    const top3 = scopedRowsIn(box, 'by_category').slice(0, 3);
    box.append(...top3.map(r => {
      const guide = guideFor(currentScope(), r.category);
      return reviewItem({
        name: r.category,
        count: fmtInt(r.count) + ' times',
        rule: guide ? guide.rule : r.example_rule,
        wrong: r.example_original,
        right: r.example_corrected
      });
    }));
  }

  function drawRepeats() {
    const box = document.getElementById('review-repeats');
    const top5 = scopedRowsIn(box, 'repeats', 'No repeated mistakes yet').slice(0, 5);
    box.append(...top5.map(r => reviewItem({
      name: r.category,
      count: '×' + fmtInt(r.times),
      rule: r.rule,
      wrong: r.example_original,
      right: r.example_corrected
    })));
  }

  function guideCard(guide, count, showLanguage) {
    const meta = el('div', 'gt-guide-meta');
    meta.append(
      el('span', null, showLanguage ? `${guide.category} (${guide.language})` : guide.category),
      el('span', null, count ? fmtInt(count) + ' corrections' : 'Flagged by you'));
    const trick = el('p', 'gt-guide-trick');
    trick.append(el('b', null, 'Memory trick: '), guide.mnemonic ?? '');
    const examples = el('ul', 'gt-guide-ex');
    String(guide.examples ?? '').split(' | ').filter(Boolean).forEach(pair => {
      const [wrong, ...right] = pair.split(' → ');
      examples.append(exampleNode('li', wrong, right.join(' → ')));
    });
    const card = el('article', 'gt-guide');
    card.append(meta, el('h3', null, guide.title), el('p', 'gt-guide-rule', guide.rule), trick, examples);
    return card;
  }

  function drawGuides() {
    const box = document.getElementById('guides');
    const guides = resetPanel(box, 'guides');
    if (!guides) return;
    const scope = currentScope();
    const countOf = new Map((okRows('by_category') || []).map(r => [r.scope + '|' + r.category, r.count]));
    const cards = guides
      .filter(g => scope === 'All' || g.language === scope)
      .map(g => ({ guide: g, count: countOf.get(g.language + '|' + g.category) || 0 }))
      .sort((a, b) => b.count - a.count || a.guide.id - b.guide.id);
    if (!cards.length) {
      noteIn(box, 'gt-empty', 'No rules for this language yet');
      return;
    }
    box.append(...cards.map(({ guide, count }) => guideCard(guide, count, scope === 'All')));
  }

  dash.onData(drawTopMistakes);
  dash.onData(drawRepeats);
  dash.onData(drawGuides);
})();
