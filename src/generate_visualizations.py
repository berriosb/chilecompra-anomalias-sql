"""
generate_visualizations.py — Genera PNGs de alta calidad para el README y la documentación.

Carga los CSVs de reports/ y produce 4 visualizaciones clave con estilo editorial premium:
1. Top 15 organismos compradores (bar chart horizontal)
2. Top 15 proveedores del Estado (bar chart horizontal)
3. Distribución geográfica del gasto (bar chart por región)
4. Concentración HHI (scatter plot: gasto vs HHI con umbrales y outliers)

Estilo: Editorial moderno (Financial Times / The Economist / Linear), 300 DPI retina.
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path
import numpy as np

REPORTS = Path(__file__).parent.parent / "reports"
IMAGES = REPORTS / "images"
IMAGES.mkdir(parents=True, exist_ok=True)

# ============================================
# PALETA DE COLORES EDITORIAL
# ============================================
COLOR_BG = "#fdfcfa"          # Papel cremoso sobrio
COLOR_CARD_BG = "#ffffff"     # Blanco puro para tarjetas
COLOR_INK = "#1f3a52"         # Azul marino profundo (títulos/ejes)
COLOR_ACCENT = "#c1502e"      # Terracota / cobre chileno (#1 ítem)
COLOR_BAR = "#3a6d7a"         # Azul/Verde azulado primario
COLOR_BAR_SECONDARY = "#5a9485" # Verde azulado secundario
COLOR_GRID = "#e8e6e1"        # Líneas de guía suaves
COLOR_MUTED = "#6a7d8a"       # Subtítulos y etiquetas secundarias

# Nivel de concentración HHI
COLOR_HHI_LOW = "#4a7c59"     # Verde (Diversificado)
COLOR_HHI_MID = "#d4a437"     # Mostaza (Moderado)
COLOR_HHI_HIGH = "#c1502e"    # Rojo terracota (Alta concentración)

plt.rcParams.update({
    "font.family": ["Liberation Sans", "DejaVu Sans", "sans-serif"],
    "font.size": 10,
    "axes.facecolor": COLOR_BG,
    "figure.facecolor": COLOR_BG,
    "axes.edgecolor": COLOR_INK,
    "axes.linewidth": 0.8,
    "axes.labelcolor": COLOR_INK,
    "xtick.color": COLOR_MUTED,
    "ytick.color": COLOR_INK,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.spines.left": False,
    "axes.spines.bottom": False,
    "savefig.facecolor": COLOR_BG,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
})


def truncate(s: str, n: int = 40) -> str:
    """Truncar string para labels legibles."""
    if len(s) <= n:
        return s
    return s[: n - 1] + "…"


def format_clp_billions(val_mil_m: float) -> str:
    """Formatear valor en miles de millones CLP."""
    if val_mil_m >= 1000:
        return f"${val_mil_m / 1000:.2f}B"
    return f"${val_mil_m:.0f} mil M"


def chart_01_top_compradores():
    """Top 15 organismos compradores por monto total."""
    df = pd.read_csv(REPORTS / "02_top_compradores.csv").head(15)
    df = df.iloc[::-1].reset_index(drop=True)  # Invertir para que el #1 quede arriba

    fig, ax = plt.subplots(figsize=(12, 8))
    fig.subplots_adjust(top=0.82, left=0.35, right=0.92, bottom=0.10)

    labels = [truncate(name.split(" | ")[0], 42) for name in df["buyer_name"]]
    values = df["monto_mil_millones"]
    num_ocs = df["num_oc"]

    # Asignar colores: el #1 (último en df invertido) lleva COLOR_ACCENT
    colors = [COLOR_ACCENT if i == len(df) - 1 else COLOR_BAR for i in range(len(df))]
    bars = ax.barh(labels, values, color=colors, edgecolor="none", height=0.65)

    ax.set_xlabel("Monto total gastado (miles de millones CLP)", fontsize=11, color=COLOR_INK, fontweight="bold", labelpad=12)
    ax.set_xlim(0, values.max() * 1.25)

    # Anotar valores al lado de cada barra
    for i, (bar, val, noc) in enumerate(zip(bars, values, num_ocs)):
        is_top = i == len(df) - 1
        font_weight = "bold" if is_top else "normal"
        text_color = COLOR_ACCENT if is_top else COLOR_INK
        
        txt = f"${val:,.0f} mil M  ·  {noc:,} OC"
        ax.text(
            bar.get_width() + values.max() * 0.015,
            bar.get_y() + bar.get_height() / 2,
            txt,
            va="center",
            ha="left",
            fontsize=9.5,
            color=text_color,
            fontweight=font_weight,
        )

    ax.grid(axis="x", linestyle="-", linewidth=0.6, color=COLOR_GRID, zorder=0)
    ax.set_axisbelow(True)

    # Encabezado Editorial
    fig.text(0.35, 0.94, "¿Quién compra más al Estado?", fontsize=18, fontweight="bold", color=COLOR_INK)
    fig.text(0.35, 0.90, "Top 15 organismos compradores por gasto total — Chile, 2024", fontsize=11, color=COLOR_MUTED)
    fig.text(
        0.35,
        0.86,
        "CENABAST lidera el gasto público ($227 mil millones CLP) concentrado en compras de medicamentos masivas",
        fontsize=10,
        color=COLOR_ACCENT,
        style="italic",
        fontweight="bold",
    )

    ax.tick_params(axis="y", labelsize=9.5, length=0)
    ax.tick_params(axis="x", labelsize=9, length=0)

    plt.savefig(IMAGES / "01_top_compradores.png")
    plt.close()
    print("✅ 01_top_compradores.png (300 DPI)")


def chart_02_top_proveedores():
    """Top 15 proveedores por venta al Estado."""
    df = pd.read_csv(REPORTS / "03_top_proveedores.csv").head(15)
    df = df.iloc[::-1].reset_index(drop=True)

    fig, ax = plt.subplots(figsize=(12, 8))
    fig.subplots_adjust(top=0.82, left=0.35, right=0.92, bottom=0.10)

    labels = [truncate(name.split(" | ")[0], 36) for name in df["supplier_name"]]
    values = df["monto_mil_millones"]
    num_buyers = df["num_compradores"]

    colors = [COLOR_ACCENT if i == len(df) - 1 else COLOR_BAR_SECONDARY for i in range(len(df))]
    bars = ax.barh(labels, values, color=colors, edgecolor="none", height=0.65)

    ax.set_xlabel("Monto total adjudicado (miles de millones CLP)", fontsize=11, color=COLOR_INK, fontweight="bold", labelpad=12)
    ax.set_xlim(0, values.max() * 1.30)

    for i, (bar, val, n_comp) in enumerate(zip(bars, values, num_buyers)):
        is_top = i == len(df) - 1
        font_weight = "bold" if is_top else "normal"
        text_color = COLOR_ACCENT if is_top else COLOR_INK

        txt = f"${val:,.0f} mil M  ·  {n_comp:,} organismos"
        ax.text(
            bar.get_width() + values.max() * 0.015,
            bar.get_y() + bar.get_height() / 2,
            txt,
            va="center",
            ha="left",
            fontsize=9.5,
            color=text_color,
            fontweight=font_weight,
        )

    ax.grid(axis="x", linestyle="-", linewidth=0.6, color=COLOR_GRID, zorder=0)
    ax.set_axisbelow(True)

    fig.text(0.35, 0.94, "¿Quién vende más al Estado?", fontsize=18, fontweight="bold", color=COLOR_INK)
    fig.text(0.35, 0.90, "Top 15 proveedores del Estado por monto adjudicado — Chile, 2024", fontsize=11, color=COLOR_MUTED)
    fig.text(
        0.35,
        0.86,
        "COPEC es el mayor proveedor estatal ($162 mil M en 1.526 organismos). Edenred domina convenios de vales",
        fontsize=10,
        color=COLOR_ACCENT,
        style="italic",
        fontweight="bold",
    )

    ax.tick_params(axis="y", labelsize=9.5, length=0)
    ax.tick_params(axis="x", labelsize=9, length=0)

    plt.savefig(IMAGES / "02_top_proveedores.png")
    plt.close()
    print("✅ 02_top_proveedores.png (300 DPI)")


def chart_03_distribucion_geografica():
    """Distribución del gasto por región del proveedor."""
    df = pd.read_csv(REPORTS / "04_gasto_por_region.csv")
    df["supplier_region"] = df["supplier_region"].str.strip()

    if len(df) > 10:
        top10 = df.head(10)
        otras = df.iloc[10:]
        otras_sum = pd.DataFrame([{
            "supplier_region": "Otras 6 regiones",
            "monto_mil_millones": otras["monto_mil_millones"].sum(),
            "num_oc": otras["num_oc"].sum(),
        }])
        df_plot = pd.concat([top10, otras_sum], ignore_index=True)
    else:
        df_plot = df

    df_plot = df_plot.iloc[::-1].reset_index(drop=True)

    fig, ax = plt.subplots(figsize=(12, 8))
    fig.subplots_adjust(top=0.82, left=0.35, right=0.92, bottom=0.10)

    labels = df_plot["supplier_region"]
    values = df_plot["monto_mil_millones"]
    total = df["monto_mil_millones"].sum()
    pcts = (values / total * 100).round(1)

    colors = [COLOR_ACCENT if i == len(df_plot) - 1 else COLOR_BAR for i in range(len(df_plot))]
    bars = ax.barh(labels, values, color=colors, edgecolor="none", height=0.68)

    ax.set_xlabel("Monto total por región del proveedor (miles de millones CLP)", fontsize=11, color=COLOR_INK, fontweight="bold", labelpad=12)
    ax.set_xlim(0, values.max() * 1.25)

    for i, (bar, val, p) in enumerate(zip(bars, values, pcts)):
        is_top = i == len(df_plot) - 1
        font_weight = "bold" if is_top else "normal"
        text_color = COLOR_ACCENT if is_top else COLOR_INK

        txt = f"${val:,.0f} mil M  ({p:.1f}%)"
        ax.text(
            bar.get_width() + values.max() * 0.015,
            bar.get_y() + bar.get_height() / 2,
            txt,
            va="center",
            ha="left",
            fontsize=9.5,
            color=text_color,
            fontweight=font_weight,
        )

    ax.grid(axis="x", linestyle="-", linewidth=0.6, color=COLOR_GRID, zorder=0)
    ax.set_axisbelow(True)

    fig.text(0.35, 0.94, "¿Dónde están los proveedores del Estado?", fontsize=18, fontweight="bold", color=COLOR_INK)
    fig.text(0.35, 0.90, "Gasto total por región de residencia del proveedor — Chile, 2024", fontsize=11, color=COLOR_MUTED)
    fig.text(
        0.35,
        0.86,
        "La Región Metropolitana concentra el 65.7% del gasto total ($2.12 billones CLP) por centralización de matrices",
        fontsize=10,
        color=COLOR_ACCENT,
        style="italic",
        fontweight="bold",
    )

    ax.tick_params(axis="y", labelsize=9.5, length=0)
    ax.tick_params(axis="x", labelsize=9, length=0)

    plt.savefig(IMAGES / "03_distribucion_geografica.png")
    plt.close()
    print("✅ 03_distribucion_geografica.png (300 DPI)")


def chart_04_concentracion_hhi():
    """Scatter Plot: Concentración HHI vs Monto gastado."""
    df = pd.read_csv(REPORTS / "05_hhi_top30.csv")

    def short_name(full):
        if "MINISTERIO DE OBRAS" in full or "MOP" in full:
            return "MOP Ñuble (OO.HH.)"
        if "SERVICIO DE SALUD SUR" in full:
            return "Servicio Salud Sur"
        if "HUECHURABA" in full:
            return "Muni. Huechuraba"
        if "PARQUE METROPOLITANO" in full:
            return "Parque Metropolitano"
        if "INVESTIGACIONES" in full or "PDI" in full:
            return "PDI Chile"
        return truncate(full.split(" | ")[0], 30)

    df["buyer_short"] = df["buyer_name"].apply(short_name)

    def color_for(hhi):
        if hhi < 1500:
            return COLOR_HHI_LOW
        elif hhi < 2500:
            return COLOR_HHI_MID
        else:
            return COLOR_HHI_HIGH

    df["color"] = df["hhi"].apply(color_for)

    fig, ax = plt.subplots(figsize=(12, 8))
    fig.subplots_adjust(top=0.82, left=0.10, right=0.95, bottom=0.12)

    sizes = np.sqrt(df["monto_mil_millones"]) * 14 + 40
    scatter = ax.scatter(
        df["monto_mil_millones"],
        df["hhi"],
        s=sizes,
        c=df["color"],
        alpha=0.85,
        edgecolors=COLOR_INK,
        linewidth=1.0,
        zorder=4,
    )

    # Anotar outliers (HHI > 2600)
    outliers = df[df["hhi"] > 2600].copy()
    offset_map = {
        "MOP Ñuble (OO.HH.)": (15, 10),
        "Servicio Salud Sur": (15, -15),
        "Parque Metropolitano": (12, 8),
        "Muni. Huechuraba": (-120, -18),
        "PDI Chile": (15, -8),
    }

    for _, row in outliers.iterrows():
        name = row["buyer_short"]
        off = offset_map.get(name, (12, 5))
        ax.annotate(
            f"{name}\n(HHI: {row['hhi']:,})",
            xy=(row["monto_mil_millones"], row["hhi"]),
            xytext=off,
            textcoords="offset points",
            fontsize=8.5,
            color=COLOR_INK,
            fontweight="bold",
            bbox=dict(boxstyle="round,pad=0.3", facecolor="#ffffff", edgecolor=COLOR_GRID, alpha=0.9),
            arrowprops=dict(arrowstyle="->", color=COLOR_MUTED, lw=0.8),
            zorder=5,
        )

    # Umbrales HHI según norma económica
    max_x = df["monto_mil_millones"].max() * 1.05
    ax.axhline(y=1500, linestyle="--", linewidth=1.0, color=COLOR_HHI_MID, alpha=0.7, zorder=2)
    ax.axhline(y=2500, linestyle="--", linewidth=1.0, color=COLOR_HHI_HIGH, alpha=0.7, zorder=2)

    ax.text(max_x * 0.98, 1540, "Umbral 1,500 (Moderado)", fontsize=8.5, color=COLOR_HHI_MID, ha="right", fontweight="bold")
    ax.text(max_x * 0.98, 2540, "Umbral 2,500 (Alta Concentración)", fontsize=8.5, color=COLOR_HHI_HIGH, ha="right", fontweight="bold")

    ax.set_xlabel("Monto total gastado (miles de millones CLP)", fontsize=11, color=COLOR_INK, fontweight="bold", labelpad=10)
    ax.set_ylabel("Índice HHI (Concentración de proveedores)", fontsize=11, color=COLOR_INK, fontweight="bold", labelpad=10)

    ax.set_xlim(0, max_x)
    ax.set_ylim(0, df["hhi"].max() * 1.08)

    ax.grid(True, linestyle="-", linewidth=0.5, color=COLOR_GRID, zorder=0)
    ax.set_axisbelow(True)

    legend_elements = [
        mpatches.Patch(facecolor=COLOR_HHI_LOW, edgecolor=COLOR_INK, label="Diversificado (HHI < 1.500)"),
        mpatches.Patch(facecolor=COLOR_HHI_MID, edgecolor=COLOR_INK, label="Concentración Moderada (1.500–2.500)"),
        mpatches.Patch(facecolor=COLOR_HHI_HIGH, edgecolor=COLOR_INK, label="Alta Concentración (HHI > 2.500)"),
    ]
    ax.legend(handles=legend_elements, loc="upper right", frameon=True, facecolor="#ffffff", edgecolor=COLOR_GRID, fontsize=9)

    fig.text(0.10, 0.94, "¿Dónde hay concentración sospechosa de proveedores?", fontsize=18, fontweight="bold", color=COLOR_INK)
    fig.text(0.10, 0.90, "Índice HHI por organismo comprador (Top 30 instituciones por gasto) — Chile, 2024", fontsize=11, color=COLOR_MUTED)
    fig.text(
        0.10,
        0.86,
        "MOP Ñuble presenta un HHI crítico de 7.237 (14 proveedores en total), indicando concentración de mercado extrema",
        fontsize=10,
        color=COLOR_ACCENT,
        style="italic",
        fontweight="bold",
    )

    ax.tick_params(labelsize=9, length=0)

    plt.savefig(IMAGES / "04_concentracion_hhi.png")
    plt.close()
    print("✅ 04_concentracion_hhi.png (300 DPI)")


def main():
    print("🚀 Generando visualizaciones editoriales de alta calidad (300 DPI)...")
    chart_01_top_compradores()
    chart_02_top_proveedores()
    chart_03_distribucion_geografica()
    chart_04_concentracion_hhi()
    print(f"\n✨ ¡Todas las imágenes fueron actualizadas en {IMAGES}/!")


if __name__ == "__main__":
    main()
