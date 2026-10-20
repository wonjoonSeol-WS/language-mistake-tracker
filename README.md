# Language mistake tracker

**English** | [한국어](README.ko.md)

**Claude fixes your English in every chat. This turns the fixes into a review sheet.**

A Claude dashboard that turns the language corrections Claude gives you in chat into a review sheet: your most common mistake types, habits you repeat, rules with memory tricks, and a searchable list of every correction.

It has two parts:

- **Dashboard** (`dashboard/`): a Claude Dashboard artifact that shows the corrections.
- **Skill** (`skill/language-coach/`): tells Claude to correct your writing in every chat and log each fix to the dashboard.

## Preview

What you get after a few chats (sample data).

![Headline mistake, memory trick, top mistakes and repeated mistakes](docs/images/preview-overview.png)

![Rule cards with a memory trick and your own examples](docs/images/preview-rules.png)

![Mistakes by type and corrections per day](docs/images/preview-charts.png)

![Searchable table of every correction](docs/images/preview-table.png)

Screenshots use made-up sample data.

## Install and update (in the Claude app, phones too)

### Before you start (once)

1. In your **browser** (not the app), open [claude.ai Settings > Capabilities](https://claude.ai/settings/capabilities). Sign in first if you aren't.
2. Turn on **Code execution and file creation**.
3. Turn on **Allow network egress**.
   - This option **isn't in the app's settings**; turn it on in a browser. Once it's on, it applies to the app too.
   - Some accounts have it off by default.
4. Go back to the app and start a **new chat**. Chats that were already open don't pick up the new setting.
5. If a new chat is still blocked, the setting can take **a few minutes** to apply. Try again in about 5 minutes.

![Claude Settings > Capabilities: turn on Code execution and file creation and Allow network egress](docs/images/egress-setting.png)

### Install

Paste this into a new chat as is.

```
Install https://github.com/wonjoonSeol-WS/language-mistake-tracker by following its INSTALL.md
```

Claude creates your dashboard and adds the language-coach skill to your Claude account, so it works in the Claude app and in Claude Code. Open the dashboard link it gives you. If Claude cannot add the skill itself, it gives you `language-coach.zip` to upload under **Settings > Customize > Skills**.

To check it works, send a sentence with a mistake, such as `She go to work yesterday`. The reply should end with a **Language fixes** section, and the dashboard shows the new row after a refresh.

### Update

Your corrections are tied to the dashboard link. **A new dashboard starts empty**, so always update the one you already have. Replace the link on the last line with your dashboard's address.

```
Update my Language mistake tracker from https://github.com/wonjoonSeol-WS/language-mistake-tracker by following the "Updating" section of its INSTALL.md.
My dashboard: (paste your dashboard link here)
```

Claude replaces the dashboard's page and refreshes the skill. Your corrections and guides stay as they are.

## Manual install (Claude Code)

### 1. Create the dashboard

You need Claude Code signed in to the same Claude account you use in the Claude app.

```sh
git clone https://github.com/wonjoonSeol-WS/language-mistake-tracker.git
cd language-mistake-tracker
claude
```

Then ask Claude:

> Create a new Dashboard artifact named "Language mistake tracker" from this repo. Upload `examples/corrections.example.csv` and `examples/guides.example.json` as its files, write `dashboard/meta.json`, `dashboard/params.json` and `dashboard/datasets/*.json` (with the uploaded file URLs) into its store, and write every file in `dashboard/files/` as `files/<name>`.

Claude replies with the dashboard's link (`https://claude.ai/artifact/...`). Keep it for step 2.

To start empty, keep only the header line of the example CSV. The example guides can stay; a guide with no corrections yet shows as "Flagged by you".

| Store document | Comes from |
|---|---|
| `dash/meta` | `dashboard/meta.json` |
| `dash/params` | `dashboard/params.json` |
| `datasets/corrections`, `datasets/guides` | `dashboard/datasets/*.json`, with `source.url` set to the uploaded file |
| `files/<name>` (`{"text": ...}`) | `dashboard/files/<name>` |

### 2. Turn it on for every chat

1. In `skill/language-coach/SKILL.md`, replace `TRACKER_URL` with your dashboard link. If you are learning more than English, add those languages under **Learning languages**.
2. Add the skill to your Claude account. Zip the `skill/language-coach` folder, then upload it in the Claude app under **Settings > Customize > Skills**. Account skills sync to Claude Code too (they appear under `~/.claude/skills/synced/`). To use it only in Claude Code, copy the folder to `~/.claude/skills/language-coach/` instead.
3. Make it run on every message, not only when Claude decides it is relevant:
   - Claude app: under **Settings > Profile**, add this to your personal preferences: `When I write in English, use the language-coach skill to correct my mistakes and log them.`
   - Claude Code: add the same line to `~/.claude/CLAUDE.md`.

Menu names can differ by plan and app version. On Team and Enterprise plans, an admin may need to allow custom skills.

### 3. Check it works

Send Claude a sentence with a mistake, such as `She go to work yesterday`. The reply should end with a **Language fixes** section, and the dashboard should show the new row after a refresh.

## Repository layout

```
dashboard/
  meta.json, params.json   dashboard title and default language filter
  datasets/                where the corrections and guides files are read from
  files/
    index.html             markup; loads the stylesheet and scripts below in order
    styles.css
    calcs.js               derived datasets (counts, ranks, per-day, totals, repeats)
    shared.js              window.LMT: formatters and DOM helpers used by every panel
    header.js              language buttons, headline numbers, memory tip
    review.js              top mistakes, repeated mistakes, guide cards
    charts.js              mistakes-by-type and per-day charts
    table.js               corrections table: columns, resizing, search, type filter
skill/language-coach/      the correcting and logging skill
INSTALL.md                 step-by-step install instructions Claude follows
examples/                  sample corrections and guides
docs/images/               README screenshots
data/                      your own data, git-ignored
```

## How the page works

The page runs inside the Claude dashboard, not as a standalone HTML file. The dashboard provides `dash` (data loading, derived datasets, filters), `d3` v7 and theme variables such as `--color-fg`. It runs each script in its own scope, so the files share code through `window.LMT`, and each panel file registers its own `dash.onData` redraw.

Every chart and number comes from these derived datasets:

| calc | input | holds |
|---|---|---|
| `scoped` | corrections | each correction twice, under `scope` = its language and `scope` = `All`; blank language becomes English, `day` is `YYYY-MM-DD` |
| `by_category` | scoped | count, share, rank and latest example per (scope, category) |
| `by_day` | scoped | corrections per (scope, day) |
| `totals` | scoped | total, mistake types, active days and first day per scope |
| `repeats` | scoped | rules corrected more than once per scope |

The language buttons set the `language` filter, and every panel shows the rows whose `scope` equals it, so `All` needs no special case. A calc's function must be self-contained because readers can see its source, so shared normalization lives in `scoped` instead of a helper.

## Data format

`corrections.csv`: `id,date,language,category,original,corrected,rule`. A repeat is the same language, category and rule text, so reuse the exact rule wording for the same mistake.

`guides.json`: an array of `{id, language, category, title, rule, mnemonic, examples}`, where `examples` is `"wrong → right | wrong → right"`.
