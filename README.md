# Language mistake tracker

A personal dashboard that logs the language corrections Claude gives me in chat and turns them into a review sheet: most common mistake types, repeated habits, rules with memory tricks, and a searchable list of every correction.

It runs as a Claude Dashboard artifact. This repo holds its page and dataset definitions. The correction data itself is personal and stays out of git (`data/` is ignored).

## Layout

```
dashboard/
  index.html            page (HTML, CSS and script) stored as files/index.html
  meta.json             dash/meta    - dashboard title
  params.json           dash/params  - default filter (language)
  datasets/*.json       datasets/*   - where each dataset reads from
data/                   (git-ignored, local only)
  corrections.csv       every correction: id,date,language,category,original,corrected,rule
  guides.json           one guide per (language, category): title, rule, mnemonic, examples
```

## How the page works

The page is not a standalone HTML file. The dashboard host injects it into `#dash-root` and provides:

- `dash` - dataset loading (`dash.data`), derived datasets (`dash.calc`), redraw hook (`dash.onData`), filters (`dash.params`/`dash.setParams`) and series colors.
- `d3` v7 as a global.
- Theme tokens such as `--color-fg` and `--cds-gap-md`.

Derived datasets, all built from `corrections`:

| calc          | input       | what it holds |
|---------------|-------------|---------------|
| `scoped`      | corrections | each correction under its language and under `All`, with `day` normalized |
| `by_category` | scoped      | count, share, rank and latest example per (language, category) |
| `by_day`      | scoped      | corrections per (language, day) |
| `totals`      | scoped      | totals, mistake types, active days and first day per language |
| `repeats`     | scoped      | rules corrected more than once per language |

A `dash.calc` function must be self-contained (readers can see its source), which is why shared normalization lives in the `scoped` calc instead of a helper.

## Adding corrections

Append rows to `data/corrections.csv` with the next `id`, then upload the file to the dashboard and point `datasets/corrections` at the new blob.
