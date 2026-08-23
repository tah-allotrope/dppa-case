# LIVE: NOTES.md-regenerable. Regenerate: PYTHONPATH= py build_teaching_visuals.py --lang en (also --lang vi|zh once translated)
"""PHASE-01 (Modules 1-6 teaching revamp): render every bespoke visual for the
rebuilt deck from assets/teaching/spine-s1.json — the S1 numbers exported by
app/scripts/export-spine.mjs, never hand-typed. Extends the build_cfd_slide.py
palette/style so the new visuals read as one system with the existing charts.

Run: PYTHONPATH= py build_teaching_visuals.py --lang en (also: vi, zh)

Outputs -> assets/teaching/:
  m1-tou-strip-{lang}.png
  m2-funnel-{lang}.png
  m2-sankey-{lang}-1..5.png + m2-sankey-build-{lang}.gif
  m3-seesaw-{lang}.png
  m4-three-doors-{lang}.png
  m5-gate-heatmap-{lang}.png
  cold-open-bill-pair-{lang}.png
  breadcrumb-strip-{lang}.png
"""
import argparse, io, json, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch
import numpy as np
from PIL import Image

TEAL = "#0097A7"; AMBER = "#FFAB40"; GREEN = "#2e9e6b"; MAGENTA = "#d6379a"; BLUE = "#4285F4"
INK = "#212121"; GRAY = "#595959"; RED = "#d64545"; LIGHT = "#F5F7F8"
plt.rcParams["font.family"] = ["Arial", "DejaVu Sans"]

FONT = {"en": "Arial", "vi": "Arial", "zh": "Microsoft YaHei"}

TEXTS = {
    "en": {
        "m1_title": "What you pay EVN today, hour by hour",
        "m1_off": "Off-peak", "m1_std": "Standard", "m1_peak": "Peak",
        "m1_load": "Song Hong Garment Co. — load",
        "m1_caption": "Your factory's voltage tier only. Full TOU matrix: handout.",
        "m2_funnel_title": "How much energy actually settles?",
        "m2_gen": "Solar generated", "m2_loss": "Grid losses (small leak)",
        "m2_load_gate": "Load gate: only what you consume", "m2_contract_gate": "Contract gate: only what you hedged",
        "m2_matched": "Matched / settled volume",
        "m2_sankey_title": "The five-line bill, one arrow at a time",
        "m2_lines": ["Market energy", "DPPA service fee", "Balancing fee", "Residual retail", "CfD settlement"],
        "m2_total": "Total bill (C_KH)",
        "m3_title": "A lock, not a discount",
        "m3_below": "Market price below strike\n-> you top up the developer",
        "m3_above": "Market price above strike\n-> developer pays you",
        "m3_caption": "The strike is a seesaw: whoever is below the line tops up whoever is above it.",
        "m4_title": "Three doors the deal must pass",
        "m4_buyer": "Buyer door", "m4_buyer_rule": "Cost <= doing nothing",
        "m4_lender": "Lender door", "m4_lender_rule": ">= 1.20x cover, every year",
        "m4_investor": "Investor door", "m4_investor_rule": "Equity return 12-15%",
        "m5_title": "{total} scenarios: how many pass all three doors?",
        "m5_xlabel": "Strike price scenarios", "m5_ylabel": "Contracted-volume scenarios",
        "m5_caption": "{n} of {total} pass every gate at once.",
        "cold_open_title": "Same factory, one month",
        "cold_open_bau": "Today (EVN retail only)", "cold_open_dppa": "With a DPPA",
        "cold_open_hook": "Where did the difference come from?\nYou will compute it yourself.",
        "breadcrumb_labels": ["1 Baseline", "2 The Bill", "3 The Lock", "4 Three Doors", "5 The Case", "6 Decide"],
    },
    "vi": {
        "m1_title": "Bạn trả EVN bao nhiêu hôm nay, theo từng giờ",
        "m1_off": "Thấp điểm", "m1_std": "Bình thường", "m1_peak": "Cao điểm",
        "m1_load": "Cty May Sông Hồng — phụ tải",
        "m1_caption": "Chỉ cấp điện áp của nhà máy bạn. Bảng giá đầy đủ: tài liệu phát tay.",
        "m2_funnel_title": "Bao nhiêu điện thực sự được thanh toán?",
        "m2_gen": "Điện mặt trời phát ra", "m2_loss": "Tổn thất lưới (rò rỉ nhỏ)",
        "m2_load_gate": "Cổng phụ tải: chỉ phần bạn tiêu thụ", "m2_contract_gate": "Cổng hợp đồng: chỉ phần đã ký",
        "m2_matched": "Sản lượng khớp / thanh toán",
        "m2_sankey_title": "Hóa đơn 5 dòng, từng mũi tên một",
        "m2_lines": ["Năng lượng thị trường", "Phí dịch vụ DPPA", "Phí cân bằng", "Mua bù thiếu hụt", "Thanh toán CfD"],
        "m2_total": "Tổng hóa đơn (C_KH)",
        "m3_title": "Khóa giá, không phải giảm giá",
        "m3_below": "Giá thị trường thấp hơn giá thực hiện\n-> bạn bù cho nhà phát triển",
        "m3_above": "Giá thị trường cao hơn giá thực hiện\n-> nhà phát triển trả bạn",
        "m3_caption": "Giá thực hiện là bập bênh: bên dưới bù cho bên trên.",
        "m4_title": "Ba cánh cửa giao dịch phải vượt qua",
        "m4_buyer": "Cửa người mua", "m4_buyer_rule": "Chi phí <= không làm gì",
        "m4_lender": "Cửa ngân hàng", "m4_lender_rule": ">= 1.20 lần, mỗi năm",
        "m4_investor": "Cửa nhà đầu tư", "m4_investor_rule": "Lợi nhuận vốn 12-15%",
        "m5_title": "{total} kịch bản: bao nhiêu vượt cả ba cửa?",
        "m5_xlabel": "Kịch bản giá thực hiện", "m5_ylabel": "Kịch bản sản lượng hợp đồng",
        "m5_caption": "{n}/{total} vượt qua tất cả các cửa cùng lúc.",
        "cold_open_title": "Cùng một nhà máy, một tháng",
        "cold_open_bau": "Hôm nay (chỉ giá bán lẻ EVN)", "cold_open_dppa": "Với DPPA",
        "cold_open_hook": "Khác biệt đến từ đâu?\nBạn sẽ tự tính.",
        "breadcrumb_labels": ["1 Nền giá", "2 Hóa đơn", "3 Khóa giá", "4 Ba cửa", "5 Tình huống", "6 Quyết định"],
    },
    "zh": {
        "m1_title": "今天您向EVN支付多少,按小时计",
        "m1_off": "谷时段", "m1_std": "平时段", "m1_peak": "峰时段",
        "m1_load": "红河制衣公司 — 负荷",
        "m1_caption": "仅显示您工厂的电压等级。完整费率表见讲义。",
        "m2_funnel_title": "实际结算多少电量?",
        "m2_gen": "光伏发电量", "m2_loss": "电网损耗(小幅泄漏)",
        "m2_load_gate": "负荷闸门:只计您消耗的部分", "m2_contract_gate": "合同闸门:只计您签约的部分",
        "m2_matched": "匹配/结算电量",
        "m2_sankey_title": "五行账单,逐箭头呈现",
        "m2_lines": ["市场电价", "DPPA服务费", "平衡费", "剩余零售购电", "CfD差价结算"],
        "m2_total": "账单总额 (C_KH)",
        "m3_title": "锁价,而非折扣",
        "m3_below": "市场价低于执行价\n-> 您向开发商补差价",
        "m3_above": "市场价高于执行价\n-> 开发商向您支付差价",
        "m3_caption": "执行价是跷跷板:低于线的一方向高于线的一方补差价。",
        "m4_title": "交易必须通过的三道门",
        "m4_buyer": "买方之门", "m4_buyer_rule": "成本 <= 维持现状",
        "m4_lender": "银行之门", "m4_lender_rule": "每年 >= 1.20倍覆盖率",
        "m4_investor": "投资人之门", "m4_investor_rule": "股本回报 12-15%",
        "m5_title": "{total}种情景:有多少能通过全部三道门?",
        "m5_xlabel": "执行价情景", "m5_ylabel": "合同电量情景",
        "m5_caption": "{total}种情景中{n}种能同时通过所有门槛。",
        "cold_open_title": "同一家工厂,同一个月",
        "cold_open_bau": "今天(仅EVN零售价)", "cold_open_dppa": "采用DPPA后",
        "cold_open_hook": "差额从何而来?\n您将亲自计算。",
        "breadcrumb_labels": ["1 基准价", "2 账单", "3 锁价", "4 三道门", "5 案例", "6 决策"],
    },
}

OUT_DIR = os.path.join("assets", "teaching")


def load_spine():
    with open(os.path.join(OUT_DIR, "spine-s1.json"), encoding="utf-8") as f:
        return json.load(f)


def load_sweep():
    with open(os.path.join(OUT_DIR, "gate-sweep.json"), encoding="utf-8") as f:
        return json.load(f)


def savefig(fig, name, lang):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, f"{name}-{lang}.png")
    fig.savefig(path, dpi=200, facecolor="white", bbox_inches="tight")
    plt.close(fig)
    print("PNG:", path, os.path.getsize(path), "bytes")
    return path


# ---------- M1: 24h TOU price strip ----------
def render_m1_tou_strip(lang):
    t = TEXTS[lang]
    hours = list(range(24))
    load = [3200,3200,3200,3200,3200,3400,3800,4200,4500,4700,4700,4700,4700,4700,4700,4600,4300,4000,3800,3600,3400,3300,3200,3200]
    bands = [(0, 6, "off", "#47d7ff", 0.18), (6, 17.5, "std", "#ffd84f", 0.22), (17.5, 22.5, "peak", "#ff68d8", 0.18), (22.5, 24, "std", "#ffd84f", 0.22)]
    labels = {"off": t["m1_off"], "std": t["m1_std"], "peak": t["m1_peak"]}

    fig, ax = plt.subplots(figsize=(11, 5), dpi=200)
    fig.patch.set_facecolor("white"); ax.set_facecolor("white")
    top = 5100
    for s, e, key, color, a in bands:
        ax.axvspan(s - 0.5, e - 0.5, color=color, alpha=a, zorder=0, lw=0)
        ax.text((s + e) / 2 - 0.5, top - 150, labels[key], ha="center", va="top", fontsize=11,
                 color=INK, fontweight="bold", fontfamily=FONT[lang])
    ax.fill_between(hours, load, color=TEAL, alpha=0.15, zorder=1)
    ax.plot(hours, load, color=TEAL, lw=3.2, label=t["m1_load"], zorder=2)
    ax.set_ylim(0, top); ax.set_xlim(-0.5, 23.5)
    ax.set_xticks(range(0, 24, 2)); ax.set_xticklabels([f"{h:02d}" for h in range(0, 24, 2)], color=GRAY, fontsize=11)
    ax.set_ylabel("kWh / h", color=GRAY, fontsize=12)
    ax.tick_params(axis="y", colors=GRAY, labelsize=11)
    for sp in ax.spines.values(): sp.set_color("#E0E0E0")
    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.1), frameon=False, fontsize=11, prop={"family": FONT[lang]})
    fig.suptitle(t["m1_title"], x=0.5, y=0.99, fontsize=17, fontweight="bold", color="#00727e", fontfamily=FONT[lang])
    ax.set_title(t["m1_caption"], fontsize=10, color=GRAY, pad=8, fontfamily=FONT[lang])
    return savefig(fig, "m1-tou-strip", lang)


# ---------- M2: volume funnel ----------
def render_m2_funnel(lang, spine):
    t = TEXTS[lang]
    gen = spine["factory"]["monthlyLoadKwh"] * 1.30
    after_loss = gen * 0.99
    after_load_gate = spine["inputs"]["totalConsumptionKwh"]
    after_contract_gate = spine["inputs"]["contractedKwh"]

    fig, ax = plt.subplots(figsize=(9, 6), dpi=200)
    fig.patch.set_facecolor("white"); ax.set_facecolor("white")
    ax.axis("off")
    stages = [
        (gen, t["m2_gen"], AMBER),
        (after_loss, t["m2_loss"], "#ffcf7a"),
        (after_load_gate, t["m2_load_gate"], TEAL),
        (after_contract_gate, t["m2_matched"], GREEN),
    ]
    max_w = 8.0
    y = 5.2
    for i, (value, label, color) in enumerate(stages):
        w = max_w * (value / gen)
        x0 = (9 - w) / 2
        ax.add_patch(mpatches.FancyBboxPatch((x0, y), w, 0.9, boxstyle="round,pad=0.02,rounding_size=0.08",
                                              linewidth=0, facecolor=color, alpha=0.85))
        ax.text(4.5, y + 0.45, f"{label}\n{value/1e6:.2f}M kWh", ha="center", va="center",
                fontsize=11.5, color="white" if color != AMBER else INK, fontweight="bold", fontfamily=FONT[lang])
        if i < len(stages) - 1:
            ax.annotate("", xy=(4.5, y - 0.35), xytext=(4.5, y),
                        arrowprops=dict(arrowstyle="-|>", color=GRAY, lw=2))
        y -= 1.5
    ax.set_xlim(0, 9); ax.set_ylim(0.5, 6.3)
    fig.suptitle(t["m2_funnel_title"], x=0.5, y=0.98, fontsize=16, fontweight="bold", color="#00727e", fontfamily=FONT[lang])
    return savefig(fig, "m2-funnel", lang)


# ---------- M2: Sankey-style bill build (5 staged frames + GIF) ----------
def render_m2_sankey(lang, spine):
    t = TEXTS[lang]
    lines = spine["bill"]["lines"]
    values = [lines["marketEnergy"]["vndMillionsRounded"], lines["systemService"]["vndMillionsRounded"],
              lines["diffClearing"]["vndMillionsRounded"], lines["additionalPurchase"]["vndMillionsRounded"],
              lines["cfd"]["vndMillionsRounded"]]
    names = t["m2_lines"]
    colors = [TEAL, AMBER, "#8e6fd8", GRAY, MAGENTA]
    total = spine["bill"]["cKh"]["vndMillionsRounded"]

    frames = []
    for stage in range(1, 6):
        fig, ax = plt.subplots(figsize=(13, 6.2), dpi=150)
        fig.patch.set_facecolor("white"); ax.set_facecolor("white")
        ax.axis("off")
        ax.set_xlim(0, 14); ax.set_ylim(0, 7)
        # source node
        ax.add_patch(mpatches.FancyBboxPatch((0.3, 3.0), 1.8, 1.0, boxstyle="round,pad=0.02", facecolor=TEAL, alpha=0.9))
        ax.text(1.2, 3.5, t["m2_lines"][0].split()[0] if False else "S1", ha="center", va="center", color="white", fontweight="bold")
        y_positions = [6.0, 4.9, 3.8, 2.7, 1.6]
        running = 0
        for i in range(5):
            active = i < stage
            y = y_positions[i]
            alpha = 1.0 if active else 0.12
            ax.annotate("", xy=(7.0, y), xytext=(2.1, 3.5),
                        arrowprops=dict(arrowstyle="-|>", color=colors[i], lw=3.5, alpha=alpha,
                                        connectionstyle=f"arc3,rad={(y-3.5)/10}"))
            label = f"{names[i]}: {values[i]:,} tr VND" if active else ""
            if active:
                ax.text(7.3, y, label, ha="left", va="center", fontsize=12, color=INK, fontweight="bold", fontfamily=FONT[lang])
                running += values[i]
        ax.add_patch(mpatches.FancyBboxPatch((11.7, 3.0), 2.0, 1.0, boxstyle="round,pad=0.02",
                                              facecolor="#212121" if stage == 5 else "#B0BEC5", alpha=0.9))
        total_label = f"{running:,}" if stage < 5 else f"{total:,}"
        ax.text(12.7, 3.5, f"{total_label}\ntr VND", ha="center", va="center", color="white", fontsize=11, fontweight="bold")
        fig.suptitle(t["m2_sankey_title"], x=0.5, y=0.98, fontsize=16, fontweight="bold", color="#00727e", fontfamily=FONT[lang])
        if stage == 5:
            ax.text(6, 0.3, t["m2_total"], ha="center", fontsize=11, color=GRAY, fontfamily=FONT[lang])
        path = os.path.join(OUT_DIR, f"m2-sankey-{lang}-{stage}.png")
        os.makedirs(OUT_DIR, exist_ok=True)
        fig.savefig(path, dpi=150, facecolor="white")
        plt.close(fig)
        frames.append(Image.open(path).convert("RGB"))
        print("PNG:", path, os.path.getsize(path), "bytes")

    gif_path = os.path.join(OUT_DIR, f"m2-sankey-build-{lang}.gif")
    durations = [1200, 1200, 1200, 1200, 2200]
    frames[0].save(gif_path, save_all=True, append_images=frames[1:], duration=durations, loop=0, optimize=True)
    print("GIF:", gif_path, os.path.getsize(gif_path), "bytes")


# ---------- M3: CfD seesaw ----------
def render_m3_seesaw(lang, spine):
    t = TEXTS[lang]
    fig, ax = plt.subplots(figsize=(9, 5.5), dpi=200)
    fig.patch.set_facecolor("white"); ax.set_facecolor("white")
    ax.axis("off"); ax.set_xlim(0, 10); ax.set_ylim(0, 6)
    ax.add_patch(mpatches.Polygon([[4.7, 0.6], [5.3, 0.6], [5.5, 1.6], [4.5, 1.6]], closed=True, facecolor=GRAY))
    # tilted beam: FMP below strike -> factory (left) is "up" paying down to developer
    beam_angle_deg = 8
    ax.add_patch(mpatches.FancyBboxPatch((1.0, 1.55), 8.0, 0.28, boxstyle="round,pad=0.0",
                                          facecolor=BLUE, alpha=0.85,
                                          transform=ax.transData))
    t2 = matplotlib.transforms.Affine2D().rotate_deg_around(5, 1.7, beam_angle_deg) + ax.transData
    ax.patches[-1].set_transform(t2)
    # left pan (factory) - lower side (goes down when FMP<strike, meaning factory tops up)
    ax.add_patch(mpatches.Circle((1.6, 2.55), 0.75, facecolor=TEAL, alpha=0.9))
    ax.text(1.6, 2.55, "Factory", ha="center", va="center", color="white", fontweight="bold", fontsize=11, fontfamily=FONT[lang])
    ax.add_patch(mpatches.Circle((8.4, 1.05), 0.75, facecolor=AMBER, alpha=0.9))
    ax.text(8.4, 1.05, "Developer", ha="center", va="center", color=INK, fontweight="bold", fontsize=11, fontfamily=FONT[lang])
    ax.annotate("", xy=(8.4, 1.85), xytext=(1.6, 3.35), arrowprops=dict(arrowstyle="-|>", color=RED, lw=2.5, alpha=0.8,
                connectionstyle="arc3,rad=-0.25"))
    ax.text(5, 4.4, t["m3_below"], ha="center", va="center", fontsize=12.5, color=INK, fontweight="bold", fontfamily=FONT[lang])
    fig.suptitle(t["m3_title"], x=0.5, y=0.98, fontsize=17, fontweight="bold", color="#00727e", fontfamily=FONT[lang])
    ax.text(5, 0.15, t["m3_caption"], ha="center", fontsize=10, color=GRAY, fontfamily=FONT[lang])
    return savefig(fig, "m3-seesaw", lang)


# ---------- M4: three doors ----------
def render_m4_three_doors(lang, spine):
    t = TEXTS[lang]
    doors = [
        (t["m4_buyer"], t["m4_buyer_rule"], TEAL),
        (t["m4_lender"], t["m4_lender_rule"], AMBER),
        (t["m4_investor"], t["m4_investor_rule"], MAGENTA),
    ]
    fig, ax = plt.subplots(figsize=(10.5, 5.5), dpi=200)
    fig.patch.set_facecolor("white"); ax.set_facecolor("white")
    ax.axis("off"); ax.set_xlim(0, 12); ax.set_ylim(0, 6)
    for i, (name, rule, color) in enumerate(doors):
        x0 = 0.8 + i * 3.8
        ax.add_patch(mpatches.FancyBboxPatch((x0, 0.8), 3.0, 4.2, boxstyle="round,pad=0.05,rounding_size=0.15",
                                              facecolor=color, alpha=0.15, edgecolor=color, linewidth=3))
        ax.add_patch(mpatches.Circle((x0 + 2.6, 3.0), 0.12, facecolor=color))
        ax.text(x0 + 1.5, 4.4, name, ha="center", fontsize=14, fontweight="bold", color=color, fontfamily=FONT[lang])
        ax.text(x0 + 1.5, 2.6, rule, ha="center", va="center", fontsize=12, color=INK, wrap=True, fontfamily=FONT[lang])
    fig.suptitle(t["m4_title"], x=0.5, y=0.98, fontsize=17, fontweight="bold", color="#00727e", fontfamily=FONT[lang])
    return savefig(fig, "m4-three-doors", lang)


# ---------- M5: gate heatmap (grid size from gate-sweep.json, not hard-coded) ----------
def render_m5_heatmap(lang, spine, sweep):
    from matplotlib.colors import LinearSegmentedColormap

    t = TEXTS[lang]
    strikes = sweep["strikes"]  # ascending -> x-axis (m5_xlabel = strike scenarios)
    ratios = sweep["ratios"]  # ascending -> y-axis (m5_ylabel = contracted-volume scenarios)
    pass_count = sweep["passCount"]
    cell_count = len(sweep["cells"])

    # grid[ratio_idx][strike_idx] = number of gates passed (0-3); row 0 =
    # lowest ratio so origin="lower" reads volume ratios ascending bottom-to-top,
    # matching the x=strike / y=contracted-volume axis labels below.
    grid = np.zeros((len(ratios), len(strikes)))
    by_key = {(c["strike"], c["ratio"]): c for c in sweep["cells"]}
    for i, ratio in enumerate(ratios):
        for j, strike in enumerate(strikes):
            cell = by_key[(strike, ratio)]
            grid[i, j] = int(cell["buyerPass"]) + int(cell["lenderPass"]) + int(cell["investorPass"])

    cmap = LinearSegmentedColormap.from_list("gate_pass", ["#FDE0DC", "#0097A7"])
    fig, ax = plt.subplots(figsize=(9, 6), dpi=200)
    fig.patch.set_facecolor("white"); ax.set_facecolor("white")
    ax.imshow(grid, cmap=cmap, vmin=0, vmax=3, aspect="auto", origin="lower")
    ax.set_xlabel(t["m5_xlabel"], fontsize=12, color=GRAY, fontfamily=FONT[lang])
    ax.set_ylabel(t["m5_ylabel"], fontsize=12, color=GRAY, fontfamily=FONT[lang])
    ax.set_xticks(range(len(strikes)))
    ax.set_xticklabels([f"{s:,}" for s in strikes], fontsize=8, color=GRAY, rotation=45, ha="right")
    ax.set_yticks(range(len(ratios)))
    ax.set_yticklabels([f"{round(r * 100)}%" for r in ratios], fontsize=8, color=GRAY)
    for spine_ in ax.spines.values(): spine_.set_color("#E0E0E0")
    ax.text(
        (len(strikes) - 1) / 2, (len(ratios) - 1) / 2, f"{pass_count} / {cell_count}",
        ha="center", va="center", fontsize=36, fontweight="bold", color=INK,
        bbox=dict(facecolor="white", alpha=0.85, edgecolor="none", boxstyle="round,pad=0.4"),
    )
    fig.suptitle(t["m5_title"].format(total=cell_count), x=0.5, y=0.98, fontsize=16, fontweight="bold", color="#00727e", fontfamily=FONT[lang])
    ax.set_title(t["m5_caption"].format(n=pass_count, total=cell_count), fontsize=10.5, color=GRAY, pad=8, fontfamily=FONT[lang])
    return savefig(fig, "m5-gate-heatmap", lang)


# ---------- Cold open: BAU vs DPPA bill pair ----------
def render_cold_open(lang, spine):
    t = TEXTS[lang]
    bau = spine["comparison"]["bauMonthlyVndMillionsRounded"]
    dppa = spine["comparison"]["dppaMonthlyVndMillionsRounded"]
    fig, ax = plt.subplots(figsize=(9, 6), dpi=200)
    fig.patch.set_facecolor("white"); ax.set_facecolor("white")
    bars = ax.bar([t["cold_open_bau"], t["cold_open_dppa"]], [bau, dppa], color=[GRAY, TEAL], width=0.5)
    for b, v in zip(bars, [bau, dppa]):
        ax.text(b.get_x() + b.get_width() / 2, v + 150, f"{v:,} tr VND", ha="center", fontsize=13, fontweight="bold", color=INK, fontfamily=FONT[lang])
    ax.set_ylim(0, max(bau, dppa) * 1.25)
    ax.tick_params(axis="x", labelsize=13, colors=INK)
    ax.tick_params(axis="y", colors=GRAY)
    ax.set_ylabel("VND millions / month", color=GRAY)
    for sp in ["top", "right"]: ax.spines[sp].set_visible(False)
    fig.suptitle(t["cold_open_title"], x=0.5, y=0.99, fontsize=17, fontweight="bold", color="#00727e", fontfamily=FONT[lang])
    ax.set_title(t["cold_open_hook"], fontsize=11.5, color=GRAY, pad=10, fontfamily=FONT[lang])
    return savefig(fig, "cold-open-bill-pair", lang)


# ---------- Breadcrumb strip (6 module icons) ----------
def render_breadcrumb(lang):
    t = TEXTS[lang]
    labels = t["breadcrumb_labels"]
    for active in range(0, 7):  # 0 = full strip (no highlight), 1..6 = "you are here"
        fig, ax = plt.subplots(figsize=(11, 1.4), dpi=200)
        fig.patch.set_facecolor("white"); ax.set_facecolor("white")
        ax.axis("off"); ax.set_xlim(0, 12); ax.set_ylim(0, 1.6)
        for i, label in enumerate(labels):
            x = 0.6 + i * 1.85
            is_active = (active == i + 1)
            color = TEAL if is_active else "#CFD8DC"
            textcolor = "white" if is_active else GRAY
            ax.add_patch(mpatches.FancyBboxPatch((x, 0.3), 1.6, 0.8, boxstyle="round,pad=0.02,rounding_size=0.15",
                                                  facecolor=color))
            ax.text(x + 0.8, 0.7, label, ha="center", va="center", fontsize=9.5,
                    color=textcolor, fontweight="bold", fontfamily=FONT[lang])
        suffix = "" if active == 0 else f"-m{active}"
        path = os.path.join(OUT_DIR, f"breadcrumb-strip{suffix}-{lang}.png")
        os.makedirs(OUT_DIR, exist_ok=True)
        fig.savefig(path, dpi=200, facecolor="white", bbox_inches="tight")
        plt.close(fig)
        print("PNG:", path, os.path.getsize(path), "bytes")


APP_URL = "https://dppa-case.web.app"


def render_qr(lang):
    import qrcode

    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, f"qr-app-{lang}.png")
    img = qrcode.make(APP_URL, border=2)
    img = img.resize((400, 400))
    img.save(path)
    print("PNG:", path, os.path.getsize(path), "bytes")
    return path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", default="en", choices=["en", "vi", "zh"])
    args = parser.parse_args()
    spine = load_spine()
    sweep = load_sweep()
    render_m1_tou_strip(args.lang)
    render_m2_funnel(args.lang, spine)
    render_m2_sankey(args.lang, spine)
    render_m3_seesaw(args.lang, spine)
    render_m4_three_doors(args.lang, spine)
    render_m5_heatmap(args.lang, spine, sweep)
    render_qr(args.lang)
    render_cold_open(args.lang, spine)
    render_breadcrumb(args.lang)


if __name__ == "__main__":
    main()
