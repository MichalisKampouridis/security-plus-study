# Security+ SY0-701 Study App

A personal, offline-first study app for the CompTIA Security+ SY0-701 exam.
Built with plain HTML, CSS, and JavaScript — no framework, no build step,
no account required. All progress data stays in your browser.

## Features

- **Daily Practice Tests** — 25 questions weighted by official domain percentages
  (12 / 22 / 18 / 28 / 20%)
- **167 Original Questions** covering every objective from 1.1 to 5.6
- **6 Question Formats** — Multiple choice, multi-select, true/false,
  fill-in-the-blank, matching, and performance-based scenario (PBQ)
- **Instant Scoring** — Pass/fail at the real 83% threshold with per-domain breakdown
- **Missed Question Review** — Full explanations and CompTIA logic notes
- **Progress Dashboard** — Streak counter, score history chart, domain mastery table,
  weakest objectives, session history
- **Drill Mode** — Filter by domain, objective, difficulty, and format
- **Study Tips Engine** — Actionable tips computed from your session results

## Requirements

- **Python 3** — https://www.python.org/ (for the local server)
- **Any modern browser** — Chrome, Firefox, Safari, or Edge

No npm. No Node.js. No installation beyond Python.

## Quick Start

### macOS

```bash
git clone https://github.com/MichalisKampouridis/security-plus-study.git
cd security-plus-study
```

Double-click **run.command** in Finder.

> If macOS blocks it: right-click → Open → Open anyway (one-time prompt).

The app opens automatically at http://localhost:8080

### Windows
git clone https://github.com/MichalisKampouridis/security-plus-study.git

cd security-plus-study

Double-click **run.bat**.

> If Windows Defender SmartScreen appears: click More info → Run anyway.

Open your browser to http://localhost:8080

### Manual launch (any platform)

```bash
cd security-plus-study
python3 -m http.server 8080    # macOS / Linux
python -m http.server 8080     # Windows
```

### GitHub Pages

After Phase 7 CI/CD setup, the app will also be live at:
https://MichalisKampouridis.github.io/security-plus-study/

> GitHub Pages uses its own localStorage — progress is separate from your
> local instance.

## How to Study

1. **Take Test** — fresh 25-question weighted test every time.
2. Answer each question — explanation appears immediately after each one.
3. Review score, per-domain breakdown, and every missed question at the end.
4. Read the **Study Tips** tailored to your session results.
5. **Drill Mode** — target a weak domain, specific objective, or format type.
6. **Progress** — track streak, score trend, domain mastery, and focus areas.

## Project Structure
security-plus-study/

├── index.html                  # App shell (single-page app)

├── css/

│   └── style.css               # All styling

├── js/

│   └── app.js                  # All app logic (vanilla JS, no dependencies)

├── data/

│   ├── questions-1.json        # Domain 1 — General Security Concepts (21 Qs)

│   ├── questions-2.json        # Domain 2 — Threats, Vulnerabilities (36 Qs)

│   ├── questions-3.json        # Domain 3 — Security Architecture (30 Qs)

│   ├── questions-4.json        # Domain 4 — Security Operations (48 Qs)

│   └── questions-5.json        # Domain 5 — Program Management (32 Qs)

├── SY0-701-blueprint.md        # Source of truth: objectives, schema, acronyms

├── run.command                 # macOS launcher (double-click)

└── run.bat                     # Windows launcher (double-click)

## Adding Questions

1. Open the relevant `data/questions-N.json`.
2. Append a new question object using the schema in `SY0-701-blueprint.md`.
3. Assign a unique `id` continuing the existing sequence (e.g. `D1-022`).
4. Save — changes take effect on next browser reload.

All six format variants (fill_blank, matching, pbq_scenario, etc.) are documented
in **SY0-701-blueprint.md**.

## Data & Privacy

All progress (scores, streak, missed questions) is stored in your browser's
`localStorage`. Nothing is sent to any server. To reset, use the
**Reset Progress** button in the Progress view.

## Disclaimer

All questions are original content written from the official CompTIA SY0-701
exam objectives. This app is not affiliated with or endorsed by CompTIA.
Do not use brain dumps or copied exam questions — CompTIA can revoke
certifications for this.

---

*Good luck on the exam! 🔐*
