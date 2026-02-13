# CLAUDE.md

## Project Overview

Sovyonok (Совёнок) — a static SPA for teaching preschoolers (3-6 years). Vanilla HTML/CSS/JS, no frameworks, no build tools. Hosted on GitHub Pages.

## Tech Stack

- Vanilla JS with ES modules (`import`/`export`)
- CSS custom properties for theming
- Hash-based SPA router (`#/path`)
- localStorage for state persistence
- Web Audio API for sound effects
- Web Speech API for Russian TTS
- No dependencies, no build step

## Key Architecture

- `js/engine.js` — game engine loads JSON task configs and delegates to type-specific renderers
- `js/games/*.js` — each file renders one game type (choice, sequence, dragdrop, match)
- `data/levels/*.json` — task content as JSON, adding tasks requires no code changes
- `js/state.js` — all app state in localStorage under key `owl-kids-progress`
- `js/router.js` — hash-based router, routes registered in `app.js`

## Routes

- `/` — home (age selection)
- `/mode` — adventure vs free play
- `/topics` — topic grid (free mode)
- `/play/:topic` — game screen
- `/story` — story adventure mode

## Content Format

Tasks in `data/levels/*.json`. Each task has:
- `question` — text only (read aloud by TTS)
- `image` — optional visual part (emoji), displayed separately below question
- `type` — one of: `choice`, `sequence`, `drag-drop`, `match`
- `difficulty` — 1 (easy, 3-4yo) or 2 (harder, 5-6yo)

## Running Locally

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

## Language

- UI and content are in Russian
- Code comments and git messages in English
