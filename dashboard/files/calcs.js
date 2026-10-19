// A calc's fn runs in isolation and readers see its source, so shared normalization lives in `scoped`.

dash.calc('scoped', {
  inputs: ['corrections'],
  title: 'Corrections by scope',
  description: 'Each correction twice: under the scope of its own language and under the All scope. A blank language counts as English; day is the date as YYYY-MM-DD.',
  fn: (corrections) => corrections.flatMap(r => {
    const language = r.language || 'English';
    const row = Object.assign({}, r, { language: language, day: String(r.date).slice(0, 10) });
    return [language, 'All'].map(scope => Object.assign({ scope: scope }, row));
  })
});

dash.calc('by_category', {
  inputs: ['scoped'],
  title: 'Mistakes by type',
  description: 'Per scope: each mistake type with its count, share, rank (most common first) and latest example.',
  fn: (scoped) => {
    const groups = new Map();
    scoped.forEach(r => {
      const key = r.scope + '|' + r.category;
      const g = groups.get(key) || { scope: r.scope, category: r.category, count: 0, latest: r };
      g.count += 1;
      if (+r.id > +g.latest.id) g.latest = r;
      groups.set(key, g);
    });
    const groupsByScope = new Map();
    groups.forEach(g => groupsByScope.set(g.scope, (groupsByScope.get(g.scope) || []).concat(g)));
    return Array.from(groupsByScope.values()).flatMap(inScope => {
      const total = inScope.reduce((sum, g) => sum + g.count, 0);
      return inScope
        .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
        .map((g, i) => ({
          scope: g.scope,
          category: g.category,
          count: g.count,
          share: g.count / total,
          rank: i + 1,
          example_original: g.latest.original,
          example_corrected: g.latest.corrected,
          example_rule: g.latest.rule
        }));
    });
  }
});

dash.calc('by_day', {
  inputs: ['scoped'],
  title: 'Corrections per day',
  description: 'Per scope: corrections logged on each day, oldest day first.',
  fn: (scoped) => {
    const counts = new Map();
    scoped.forEach(r => {
      const key = r.scope + '|' + r.day;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.keys()).sort().map(key => {
      const [scope, date] = key.split('|');
      return { scope: scope, date: date, count: counts.get(key) };
    });
  }
});

dash.calc('totals', {
  inputs: ['scoped'],
  title: 'Totals',
  description: 'Per scope: total corrections, mistake types, days with corrections and the first day logged.',
  fn: (scoped) => {
    const byScope = new Map();
    scoped.forEach(r => {
      const t = byScope.get(r.scope) || { total: 0, categories: new Set(), days: new Set() };
      t.total += 1;
      t.categories.add(r.category);
      t.days.add(r.day);
      byScope.set(r.scope, t);
    });
    return Array.from(byScope, ([scope, t]) => {
      const days = Array.from(t.days).sort();
      return { scope: scope, total: t.total, categories: t.categories.size, days: days.length, since: days[0] };
    });
  }
});

dash.calc('repeats', {
  inputs: ['scoped'],
  title: 'Made more than once',
  description: 'Per scope: rules corrected more than once (same mistake type and rule text), how many times, and the latest example.',
  fn: (scoped) => {
    const groups = new Map();
    scoped.forEach(r => {
      const key = [r.scope, r.category, r.rule].join('|');
      const g = groups.get(key) || { scope: r.scope, category: r.category, rule: r.rule, times: 0, latest: r };
      g.times += 1;
      if (+r.id > +g.latest.id) g.latest = r;
      groups.set(key, g);
    });
    return Array.from(groups.values())
      .filter(g => g.times > 1)
      .sort((a, b) => b.times - a.times || +b.latest.id - +a.latest.id)
      .map(g => ({
        scope: g.scope,
        category: g.category,
        rule: g.rule,
        times: g.times,
        example_original: g.latest.original,
        example_corrected: g.latest.corrected
      }));
  }
});
