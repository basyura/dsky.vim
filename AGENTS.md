# Repository Guidelines

## Project Structure & Module Organization
- `plugin/` and `autoload/` hold Vim script entrypoints and runtime helpers.
- `syntax/` contains syntax highlighting rules.
- `denops/dsky/` contains the Denops TypeScript implementation, split into
  API modules (`api/`), UI helpers (`ui/`), and shared types/constants.

## Build, Test, and Development Commands
This repository does not include build or test scripts. Development is done by
loading the plugin in Vim/Neovim with Denops enabled.
- Example: use your plugin manager to load this repo, then call `:DSkyTimeline`
  to verify the Denops integration.

## Coding Style & Naming Conventions
- Vim script uses 2-space indentation and keeps settings/commands at top-level
  in `plugin/` with functional logic under `autoload/`.
- TypeScript follows the existing style: 2-space indentation, semicolons, and
  named exports from feature modules (e.g., `api/feed.ts`).
- Keep filenames lowercase with words separated by underscores or folders
  grouping related features (e.g., `autoload/dsky/util/str.vim`).

## Testing Guidelines
No automated tests or test framework are present. If you add tests, place them
under a new `tests/` directory and document how to run them.

## Commit & Pull Request Guidelines
- Recent history uses short, imperative commit subjects, often in Japanese.
  If you follow that pattern, keep subjects concise and focused on one change.
- Pull requests should include a short description of behavior changes and, if
  UI/UX is affected, screenshots or Vim command examples (e.g., `:DSkySay`).

## Agent-Specific Notes
- Denops runs inside Vim/Neovim, so avoid blocking calls in TypeScript and keep
  user-facing commands responsive.
