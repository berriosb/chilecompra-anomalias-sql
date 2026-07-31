# Limitaciones del análisis

> Documentación honesta de sesgos, exclusiones y decisiones del pipeline.
> Si vas a usar este trabajo en una entrevista, podés citar este archivo.

## Datos excluidos

### 1. Outliers extremos de monto

**59 OC eliminadas** por tener monto ≤ 0 o > $10B CLP.

- **Caso extremo:** OC con `oc_amount_clp = -9,223,372,036,854,775,808` (= INT64 min, bug del source)
- **Caso extremo:** OC con `oc_amount_clp = 5,042,331,844,253,101,056` (5 trillones CLP en una sola OC, claramente error)
- **Justificación:** Estos valores no son plausibles como compras reales. El presupuesto nacional 2024 fue ~$75 billones CLP; una OC de $5 trillones es 6.7% del presupuesto total en una sola transacción.

**Decisión:** Filtrar a `[1K, 10B]` CLP. Esto preserva 99.99% de los datos legítimos.

### 2. OC sin contrapartes identificadas

**~24% de OC removidas** por no tener `buyer_name` o `supplier_rut`.

- Razones: OCDS a veces tiene el `party` referenciado pero sin detalles completos en `parties.csv`
- Impacto: Estos OC se pierden para análisis de concentración/HHI pero se mantienen para análisis de gasto total

### 3. Período limitado

Solo datos de **2024** están incluidos efectivamente.

- El dataset OCDS de ChileCompra tiene datos desde 2022
- Sin embargo, los tar.gz anuales publicados tienen inconsistencias (los datasets 2024 y 2025 descargados eran IDÉNTICOS, ambos contenían OC con `oc_date` 2022-2024)
- **Decisión:** Filtrar por `oc_date >= 2024-01-01` para tener un año calendario limpio

### 4. Categorías excluidas del OCDS

- **Compra Ágil** (< $30K CLP): excluida del estándar OCDS oficial
- **Obras públicas** (MOP, MINVU): tienen mecanismo propio de contratación
- **Empresas públicas**: no obligadas a usar Mercado Público (Ley 19.886 no aplica)

## Sesgos conocidos

### Sesgo geográfico

El **65.7% del gasto** se concentra en proveedores de la Región Metropolitana de Santiago.

- **Causa probable:** Las grandes empresas (COPEC, Sanofi, Roche, Edenred) tienen sede en Santiago
- **Interpretación correcta:** El Estado compra A proveedores de Santiago, no necesariamente PARA Santiago
- **Limitación:** No podemos medir gasto *per cápita regional* sin datos de población

### Sesgo de granularidad

El campo `category_description` tiene solo **4 valores únicos** en el dataset.

- **Causa:** La mayoría de OC no tienen `tender_classification_description` poblada en OCDS
- **Impacto:** El análisis de anomalías por categoría (z-score por rubro) tiene cobertura limitada

### Sesgo de normalización

Proveedores pueden aparecer con **nombres ligeramente diferentes** entre OC:

- Ejemplo: `"COPEC S.A. | COPEC S.A."` vs `"COPEC S.A."` vs `"COMPAÑÍA DE PETRÓLEOS DE CHILE S.A."`
- Sin normalización, el conteo de proveedores únicos puede estar sobreestimado
- **Decisión:** Usamos `supplier_rut` como PK, que es más estable

## Decisiones metodológicas

### HHI (Herfindahl-Hirschman Index)

- **Fórmula:** `HHI = Σ (cuota_i)²` donde `cuota_i` es el % de gasto del proveedor `i`
- **Rango:** 0 (competencia perfecta) a 10,000 (monopolio)
- **Umbrales:** < 1500 diversificado, 1500-2500 moderado, > 2500 alta concentración
- **Limitación:** HHI no captura colusión ni calidad del gasto

### Definición de "activo"

Solo OC con `oc_status IN ('active', 'completed')` se incluyen.

- `active`: OC vigente, en curso
- `completed`: OC finalizada
- **Excluidas:** `cancelled`, `pending`, `withdrawn`

### Unidad de análisis

- **Una fila = una OC** (no un contrato, no un proveedor)
- Esto puede sobrecontar si una OC tiene múltiples entregas al mismo proveedor
- Para análisis más fino, agrupar por `supplier_rut + buyer_id`

## Trabajo futuro

- [ ] Cruzar con datos SERNAC (proveedores con reclamos)
- [ ] Análisis de colusión temporal (múltiples OC simultáneas al mismo proveedor)
- [ ] Datos de presupuesto por ministerio (Mineduc, Salud) para comparar ejecución vs plan
- [ ] Series temporales más largas (2022-2026) para detectar tendencias
