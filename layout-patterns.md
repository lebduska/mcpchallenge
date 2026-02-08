# MCP Challenge – Layout Patterns

All challenges follow the same spatial logic.
Only the world changes.

---

## 🧩 Core layout structure

┌───────────────────────────────┐
│ Header (light, minimal)       │
│ Level · State · Iteration     │
└───────────────────────────────┘

┌───────────────┬───────────────┐
│               │               │
│               │               │
│   WORLD       │   CONTROL     │
│   (Hero)      │   RAIL        │
│               │               │
│               │               │
└───────────────┴───────────────┘

(Optional)
┌───────────────────────────────┐
│ History / Replay / Insights   │
└───────────────────────────────┘

---

## 🌍 World (Hero Area)

Purpose:
The simulation, board, or canvas where everything happens.

Rules:
- Always largest visual element
- Centered or left-weighted
- No UI clutter inside unless informational overlays
- Progress and state overlays allowed (subtle)

Examples:
• Chess board
• Physics scene
• Drawing canvas
• Sokoban grid

---

## 🎛 Control Rail

Purpose:
Experimental tools to manipulate the system.

Rules:
- Vertical or floating card
- Calm surface (no dark heavy panels)
- Minimal labels

Prefer:
• sliders
• knobs
• toggles
• soft buttons

Avoid:
• long forms
• dense lists
• parameter tables

---

## 📊 Header Bar

Purpose:
Light orientation only.

Show:
• level / scenario
• current state (running, waiting, complete)
• iteration count (optional)

Avoid:
• scoreboards
• big CTAs
• configuration blocks

---

## 📜 History / Replay (Optional)

Purpose:
Learning and reflection.

Can show:
• attempts
• trajectories
• past moves
• diffs

Hidden by default or collapsed when not used.

---

## ✅ Layout consistency test

If you switch Chess → Sokoban → Physics → Canvas:

The structure should feel identical.
Only the world content changes.

If layout feels different → refactor to match this pattern.
