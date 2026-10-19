---
name: language-coach
description: Correct the user's grammar, spelling and word choice whenever they write in a language they are learning (English by default), then log each correction to their Language mistake tracker dashboard. Use on every user message written in that language, even when the message is about something else.
---

# Language coach

## Settings

- Tracker dashboard: `TRACKER_URL` (replace with your dashboard's claude.ai artifact link)
- Learning languages: English

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

1. `ArtifactData` `get` collection `datasets`, doc `corrections` on `TRACKER_URL`. Note `source.url` (`/_blob/<asset id>`) and the document `version`.
2. `Artifact` `read` with `url` = `TRACKER_URL` and `path` = the asset id. This saves the current CSV locally.
3. Append one row per fix to that CSV: `id,date,language,category,original,corrected,rule`.
   - `id`: the highest existing id plus one, then counting up.
   - `date`: today, `YYYY-MM-DD`.
   - `category`: one of Articles, Missing words, Prepositions, Pronouns, Singular vs plural, Spelling, Subject-verb agreement, Uncountable nouns, Verb forms & patterns, Word choice & idioms, Word order. Add a new category only when none fits.
   - `rule`: if the CSV already has a row for the same mistake, copy its rule text exactly. The dashboard counts repeats by matching rule text.
   - Quote any field holding a comma or a quote, doubling inner quotes.
4. `Artifact` `publish` with `url` = `TRACKER_URL`, `file_path` = the updated CSV, `asset: true`. Keep the result's `url`.
5. `ArtifactData` `update` collection `datasets`, doc `corrections`, `if_version` from step 1, data:

   ```json
   {
     "source": { "kind": "file", "name": "corrections.csv", "url": "<url from step 4>" },
     "updated": { "at": "<now, ISO 8601>", "by": "Claude" }
   }
   ```

If a write is refused because the version changed, start again from step 1. Mention the logging in one short line at most.
