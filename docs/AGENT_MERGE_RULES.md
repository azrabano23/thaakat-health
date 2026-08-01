# Merge discipline — read before editing anything

Three agents are working this repo in parallel on separate branches, all merging to `main`.
Everything below exists to keep those merges boring. Follow it even when a shortcut looks harmless.

---

## 1. Know which files are contested

**Hot files — every branch wants them. Touch as little as possible.**

| File | Why it's contested |
|---|---|
| `app/intake/page.tsx` | The demo surface. Every feature wants to render something here. |
| `lib/clusters.ts` | The cluster engine + seeded patients. The moat. |
| `lib/criteria.ts` | Retrieval corpus. |
| `package.json` | Dependency lists conflict on every concurrent add. |

**Cold files — safe to own.** Anything under `lib/voice/`, `lib/imaging.ts`, `lib/moss.ts`,
`app/api/*/route.ts`, and any new file you create.

Rule: **new behavior goes in a new file.** Wire it into a hot file with the smallest possible
edit — ideally one import and one JSX element. If your diff on a hot file is more than ~20 lines,
stop and ask whether it belongs in a new module instead.

---

## 2. Edits to hot files must be additive

- **Append, don't reorganize.** Add your case to the end of a switch, your field to the end of a
  type, your block to the end of a list.
- **Never reformat, re-sort, re-indent, or rename** anything you did not author. A rename plus
  someone else's edit to the same symbol is the single worst conflict class in git.
- **Never move a file.** Git tracks it as delete + add, and the other branch's changes are lost.
- **Do not "clean up while you're in there."** Drive-by refactors in hot files cause conflicts far
  out of proportion to their value. Note the cleanup and raise it separately.

---

## 3. Rebase, never merge

```bash
git fetch origin
git rebase origin/main      # NOT: git merge main
```

Rebase daily, and always right before you open a PR. Linear history means each conflict is
resolved once instead of resurfacing on every subsequent merge.

If a rebase conflict looks non-trivial, stop and ask rather than guessing at the other branch's
intent. Guessing at someone else's half-finished feature reliably produces silent breakage.

---

## 4. Adding dependencies

`package.json` and the lockfile conflict on every concurrent add. Before adding one:

1. Say so in the group chat first — someone may already be adding it.
2. Add the dependency in a **standalone commit** that changes nothing else. A one-line
   `package.json` conflict is trivial to resolve; a conflict tangled with feature code is not.
3. Run `pnpm install` and commit the lockfile in that same commit.

---

## 5. Definition of done — no exceptions

A change is not finished until:

- [ ] `pnpm build` passes. Not "should compile" — you ran it and saw it pass.
- [ ] All FHIR objects typed with `@medplum/fhirtypes`, **R4 only**. No invented fields, search
      params, or operations. Check the Medplum docs rather than trusting recall — LLMs blend in R5
      and deprecated fields, and that is a silent bug a typed resource is supposed to catch.
- [ ] No API keys in client code. Browser gets short-lived minted tokens only; Stedi, Medplum, and
      Anthropic keys stay in API routes and bots.
- [ ] Synthetic data only. Never real patient data.
- [ ] Clinical language is **decision-support**: "flag", "suggest", "consistent with", "worth
      discussing". Never "diagnose" or "you have X" — in UI copy, prompts, comments, and any
      string the agent may speak.
- [ ] Medical codes (SNOMED / LOINC / ICD-10 / CPT) are either verified or clearly marked as
      placeholders needing human review. Do not let a plausible-looking hallucinated code ship
      unmarked.

---

## 6. Report honestly

If something is broken, unverified, or you could not test it, **say so explicitly** in the PR
description. On a demo timeline an unknown-broken feature is far more expensive than a
known-missing one — someone will build a demo beat on top of it and find out on stage.

State plainly what you verified and how. "Typechecks and builds; the failure path is untested
because it needs a real browser" is a good report. "Done ✅" on untested code is not.
