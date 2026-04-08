# Active Context

## Plan

- [x] Inspect current pricing and cancellation UI flow.
- [x] Confirm the spot-price cancellation presentation approach.
- [x] Add failing tests for selected-hour spot-price display and cancellation copy.
- [x] Update settlement breakdown data to expose explicit spot-price cancellation fields.
- [x] Update selected-hour and formula UI to show spot price, cancellation, and net effect in CFO-friendly language.
- [x] Run tests and verify the updated explanation flow locally.

## Review / Results

- Proposed direction: show spot market price explicitly as a visible line item, pair it with an equal-and-opposite developer swap cancellation term on aligned volume, and label the net retained cost as strike + DPPA charge + loss adjustment.
- Implemented the recommended approach: the selected-hour flow and cancellation panel now show the spot market reference explicitly, the cancellation via developer swap, and the resulting net retained energy slice.
- Added tests covering the new cancellation fields and UI copy.
- Verification passed with `npm test` and `npm run build`.
- Reproduced the mobile chart issue and found the canvas was rendering at about 150px tall in the narrow view.
- Updated responsive chart CSS so the canvas fills the container and the mobile chart keeps a 260px to 320px usable height.
- Verified the improved mobile chart visually with `mobile-chart-fixed-viewport.png`.
