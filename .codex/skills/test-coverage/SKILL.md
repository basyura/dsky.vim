---
name: test-coverage
description: Use this project-specific skill when the user asks for test coverage, code coverage, coverage percentages, or how to include missing files in coverage for this dsky.vim repository, especially under denops/dsky with Deno.
metadata:
  short-description: Output project test coverage
---

# Test Coverage

Use this skill to report test coverage for this repository.

## Workflow

1. Check the project test entrypoints before running coverage.
   - `scripts/test.sh`
   - `denops/dsky/deno.json`
   - test files under `denops/dsky/**/*_test.ts`
2. For Denops TypeScript coverage, run from `denops/dsky`:

   ```sh
   deno test --coverage=/private/tmp/dsky-deno-coverage
   ```

3. If Deno reports `Missing transpiled source code`, rerun with cache refresh:

   ```sh
   deno test --reload --coverage=/private/tmp/dsky-deno-coverage-reload
   ```

   If this fails because dependencies must be downloaded, request network
   approval and rerun the same command.

4. Report only the important result:
   - test pass/fail count
   - overall Branch / Function / Line coverage
   - notable per-file coverage
   - files skipped from coverage, if any

## Notes

- Use a coverage output directory under `/private/tmp` to avoid repository
  churn.
- If the user asks specifically about `denops` coverage, do not include Vim
  script tests in the percentage.
- If `ui/buffer.ts` is skipped with `Missing transpiled source code`, the usual
  fix is `deno test --reload --coverage=<dir>` from `denops/dsky`.
