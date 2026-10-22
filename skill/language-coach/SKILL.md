---
name: language-coach
description: Correct the user's grammar, spelling and word choice whenever they write in a language they are learning (English by default), then log each correction to their Language mistake tracker dashboard. Use on every user message written in that language, even when the message is about something else.
---

# Language coach

## Settings

- Tracker dashboard: your artifact titled `Language mistake tracker`, found as described under Logging. Its link is called `TRACKER_URL` below.
- Learning languages: English, plus any language the user tells you they are learning. Save the list to your memory if you have one, and use the saved list in later chats.

## Correcting

1. Answer the user's actual request first, as normal.
2. If their message had mistakes in a learning language, end the reply with a short section:

   ```
   Language fixes
   - "what you wrote" → "the fix": one-line rule
   ```

   Skip the section when there is nothing to fix. Ignore code, quoted text, names and deliberate slang. One line per mistake; never rewrite their whole message.

## Logging

Log right after giving fixes, when the Artifact and ArtifactData tools are available. Without them, give the fixes only.

1. Find the dashboard: `Artifact` `list` with `scope` = `mine`, and take the artifact titled `Language mistake tracker` (the most recently updated if there are several). If there is none, give the fixes only and tell the user to install the tracker from https://github.com/wonjoonSeol/language-mistake-tracker.
2. `ArtifactData` `get` collection `datasets`, doc `corrections` on `TRACKER_URL`. Note `source.url` (`/_blob/<asset id>`) and the document `version`.
3. `Artifact` `read` with `url` = `TRACKER_URL` and `path` = the asset id. This saves the current CSV locally.
4. Append one row per fix to that CSV: `id,date,language,category,original,corrected,rule`.
   - `id`: the highest existing id plus one, then counting up.
   - `date`: today, `YYYY-MM-DD`.
   - `language`: the language's English name, capitalized (`English`, `Japanese`, `Korean`). The dashboard matches these names exactly.
   - `category`: one of Articles, Missing words, Prepositions, Pronouns, Singular vs plural, Spelling, Subject-verb agreement, Uncountable nouns, Verb forms & patterns, Word choice & idioms, Word order. Add a new category only when none fits.
   - `rule`: if the CSV already has a row for the same mistake, copy its rule text exactly. The dashboard counts repeats by matching rule text.
   - Quote any field holding a comma or a quote, doubling inner quotes.
5. `Artifact` `publish` with `url` = `TRACKER_URL`, `file_path` = the updated CSV, `asset: true`. Keep the result's `url`.
6. `ArtifactData` `update` collection `datasets`, doc `corrections`, `if_version` from step 2, data:

   ```json
   {
     "source": { "kind": "file", "name": "corrections.csv", "url": "<url from step 5>" },
     "updated": { "at": "<now, ISO 8601>", "by": "Claude" }
   }
   ```

7. `Artifact` `delete` with `url` = `TRACKER_URL` and `path` = the old asset id from step 2, so replaced copies of the CSV do not pile up.

If step 6 is refused because the version changed, delete the asset you uploaded in step 5 and start again from step 2. Mention the logging in one short line at most.
