"""Render the consolidated CfD chart with the web-app TOU overlay, as:
  - a static high-res PNG (assets/cfd-consolidated-chart.png)
  - an animated GIF that sweeps hour-by-hour, highlighting each hour's data
    points with a value callout (assets/cfd-consolidated-chart.gif) — plays in
    Google Slides / PowerPoint present mode, mimicking the interactive chart
  - a 16:9 slide .pptx with the static PNG (ceba/DPPA CfD Consolidated Chart.pptx)
Run with the `py` launcher (matplotlib 3.10, Pillow 12, python-pptx 1.0)."""
import io, os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from PIL import Image

# ---- deck palette ----
TEAL="#0097A7"; AMBER="#FFAB40"; GREEN="#2e9e6b"; MAGENTA="#d6379a"; BLUE="#4285F4"
INK="#212121"; GRAY="#595959"
plt.rcParams["font.family"] = ["Arial","DejaVu Sans"]

hours = list(range(24))
load    = [3000,3000,3000,3000,3000,3000,4000,4000,4000,4700,4700,4700,4700,4700,4700,4700,3900,3900,3900,3900,3200,3200,3200,3200]
solar   = [0,0,0,0,0,0,0,833,1935,2999,3887,4493,4700,4493,3887,2999,1935,833,0,0,0,0,0,0]
matched = [min(a,b) for a,b in zip(load,solar)]
fmp     = [1190,1173,1156,1173,1224,1326,1428,1496,1564,1649,1700,1768,1836,1887,1955,2006,2074,2176,2312,2414,2210,1836,1564,1360]
STRIKE  = 2000

# ---- web-app TOU bands: (start, end, label, fill, labelcolor) ----
OFF=("#47d7ff",0.10,"#1f8fb0"); STD=("#ffd84f",0.13,"#b08900"); PK=("#ff68d8",0.10,"#c0379a")
BANDS=[(0,4,"Off-peak",OFF),(4,9,"Standard",STD),(9,11,"Peak",PK),
       (11,17,"Standard",STD),(17,20,"Peak",PK),(20,22,"Standard",STD),(22,24,"Off-peak",OFF)]

def draw_base(axL):
    axR = axL.twinx()
    # TOU overlay (behind everything)
    for s,e,name,(fill,a,lc) in BANDS:
        axL.axvspan(s-0.5, e-0.5, color=fill, alpha=a, zorder=0, lw=0)
        axL.text((s+e)/2-0.5, 5080, name, ha="center", va="top", fontsize=9.5,
                 color=lc, fontweight="bold", zorder=1)
    # left axis (kWh/h)
    axL.fill_between(hours, load,  color=TEAL,  alpha=0.10, zorder=1)
    axL.plot(hours, load,  color=TEAL,  lw=3.0, label="Factory load", zorder=2)
    axL.plot(hours, solar, color=AMBER, lw=3.0, label="Solar generation", zorder=2)
    axL.fill_between(hours, matched, color=GREEN, alpha=0.30, zorder=1)
    axL.plot(hours, matched, color=GREEN, lw=2.0, label="Matched volume", zorder=2)
    axL.set_ylim(0, 5300); axL.set_xlim(-0.5, 23.5)
    axL.set_ylabel("kWh / h", color=GRAY, fontsize=13)
    axL.set_xticks(range(0,24,2)); axL.set_xticklabels([f"{h:02d}" for h in range(0,24,2)], color=GRAY, fontsize=11)
    axL.tick_params(axis="y", colors=GRAY, labelsize=11)
    axL.grid(True, axis="y", color="#000000", alpha=0.05, zorder=0)
    for sp in axL.spines.values(): sp.set_color("#E0E0E0")
    # right axis (VND/kWh)
    axR.plot(hours, fmp, color=MAGENTA, lw=3.0, ls=(0,(7,4)), label="FMP (VND/kWh)", zorder=3)
    axR.axhline(STRIKE, color=BLUE, lw=2.2, ls=(0,(5,5)), label="Strike (VND/kWh)", zorder=3)
    axR.set_ylim(800, 2600)
    axR.set_ylabel("VND / kWh", color=MAGENTA, fontsize=13)
    axR.tick_params(axis="y", colors=MAGENTA, labelsize=11)
    axR.set_yticks([1000,1500,2000,2500]); axR.set_yticklabels(["1.0k","1.5k","2.0k","2.5k"])
    for sp in axR.spines.values(): sp.set_color("#E0E0E0")
    return axR

def legend_below(axL, axR):
    h1,l1 = axL.get_legend_handles_labels(); h2,l2 = axR.get_legend_handles_labels()
    axL.legend(h1+h2, l1+l2, loc="upper center", bbox_to_anchor=(0.5,-0.12),
               ncol=5, frameon=False, fontsize=10.5, labelcolor=INK)

SUB=("Load & solar overlap = matched (settles on CfD)  ·  TOU bands shown like the web app  ·  "
     "FMP below strike → you top up; above → developer pays you")

# ---------- static PNG ----------
fig, axL = plt.subplots(figsize=(12.8,6.8), dpi=200)
fig.patch.set_facecolor("white"); axL.set_facecolor("white")
axR = draw_base(axL); legend_below(axL, axR)
fig.suptitle("DPPA settlement: the overlap and the price clamp", x=0.5, y=0.98,
             fontsize=18, fontweight="bold", color="#00727e")
axL.set_title(SUB, fontsize=10.5, color=GRAY, pad=8)
fig.subplots_adjust(left=0.07, right=0.93, top=0.88, bottom=0.17)
png = os.path.join("assets","cfd-consolidated-chart.png")
fig.savefig(png, dpi=200, facecolor="white"); plt.close(fig)
print("PNG:", png, os.path.getsize(png), "bytes")

# ---------- animated GIF (hour-by-hour highlight) ----------
def fmt(n): return f"{n:,}"
frames=[]
for h in range(24):
    fig, axL = plt.subplots(figsize=(11.0,6.2), dpi=100)
    fig.patch.set_facecolor("white"); axL.set_facecolor("white")
    axR = draw_base(axL); legend_below(axL, axR)
    # vertical guide + highlighted markers
    axL.axvline(h, color="#212121", alpha=0.30, lw=1.2, zorder=4)
    for val,c in ((load[h],TEAL),(solar[h],AMBER),(matched[h],GREEN)):
        axL.scatter([h],[val], s=120, color=c, edgecolor="white", linewidth=1.6, zorder=6)
    axR.scatter([h],[fmp[h]], s=120, color=MAGENTA, edgecolor="white", linewidth=1.6, zorder=6)
    # CfD direction
    if fmp[h] < STRIKE: dirn=f"FMP {fmt(fmp[h])} < strike 2,000  →  you top up developer"
    elif fmp[h] > STRIKE: dirn=f"FMP {fmt(fmp[h])} > strike 2,000  →  developer pays you"
    else: dirn="FMP = strike  →  no CfD"
    title=(f"{h:02d}:00   load {fmt(load[h])} · solar {fmt(solar[h])} · matched {fmt(matched[h])} kWh\n{dirn}")
    fig.suptitle("DPPA settlement: the overlap and the price clamp", x=0.5, y=0.985,
                 fontsize=15, fontweight="bold", color="#00727e")
    axL.set_title(title, fontsize=11, color=INK, pad=8)
    fig.subplots_adjust(left=0.07, right=0.93, top=0.84, bottom=0.18)
    buf=io.BytesIO(); fig.savefig(buf, format="png", facecolor="white"); plt.close(fig)
    buf.seek(0); frames.append(Image.open(buf).convert("RGB"))

# quantize for compact GIF
pframes=[f.quantize(colors=128, method=Image.MEDIANCUT) for f in frames]
gif=os.path.join("assets","cfd-consolidated-chart.gif")
pframes[0].save(gif, save_all=True, append_images=pframes[1:], duration=480,
                loop=0, optimize=True, disposal=2)
print("GIF:", gif, os.path.getsize(gif), "bytes,", len(pframes), "frames")

# ---------- 16:9 slide .pptx (static PNG) ----------
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
prs=Presentation(); prs.slide_width=Inches(10); prs.slide_height=Inches(5.625)
slide=prs.slides.add_slide(prs.slide_layouts[6])
def tb(l,t,w,h,text,size,color,bold=True):
    b=slide.shapes.add_textbox(Inches(l),Inches(t),Inches(w),Inches(h)); f=b.text_frame; f.word_wrap=True
    p=f.paragraphs[0]; r=p.add_run(); r.text=text
    r.font.size=Pt(size); r.font.bold=bold; r.font.name="Arial"; r.font.color.rgb=RGBColor.from_string(color)
tb(0.45,0.22,9.1,0.5,"DPPA settlement: the overlap and the price clamp",22,"00727E")
tb(0.45,0.70,9.1,0.4,"TOU bands + load/solar/matched + FMP vs strike — one view, like the web app",12,"595959",bold=False)
iw,ih=Image.open(png).size; disp_w=9.0; disp_h=disp_w*ih/iw; top=1.18
if top+disp_h>5.45: disp_h=5.45-top; disp_w=disp_h*iw/ih
slide.shapes.add_picture(png, Inches((10-disp_w)/2), Inches(top), width=Inches(disp_w))
tb(0.45,5.34,9.1,0.3,"Illustrative balanced day · strike 2,000 · FMP ~1,700 avg (NSMO/ERAV not public) · mirrors dppa-case.web.app",9,"78909C",bold=False)
out=os.path.join("ceba","DPPA CfD Consolidated Chart.pptx"); prs.save(out)
print("PPTX:", out, os.path.getsize(out), "bytes")
