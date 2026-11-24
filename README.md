# Fretwork v2 – Guitar Learning System
Static web app. Run: `python3 -m http.server 8000` in this folder, open http://localhost:8000 (mic needs localhost/HTTPS).
Files: util.js (storage) · audio.js (mic, YIN, chroma) · chords.js (theory + voicings, single source of truth) · fretboard.js (SVG) · tuner.js · app.js (dashboard, library, analyzer, progress) · style.css.
Limits: microphone analysis hears notes, not fingers; noise, detuned strings, and muted strings affect results; seventh/extended chords use full shapes only (triad voicings are generated for 3-note chords).
