// PHASE-04 (plans/2026-09-05-gate-model-and-october-readiness-plan.md): the three-gate
// model as a tested engine module, imported by both app/scripts/export-sweep.mjs and the
// application. Implements ## Specification S1 of that plan.
//
// The lender/investor constants are illustrative proxies, not modelled debt schedules or
// equity IRR (settlement.js is buyer-side only) -- see item H3 in
// facilitator/october-run-plan.md. Replacing DSCR_TARGET, DEBT_SHARE and
// INVESTOR_LCOE_VND_PER_KWH with real Allotrope deal values is a three-line change.
export const DSCR_TARGET = 1.2
export const DEBT_SHARE = 0.75
export const INVESTOR_LCOE_VND_PER_KWH = 1450

// Bill-construction loss inputs shared with the sweep's year loop in
// app/scripts/export-sweep.mjs (kept here so the exporter holds no local copies).
export const LOSS_FACTOR_PRECISE = 1.026 * 1.008
export const LOSS_FACTOR_KPP_ONLY = 1.008

export function evaluateGates({
  strikeVndPerKwh,
  contractedKwhPerMonth,
  referenceLoadKwhPerMonth,
  fmpVndPerKwh,
  lifetimeDppaVnd,
  lifetimeBauVnd,
  dscrTarget = DSCR_TARGET,
  debtShare = DEBT_SHARE,
  investorLcoeVndPerKwh = INVESTOR_LCOE_VND_PER_KWH,
}) {
  const buyerPass = lifetimeDppaVnd <= lifetimeBauVnd
  const buyerHeadroomVnd = lifetimeBauVnd - lifetimeDppaVnd

  const annualDebtServiceVnd = referenceLoadKwhPerMonth * 12 * investorLcoeVndPerKwh * debtShare
  const requiredContractRevenueVnd = dscrTarget * annualDebtServiceVnd
  const annualContractRevenueVnd = contractedKwhPerMonth * 12 * strikeVndPerKwh
  const lenderPass = annualContractRevenueVnd >= requiredContractRevenueVnd
  const lenderHeadroomVnd = annualContractRevenueVnd - requiredContractRevenueVnd

  const contractedRevenue =
    Math.min(contractedKwhPerMonth, referenceLoadKwhPerMonth) * strikeVndPerKwh
  const spotRevenue = Math.max(referenceLoadKwhPerMonth - contractedKwhPerMonth, 0) * fmpVndPerKwh
  const blendedRevenuePerKwh =
    referenceLoadKwhPerMonth > 0 ? (contractedRevenue + spotRevenue) / referenceLoadKwhPerMonth : 0
  const investorPass = blendedRevenuePerKwh >= investorLcoeVndPerKwh
  const investorHeadroomVndPerKwh = blendedRevenuePerKwh - investorLcoeVndPerKwh

  const allPass = buyerPass && lenderPass && investorPass
  const failing = [
    ['buyer', buyerPass],
    ['lender', lenderPass],
    ['investor', investorPass],
  ].filter(([, pass]) => !pass)
  const bindingGate = failing.length === 1 ? failing[0][0] : null

  return {
    buyerPass,
    lenderPass,
    investorPass,
    allPass,
    bindingGate,
    annualContractRevenueVnd,
    annualDebtServiceVnd,
    requiredContractRevenueVnd,
    blendedRevenuePerKwh,
    lenderHeadroomVnd,
    investorHeadroomVndPerKwh,
    buyerHeadroomVnd,
  }
}
