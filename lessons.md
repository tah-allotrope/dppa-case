# Lessons

## 2026-06-29

- Before grounding any analysis on "what files exist" in a folder, **re-list the target directory immediately**, especially when the user names a specific file or when the folder was last inspected in an earlier task/turn. Mid-session additions are invisible to a stale listing — I concluded `ceba/` had "no panel questions, only scenario prompts" because `ceba/CEBA 2026_Panel Questions.md` was added after my first `ls`. Rule: a brainstorm/plan whose subject is "the X in folder Y" must open with a fresh `ls`/glob of Y and read every plausibly-relevant file (all extensions, not just `.pptx`) before framing.
- When grounding on documents, do not infer a file's absence from a single earlier directory snapshot; a `find -iname "*keyword*"` across the repo is cheap insurance before asserting "no such file/section exists."

## 2026-04-07

- For CFO-facing DPPA demos, prioritize the main visual narrative over dashboard density: keep the top header compact, keep the load-vs-generation chart dominant, move secondary controls lower, and make point-in-time payment explanation visual rather than text-heavy.
- For the selected-hour CFO story, prefer BAU-versus-DPPA comparison, explicit formulas, and visual cancellation diagrams; keep the whole presentation visible in one screen without an elongated chart pushing key explanation panels below the fold.
- For factory-specific DPPA views, anchor the retail assumption to the weighted 22 kV to below 110 kV tariff basis, set the default strike at 5% below that basis, and present selected-hour economics as `BAU without DPPA` versus `DPPA payment` rather than generic totals.
- For cancellation-effect panels, show the actual selected-hour numbers inside both the formula cards and the Mermaid diagram so the visual story matches the clicked graph node exactly.
- When a user asks for something to be overlaid on a graph, place it within the chart plotting container as a true visual overlay, not merely inside the same panel above or below the chart.
- For CFO-facing cancellation math, avoid long raw inline equations inside narrow cards; use compact wrapped term chips with strong visual differentiation for cancelled vs retained terms so desktop stays clean and mobile never overlaps.
