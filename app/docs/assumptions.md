# CFO calculator assumptions

- The calculator is a buyer explainer, not a legal settlement engine.
- Version 1 uses hourly intervals for clarity.
- Version 1 uses flat market price, flat retail tariff, flat DPPA charge, and flat loss coefficient controlled by sliders.
- Default factory retail tariff uses the weighted `22 kV to below 110 kV` example basis already carried into the source teaching deck's Zone 1 factory illustration: `1,833 VND/kWh`.
- Default strike price is set to `5% below` that weighted tariff basis for the developer contract: `1,741.35 VND/kWh`.
- The core educational insight is the cancellation effect between EVN market-linked charges and the CfD market reference.
- Settlement quantity mode is user-controlled so overgeneration risk can be demonstrated explicitly.
- The selected-hour story should compare `BAU without DPPA` versus `DPPA payment`, with cancellation formulas and Mermaid logic using the clicked hour's numbers.
