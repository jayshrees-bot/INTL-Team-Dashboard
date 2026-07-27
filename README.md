# International Team — CQ Dashboard (July 2026)

A static, single-page CQ (Call/Chat Quality) audit dashboard for the International team, built from the raw audit sheet exported for July 2026 (auditor: Jayshree).

## What's in here
- `index.html` — the dashboard page (structure + styling, light/dark mode, all sections)
- `data.js` — **the only file you need to touch monthly.** Every agent's scores, error counts, AOIs, and case-level comments live here as one `AGENTS` object.
- `charts.js` — builds the 3 Chart.js charts + the error heatmap, all read live from `AGENTS` in `data.js`
- `modal.js` — builds the per-agent detail modal (click any agent row or parameter row to open it)

## How the numbers were built
Rows were filtered from the raw audit export to `Audit Start Time` in July 2026 (72 rows / 9 agents), matching your pivot exactly: 72 audits, 5 NCF, 77% average CQ. For each agent:
- **CQ score** = average of that agent's `CQ Score` column for the month
- **Errors per parameter** (Soft Skills, Call/Chat Etiquette, Probing, Solution & Recommendation, Follow Up, Tagging) = count of audits where that parameter wasn't rated "Good Job" or "Not Applicable"
- **Case comments** = the auditor's `comments` field, combined with any specific flagged-reason notes from that row (e.g. "Failed to portray Empathy" → its attached note)
- **AOIs** = auto-summarized per parameter from the flagged reason notes for that agent

## Publishing to GitHub Pages
1. Create a new repo (e.g. `international-cq-dashboard`) and upload these 4 files (plus `logo_icon.png` / `logo_full.png` if you have your CaratLane logo files — they're referenced but optional, the page just hides them if missing).
2. In repo Settings → Pages, set source to the `main` branch, root folder.
3. Your dashboard will be live at `https://<your-username>.github.io/international-cq-dashboard/`.

## Updating next month
Only `data.js` needs new numbers — re-run whatever extraction you used (or just tell me and share the new raw sheet, and I'll regenerate it). The hero stats, score table, insights, and parameter breakdown in `index.html` are currently hand-baked from this month's numbers, so if you want those to also update automatically without me regenerating the HTML each time, let me know — I can make `index.html` pull from `data.js` at load time instead.
