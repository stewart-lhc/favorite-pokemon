# Task 00 brief: baseline and ledger

## Objective

Prove the isolated worktree starts from a healthy repository state and establish durable SDD status files before any production implementation.

## Required checks

```powershell
npm test
npm run lint
npm run build
npm run check
git diff --check
```

## Completion evidence

- Record exact pass/fail results in `.superpowers/sdd/progress.md`.
- Commit the implementation plan, progress ledger, and this brief.
- Do not change production source during Task 00.
