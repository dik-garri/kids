# Sovyonok — Preschool Learning App

Interactive web app for teaching preschoolers (ages 3-6). Math, literacy, logic, world knowledge, and attention training — all in one place.

**[Live Demo](https://dik-garri.github.io/kids/)** (GitHub Pages)

## Features

- **5 topics**: Numbers & counting, Letters & words, Logic, World around us, Attention & memory
- **4 game types**: Multiple choice, Sequence ordering, Drag-and-drop, Match pairs
- **2 modes**: Free play (pick any topic) + Story adventure (guided by Sovyonok the owl)
- **Adaptive difficulty**: Auto-adjusts based on last 5 answers (easy for 3-4yo, harder for 5-6yo)
- **Voice-over**: Pre-recorded WAV speech for all 50 questions (Edge TTS, Svetlana voice), with Web Speech API fallback
- **Sound effects**: WAV files (xylophone, sparkle, bell harmonics)
- **Progress tracking**: Stars, completed tasks, story chapters — saved in localStorage
- **No backend, no registration**: Open and play instantly

## Tech Stack

- Vanilla HTML/CSS/JS (ES modules)
- No frameworks, no build tools, no dependencies
- Static hosting (GitHub Pages)

## Run Locally

```bash
python3 -m http.server 8000
```

Open http://localhost:8000

## Project Structure

```
index.html              Single HTML entry point
css/styles.css          Design system (CSS custom properties, animations)
js/
  app.js                Entry point, route registration
  router.js             Hash-based SPA router
  state.js              localStorage progress tracking
  engine.js             Game engine (loads JSON tasks, delegates to renderers)
  sounds.js             Sound effects (WAV audio pool, mobile unlock)
  speech.js             Speech: WAV playback + TTS fallback (Russian)
  screens/
    home.js             Home screen (age selection)
    mode.js             Mode selection (adventure / free play)
    topics.js           Topic grid (free mode)
    play.js             Game screen wrapper
    story.js            Story mode (map, dialogues, tasks)
  games/
    choice.js           Multiple choice renderer
    sequence.js         Order items by tapping
    dragdrop.js         Drag-and-drop with touch support
    match.js            Connect pairs
data/
  games.json            Topic catalog (icons, colors)
  story.json            Story chapters and dialogues
  levels/
    math.json           18 tasks
    literacy.json       10 tasks
    logic.json          8 tasks
    world.json          8 tasks
    attention.json      6 tasks
assets/
  sounds/               Sound effects (correct, wrong, click, star)
  speech/               Pre-recorded question audio (m1.wav, l1.wav, etc.)
```

## Adding Content

Add a new task by appending an object to any `data/levels/*.json` file:

```json
{
  "id": "m20",
  "type": "choice",
  "difficulty": 1,
  "question": "Сколько яблок?",
  "image": "🍎🍎🍎",
  "options": ["2", "3", "4"],
  "answer": "3"
}
```

Supported types: `choice`, `sequence`, `drag-drop`, `match`. No code changes needed.

To add voice-over for a new task, generate a WAV file named `{task-id}.wav` in `assets/speech/`. If no WAV file exists, the app falls back to Web Speech API.
