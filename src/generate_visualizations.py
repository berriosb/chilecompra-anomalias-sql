"""
generate_visualizations.py — Genera PNGs de alta calidad para el README.

Carga los CSVs de reports/ y produce 4 visualizaciones clave:
1. Top 15 organismos compradores (bar chart horizontal)
2. Top 15 proveedores del Estado (bar chart horizontal)
3. Distribución geográfica del gasto (bar chart por región)
4. Concentración HHI (scatter: monto vs HHI, coloreado por nivel)

Estilo: editorial sobrio, anti-slop (sin emojis, sin gradientes,
sin glassmorphism). Inspirado en The Economist + Linear.
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path
import numpy as np

REPORTS = Path('/home/bastian-berrios/Proyectos/chilecompra-anomalias-sql/reports')
IMAGES = REPORTS / 'images'
IMAGES.mkdir(parents=True, exist_ok=True)

# ============================================
# PALETA Y ESTILO (editorial sobrio)
# ============================================
COLOR_PRIMARY = '#1a1a1a'      # Negro casi puro (texto, ejes)
COLOR_ACCENT = '#c1502e'       # Warm orange (Chile mining accent)
COLOR_BG = '#fdfcfa'           # Off-white cremoso
COLOR_GRID = '#e8e6e1'         # Gris muy suave para grid
COLOR_MUTED = '#8a8580'        # Gris medio para labels secundarios

# Colores para niveles HHI
COLOR_DIVERSIFICADO = '#4a7c59'  # Verde apagado
COLOR_MODERADO = '#d4a437'       # Mostaza
COLOR_ALTO = '#c1502e'           # Rojo-terracota

# Fuente (intentar usar una serif elegante si está disponible)
plt.rcParams.update({
    'font.family': ['DejaVu Serif', 'Georgia', 'serif'],
    'font.size': 10,
    'axes.facecolor': COLOR_BG,
    'figure.facecolor': COLOR_BG,
    'axes.edgecolor': COLOR_PRIMARY,
    'axes.linewidth': 0.8,
    'axes.labelcolor': COLOR_PRIMARY,
    'xtick.color': COLOR_MUTED,
    'ytick.color': COLOR_MUTED,
    'axes.spines.top': False,
    'axes.spines.right': False,
    'savefig.facecolor': COLOR_BG,
    'savefig.dpi': 150,
    'savefig.bbox': 'tight',
})


def truncate(s, n=40):
    """Truncar string para labels legibles."""
    if len(s) <= n:
        return s
    return s[:n-1] + '…'


def chart_01_top_compradores():
    """Top 15 organismos compradores por monto total."""
    df = pd.read_csv(REPORTS / '02_top_compradores.csv')
    df = df.head(15)  # Dejar #1 arriba

    fig, ax = plt.subplots(figsize=(12, 7.5))
    fig.subplots_adjust(top=0.78, left=0.32, right=0.95, bottom=0.12)

    labels = [truncate(name.split(' | ')[0], 45) for name in df['buyer_name']]
    values = df['monto_mil_millones']

    bars = ax.barh(labels, values, color=COLOR_PRIMARY, edgecolor='none', height=0.7)

    # Resaltar el #1 (que es bars[0] — el primer item aparece arriba en barh)
    bars[0].set_color(COLOR_ACCENT)
    bars[0].set_edgecolor(COLOR_ACCENT)
    bars[0].set_linewidth(1.5)

    ax.set_xlabel('Monto total (miles de millones CLP)', fontsize=11, color=COLOR_PRIMARY, labelpad=10)
    ax.set_xlim(0, values.max() * 1.18)

    # Anotar valor al final de cada barra (con unidad)
    for bar, val in zip(bars, values):
        ax.text(bar.get_width() + values.max() * 0.01,
                bar.get_y() + bar.get_height() / 2,
                f'{val:,.0f} mil M',
                va='center', ha='left',
                fontsize=9, color=COLOR_PRIMARY, fontweight='medium')

    # Grid sutil en eje X
    ax.grid(axis='x', linestyle='-', linewidth=0.5, color=COLOR_GRID, zorder=0)
    ax.set_axisbelow(True)

    # Título y subtítulo (separados)
    fig.text(0.32, 0.94, '¿Quién compra más al Estado?',
             fontsize=16, fontweight='bold', color=COLOR_PRIMARY)
    fig.text(0.32, 0.90, 'Top 15 organismos por gasto total — Chile, 2024',
             fontsize=11, color=COLOR_MUTED)
    fig.text(0.32, 0.86,
             'CENABAST concentra el 7% del gasto público total con solo 269 OC grandes',
             fontsize=10, color=COLOR_MUTED, style='italic')

    ax.tick_params(axis='y', labelsize=9, length=0)
    ax.tick_params(axis='x', labelsize=9, length=0)

    # Quitar bordes
    for spine in ax.spines.values():
        spine.set_visible(False)

    plt.savefig(IMAGES / '01_top_compradores.png')
    plt.close()
    print('✅ 01_top_compradores.png')


def chart_02_top_proveedores():
    """Top 15 proveedores por venta al Estado."""
    df = pd.read_csv(REPORTS / '03_top_proveedores.csv')
    df = df.head(15)  # #1 arriba

    fig, ax = plt.subplots(figsize=(12, 7.5))
    fig.subplots_adjust(top=0.78, left=0.32, right=0.95, bottom=0.12)

    labels = [truncate(name.split(' | ')[0], 35) for name in df['supplier_name']]
    values = df['monto_mil_millones']

    bars = ax.barh(labels, values, color=COLOR_PRIMARY, edgecolor='none', height=0.7)
    bars[0].set_color(COLOR_ACCENT)
    bars[0].set_edgecolor(COLOR_ACCENT)
    bars[0].set_linewidth(1.5)

    ax.set_xlabel('Monto total vendido al Estado (miles de millones CLP)',
                  fontsize=11, color=COLOR_PRIMARY, labelpad=10)
    ax.set_xlim(0, values.max() * 1.30)

    for bar, val, n_compradores in zip(bars, values, df['num_compradores']):
        ax.text(bar.get_width() + values.max() * 0.01,
                bar.get_y() + bar.get_height() / 2,
                f'{val:,.0f} mil M  ·  {n_compradores:,} compradores',
                va='center', ha='left', fontsize=9, color=COLOR_PRIMARY, fontweight='medium')

    ax.grid(axis='x', linestyle='-', linewidth=0.5, color=COLOR_GRID, zorder=0)
    ax.set_axisbelow(True)

    fig.text(0.32, 0.94, '¿Quién vende más al Estado?',
             fontsize=16, fontweight='bold', color=COLOR_PRIMARY)
    fig.text(0.32, 0.90, 'Top 15 proveedores por monto total — Chile, 2024',
             fontsize=11, color=COLOR_MUTED)
    fig.text(0.32, 0.86,
             'COPEC vende a 1.526 organismos distintos. Edenred domina gift cards de alimentación',
             fontsize=10, color=COLOR_MUTED, style='italic')

    ax.tick_params(axis='y', labelsize=9, length=0)
    ax.tick_params(axis='x', labelsize=9, length=0)
    for spine in ax.spines.values():
        spine.set_visible(False)

    plt.savefig(IMAGES / '02_top_proveedores.png')
    plt.close()
    print('✅ 02_top_proveedores.png')


def chart_03_distribucion_geografica():
    """Distribución del gasto por región del proveedor."""
    df = pd.read_csv(REPORTS / '04_gasto_por_region.csv')
    df['supplier_region'] = df['supplier_region'].str.strip()

    # Top 10 + "Otras"
    if len(df) > 10:
        top10 = df.head(10)
        otras = df.iloc[10:]
        otras_sum = pd.DataFrame([{
            'supplier_region': 'Otras regiones',
            'monto_mil_millones': otras['monto_mil_millones'].sum(),
            'num_oc': otras['num_oc'].sum(),
        }])
        df_plot = pd.concat([top10, otras_sum], ignore_index=True)
    else:
        df_plot = df

    fig, ax = plt.subplots(figsize=(12, 7.5))
    fig.subplots_adjust(top=0.78, left=0.32, right=0.95, bottom=0.12)

    labels = df_plot['supplier_region']
    values = df_plot['monto_mil_millones']
    total = values.sum()
    pct = (values / total * 100).round(1)

    bars = ax.barh(labels, values, color=COLOR_PRIMARY, edgecolor='none', height=0.75)
    bars[0].set_color(COLOR_ACCENT)  # RM destacada
    bars[0].set_edgecolor(COLOR_ACCENT)
    bars[0].set_linewidth(1.5)

    ax.set_xlabel('Monto total vendido al Estado (miles de millones CLP)',
                  fontsize=11, color=COLOR_PRIMARY, labelpad=10)
    ax.set_xlim(0, values.max() * 1.25)

    for bar, val, p in zip(bars, values, pct):
        ax.text(bar.get_width() + values.max() * 0.01,
                bar.get_y() + bar.get_height() / 2,
                f'{val:,.0f} mil M  ·  {p}%',
                va='center', ha='left', fontsize=9, color=COLOR_PRIMARY, fontweight='medium')

    ax.grid(axis='x', linestyle='-', linewidth=0.5, color=COLOR_GRID, zorder=0)
    ax.set_axisbelow(True)

    fig.text(0.32, 0.94, '¿Dónde están los proveedores del Estado?',
             fontsize=16, fontweight='bold', color=COLOR_PRIMARY)
    fig.text(0.32, 0.90, 'Gasto total por región — Chile, 2024',
             fontsize=11, color=COLOR_MUTED)
    fig.text(0.32, 0.86,
             'Región Metropolitana concentra el 65.7% del gasto — sede de las grandes empresas',
             fontsize=10, color=COLOR_MUTED, style='italic')

    ax.tick_params(axis='y', labelsize=9, length=0)
    ax.tick_params(axis='x', labelsize=9, length=0)
    for spine in ax.spines.values():
        spine.set_visible(False)

    plt.savefig(IMAGES / '03_distribucion_geografica.png')
    plt.close()
    print('✅ 03_distribucion_geografica.png')


def chart_04_concentracion_hhi():
    """Scatter: concentración HHI vs monto gastado."""
    df = pd.read_csv(REPORTS / '05_hhi_top30.csv')
    # Versión corta para labels (más legible)
    def short_name(full):
        # Para nombres muy largos, usar versión más limpia
        if 'MINISTERIO DE OBRAS' in full:
            return 'MOP Ñuble'
        if 'SERVICIO DE SALUD SUR' in full:
            return 'Servicio Salud Sur'
        # Default: tomar primera parte antes de |
        return truncate(full.split(' | ')[0], 38)
    df['buyer_short'] = df['buyer_name'].apply(short_name)

    def color_for(hhi):
        if hhi < 1500:
            return COLOR_DIVERSIFICADO
        elif hhi < 2500:
            return COLOR_MODERADO
        else:
            return COLOR_ALTO

    df['color'] = df['hhi'].apply(color_for)

    fig, ax = plt.subplots(figsize=(12, 7.5))
    fig.subplots_adjust(top=0.78, left=0.08, right=0.96, bottom=0.10)

    sizes = np.sqrt(df['monto_mil_millones']) * 9
    ax.scatter(df['monto_mil_millones'], df['hhi'],
               s=sizes, c=df['color'], alpha=0.78,
               edgecolors=COLOR_PRIMARY, linewidth=0.8, zorder=3)

    # Etiquetar outliers (HHI > 3000) con offsets distintos para evitar superposición
    offsets = {
        0: (15, 5),    # MOP Ñuble — hacia la derecha (fuera del chart)
        1: (15, -22),  # Servicio de Salud Sur — hacia abajo-derecha
    }
    for i, (_, row) in enumerate(df[df['hhi'] > 3000].iterrows()):
        offset = offsets.get(i, (15, 6))
        ax.annotate(row['buyer_short'],
                    xy=(row['monto_mil_millones'], row['hhi']),
                    xytext=offset, textcoords='offset points',
                    fontsize=8.5, color=COLOR_PRIMARY, fontweight='bold',
                    arrowprops=dict(arrowstyle='-', color=COLOR_MUTED, lw=0.5))

    # Líneas de umbral
    ax.axhline(y=1500, linestyle='--', linewidth=0.8, color=COLOR_GRID, zorder=1)
    ax.axhline(y=2500, linestyle='--', linewidth=0.8, color=COLOR_GRID, zorder=1)
    ax.text(df['monto_mil_millones'].max() * 0.98, 1530, 'umbral 1,500',
            fontsize=8.5, color=COLOR_MUTED, ha='right', style='italic')
    ax.text(df['monto_mil_millones'].max() * 0.98, 2530, 'umbral 2,500',
            fontsize=8.5, color=COLOR_MUTED, ha='right', style='italic')

    ax.set_xlabel('Monto total gastado (miles de millones CLP)',
                  fontsize=11, color=COLOR_PRIMARY, labelpad=10)
    ax.set_ylabel('Índice HHI (concentración de proveedores)',
                  fontsize=11, color=COLOR_PRIMARY, labelpad=10)

    ax.set_xlim(0, df['monto_mil_millones'].max() * 1.05)
    ax.set_ylim(0, df['hhi'].max() * 1.05)

    ax.grid(True, linestyle='-', linewidth=0.5, color=COLOR_GRID, zorder=0)
    ax.set_axisbelow(True)

    legend_elements = [
        mpatches.Patch(color=COLOR_DIVERSIFICADO, label='Diversificado (HHI < 1,500)'),
        mpatches.Patch(color=COLOR_MODERADO, label='Moderado (1,500–2,500)'),
        mpatches.Patch(color=COLOR_ALTO, label='Alta concentración (HHI > 2,500)'),
    ]
    ax.legend(handles=legend_elements, loc='lower right', frameon=False, fontsize=9)

    fig.text(0.08, 0.94, '¿Dónde hay concentración sospechosa de proveedores?',
             fontsize=16, fontweight='bold', color=COLOR_PRIMARY)
    fig.text(0.08, 0.90, 'Top 30 organismos compradores — HHI vs gasto total, 2024',
             fontsize=11, color=COLOR_MUTED)
    fig.text(0.08, 0.86,
             'MOP Ñuble: solo 14 proveedores y un HHI de 7,237 — caso extremo de concentración',
             fontsize=10, color=COLOR_MUTED, style='italic')

    ax.tick_params(labelsize=9, length=0)
    for spine in ax.spines.values():
        spine.set_visible(False)

    plt.savefig(IMAGES / '04_concentracion_hhi.png')
    plt.close()
    print('✅ 04_concentracion_hhi.png')


def main():
    print('Generando visualizaciones...')
    print()
    chart_01_top_compradores()
    chart_02_top_proveedores()
    chart_03_distribucion_geografica()
    chart_04_concentracion_hhi()
    print()
    print(f'Todas guardadas en: {IMAGES}/')


if __name__ == '__main__':
    main()
