# Install steps for Claude

The user asked you to install the Language mistake tracker. Run these steps in Claude Code, in order. Reply to the user in the language they wrote to you in.

## 1. Get the repository

If the current directory is not this repository, clone `https://github.com/wonjoonSeol-WS/language-mistake-tracker` into your scratchpad directory and work from there.

## 2. Create the dashboard

1. Call `Artifact` with `action: "quickstart"` and `intent: "other"`, then create an artifact from the Dashboard type it names, titled `Language mistake tracker`.
2. Keep the new artifact's URL. Below it is called `TRACKER_URL`.

## 3. Upload the starting data

1. Write a `corrections.csv` that holds only the header line of `examples/corrections.example.csv`, so the tracker starts empty.
2. Upload that file and `examples/guides.example.json` to `TRACKER_URL` with `Artifact` `publish`, `asset: true`. Keep each result's `url`.

## 4. Write the dashboard

Make one `ArtifactData` `batch` call to `TRACKER_URL` with these `set` writes:

| collection / doc_id | data |
|---|---|
| `dash` / `meta` | `dashboard/meta.json` |
| `dash` / `params` | `dashboard/params.json` |
| `datasets` / `corrections` | `dashboard/datasets/corrections.json`, with `source.url` set to the uploaded CSV's url and `updated: {at: <now, ISO 8601>, by: "Claude"}` |
| `datasets` / `guides` | `dashboard/datasets/guides.json`, with `source.url` set to the uploaded guides' url and `updated` as above |
| `files` / `<name>` | `{"text": <contents of dashboard/files/<name>>}`, one write per file in `dashboard/files/` |

## 5. Build the skill

1. Copy `skill/language-coach/` into your scratchpad directory.
2. In the copied `SKILL.md`, replace `TRACKER_URL` with the real URL.
3. Ask the user which languages they are learning (default: English) and update **Learning languages** in the copy.
4. Zip the copied folder as `language-coach.zip` in the scratchpad directory. Also copy the zip to `~/Downloads/` so the user has it.

## 6. Add the skill to the user's Claude account

An account skill works in the Claude app and syncs to Claude Code, so it is the only copy needed.

If the Claude in Chrome tools are available:

1. Open `https://claude.ai/settings`, then **Customize > Skills**, then **Add > Upload skill**.
2. Upload the scratchpad zip to the file input with the file upload tool. It cannot read `~/Downloads`, so use the scratchpad copy.
3. Check that the preview shows `language-coach`, click **Upload**, and confirm the skill page opens with the toggle on.

Without browser tools, copy the skill folder to `~/.claude/skills/language-coach/` so Claude Code can use it now, and tell the user to upload `~/Downloads/language-coach.zip` under **Settings > Customize > Skills**. Once they have uploaded it, delete the local folder, since the account copy syncs and two copies would both run.

Then ask the user before adding this line, with their languages filled in, to their personal preferences in the Claude app and to `~/.claude/CLAUDE.md`: `When I write in English, use the language-coach skill to correct my mistakes and log them.`

## 7. Hand over

Give the user the dashboard link. Tell them to send a sentence with a mistake (for example `She go to work yesterday`) to check that a **Language fixes** section appears and a row shows up on the dashboard.
