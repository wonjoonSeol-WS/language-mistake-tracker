# Install steps for Claude

The user asked you to install the Language mistake tracker. Run these steps in order, in the Claude app or in Claude Code. Reply to the user in the language they wrote to you in.

## 1. Get the repository

If the current directory is not this repository, download it with bash (not web fetch) into your working or scratchpad directory:

```sh
curl -L -o language-mistake-tracker.zip https://github.com/wonjoonSeol-WS/language-mistake-tracker/archive/refs/heads/main.zip
unzip -q language-mistake-tracker.zip
cd language-mistake-tracker-main
```

If the download is blocked, tell the user to turn on **Code execution and file creation** and **Allow network egress** at https://claude.ai/settings/capabilities and to retry in a new chat.

## 2. Create the dashboard

1. Create a new artifact from the Dashboard artifact type, titled `Language mistake tracker`. In Claude Code, call `Artifact` with `action: "quickstart"` and `intent: "other"` to find that type.
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

1. Copy `skill/language-coach/` into your working or scratchpad directory.
2. Zip the copied folder as `language-coach.zip`. In Claude Code, also copy the zip to `~/Downloads/` so the user has it.

## 6. Add the skill to the user's Claude account

An account skill works in the Claude app and syncs to Claude Code, so it is the only copy needed. Use the first option you can:

1. **A tool that saves skills to the user's account:** save the built skill with it.
2. **Browser tools (for example Claude in Chrome):** open `https://claude.ai/settings`, go to **Customize > Skills > Add > Upload skill**, upload the zip from your working or scratchpad directory (the upload tool cannot read `~/Downloads`), check that the preview shows `language-coach`, and click **Upload**.
3. **Neither:** give the user `language-coach.zip` as a file to download, and tell them to upload it under **Settings > Customize > Skills > Add > Upload skill**. In Claude Code, also copy the skill folder to `~/.claude/skills/language-coach/` so it works right away, and delete that folder once the account copy is uploaded, since both copies would run.

Then ask the user which languages they are learning (default: English), and ask before adding this line with those languages filled in, to their personal preferences in the Claude app and to `~/.claude/CLAUDE.md`: `When I write in English, use the language-coach skill to correct my mistakes and log them.`

## 7. Hand over

Give the user the dashboard link. Tell them to send a sentence with a mistake (for example `She go to work yesterday`) to check that a **Language fixes** section appears and a row shows up on the dashboard.

## Updating

Use this section instead of steps 2 to 4 when the user asks to update and gives their dashboard link (`TRACKER_URL`). Never create a new dashboard: their corrections live in the existing one.

1. Get the repository as in step 1.
2. Read the dashboard's `files` collection. In one batch write, `set` every file in `dashboard/files/` as `files/<name>` (`{"text": ...}`), and `delete` any `files/<name>` the repository no longer has.
3. Read `dash/params` and add any key from `dashboard/params.json` it lacks, keeping the values it already has.
4. Leave `dash/meta` and the `datasets` documents unchanged, so the user's data stays.
5. Build the skill as in step 5 and add it to the account as in step 6, replacing the existing `language-coach` skill rather than adding a second one. If you cannot replace it, tell the user to delete the old one under **Settings > Customize > Skills**.
6. Tell the user what changed and to reload the dashboard.
