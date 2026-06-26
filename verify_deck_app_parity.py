SCENARIOS = {
    "Workshop 1": {
        "constants": {"fmp": 1150, "strike": 1250, "service": 360, "clearing": 163.3, "retail": 2204},
        "volumes": {"contracted": 5_000_000, "total": 5_000_000},
        "expected": {
            "marketEnergy": 5_946_696_000,
            "systemService": 1_800_000_000,
            "diffClearing": 816_500_000,
            "additionalPurchase": 0,
            "cEvn": 8_563_196_000,
            "cfd": 500_000_000,
            "cKh": 9_063_196_000,
            "plantMarket": 5_796_000_000,
            "plantRevenue": 6_296_000_000,
        },
    },
    "Workshop 2": {
        "constants": {"fmp": 1600, "strike": 1500, "service": 360, "clearing": 163.3, "retail": 2204},
        "volumes": {"contracted": 8_000_000, "total": 9_000_000},
        "expected": {
            "marketEnergy": 13_237_862_400,
            "systemService": 2_880_000_000,
            "diffClearing": 1_306_400_000,
            "additionalPurchase": 2_204_000_000,
            "cEvn": 19_628_262_400,
            "cfd": -800_000_000,
            "cKh": 18_828_262_400,
            "plantMarket": 12_902_400_000,
            "plantRevenue": 12_102_400_000,
        },
    },
}

LOSS_FACTOR_PRECISE = 1.026 * 1.008
KPP_ONLY = 1.008


def build_bill(constants, volumes):
    contracted = volumes["contracted"]
    total = volumes["total"]
    shortfall = max(total - contracted, 0)
    market_energy = round(contracted * constants["fmp"] * LOSS_FACTOR_PRECISE)
    system_service = round(contracted * constants["service"])
    diff_clearing = round(contracted * constants["clearing"])
    additional_purchase = round(shortfall * constants["retail"])
    cfd = round(contracted * (constants["strike"] - constants["fmp"]))
    c_evn = market_energy + system_service + diff_clearing + additional_purchase
    plant_market = round(contracted * KPP_ONLY * constants["fmp"])
    return {
        "marketEnergy": market_energy,
        "systemService": system_service,
        "diffClearing": diff_clearing,
        "additionalPurchase": additional_purchase,
        "cEvn": c_evn,
        "cfd": cfd,
        "cKh": c_evn + cfd,
        "plantMarket": plant_market,
        "plantRevenue": plant_market + cfd,
    }


def main():
    failed = False
    for name, scenario in SCENARIOS.items():
        actual = build_bill(scenario["constants"], scenario["volumes"])
        for key, expected in scenario["expected"].items():
            status = "PASS" if actual[key] == expected else "FAIL"
            print(f"{status} {name} {key}: actual={actual[key]} expected={expected}")
            failed = failed or status == "FAIL"
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
