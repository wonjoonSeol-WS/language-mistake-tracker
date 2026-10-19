// A calc's fn runs in isolation and readers see its source, so shared normalization lives in `scoped`.

dash.calc('scoped', {
  inputs: ['corrections'],
  title: 'Corrections by language',
  description: 'Each correction listed twice: once under its language (English if blank) and once under All, with its date as YYYY-MM-DD.',
  fn: (corrections) => corrections.flatMap(r => {
    const row = Object.assign({}, r, { day: String(r.date).slice(0, 10) });
    return [r.language || 'English', 'All'].map(language => Object.assign({}, row, { language: language }));
  })
});

dash.calc('by_category', {
  inputs: ['scoped'],
  title: 'Mistakes by type',
  description: 'Per language and for all languages: each mistake type with its count, share, rank (most common first) and latest example.',
  fn: (scoped) => {
    const groups = new Map();
    scoped.forEach(r => {
      const key = r.language + '|' + r.category;
      const g = groups.get(key) || { language: r.language, category: r.category, count: 0, latest: r };
      g.count += 1;
      if (+r.id > +g.latest.id) g.latest = r;
      groups.set(key, g);
    });
    const totalByLanguage = {};
    groups.forEach(g => { totalByLanguage[g.language] = (totalByLanguage[g.language] || 0) + g.count; });
    const rankInLanguage = {};
    return Array.from(groups.values())
      .sort((a, b) => a.language.localeCompare(b.language) || b.count - a.count || a.category.localeCompare(b.category))
      .map(g => ({
        language: g.language,
        category: g.category,
        count: g.count,
        share: g.count / totalByLanguage[g.language],
        rank: rankInLanguage[g.language] = (rankInLanguage[g.language] || 0) + 1,
        example_original: g.latest.original,
        example_corrected: g.latest.corrected,
        example_rule: g.latest.rule
      }));
  }
});

dash.calc('by_day', {
  inputs: ['scoped'],
  title: 'Corrections per day',
  description: 'Counts corrections logged on each day, per language and for all languages, oldest day first.',
  fn: (scoped) => {
    const counts = new Map();
    scoped.forEach(r => {
      const key = r.language + '|' + r.day;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.keys()).sort().map(key => {
      const [language, date] = key.split('|');
      return { language: language, date: date, count: counts.get(key) };
    });
  }
});

dash.calc('totals', {
  inputs: ['scoped'],
  title: 'Totals',
  description: 'Per language and for all languages: total corrections, mistake types, days with corrections and the first day logged.',
  fn: (scoped) => {
    const byLanguage = new Map();
    scoped.forEach(r => {
      const t = byLanguage.get(r.language) || { total: 0, categories: new Set(), days: new Set() };
      t.total += 1;
      t.categories.add(r.category);
      t.days.add(r.day);
      byLanguage.set(r.language, t);
    });
    return Array.from(byLanguage, ([language, t]) => {
      const days = Array.from(t.days).sort();
      return { language: language, total: t.total, categories: t.categories.size, days: days.length, since: days[0] };
    });
  }
});

dash.calc('repeats', {
  inputs: ['scoped'],
  title: 'Made more than once',
  description: 'Per language and for all languages: rules you were corrected on more than once (same mistake type and rule text), how many times, and the latest example.',
  fn: (scoped) => {
    const groups = new Map();
    scoped.forEach(r => {
      const key = [r.language, r.category, r.rule].join('|');
      const g = groups.get(key) || { language: r.language, category: r.category, rule: r.rule, times: 0, latest: r };
      g.times += 1;
      if (+r.id > +g.latest.id) g.latest = r;
      groups.set(key, g);
    });
    return Array.from(groups.values())
      .filter(g => g.times > 1)
      .sort((a, b) => b.times - a.times || +b.latest.id - +a.latest.id)
      .map(g => ({
        language: g.language, category: g.category, rule: g.rule, times: g.times,
        example_original: g.latest.original, example_corrected: g.latest.corrected
      }));
  }
});
