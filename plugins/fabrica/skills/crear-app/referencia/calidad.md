# Calidad (fase 5)

## 1. Puertas de calidad

Todas deben cumplirse para pasar a la publicación:

| # | Comprobación | Cómo | Umbral |
| --- | --- | --- | --- |
| 1 | Formato, lint, tipos, pruebas unitarias y de integración, compilación y extremo a extremo | `npm run verificar` | En verde |
| 2 | Cobertura de historias | Cada historia de `especificacion.md` tiene al menos una prueba de extremo a extremo con su identificador (H1, H2…) en el nombre | 100 % de las imprescindibles e importantes |
| 3 | Auditoría con sesión | `npm run build && npm run auditar` (añade todas las rutas con `-- --rutas …`) | APTO |
| 4 | Lighthouse móvil | Incluido en la auditoría | 90 o más en rendimiento, accesibilidad y buenas prácticas |
| 5 | Accesibilidad | axe en las pruebas y en la auditoría | 0 fallos graves o críticos |
| 6 | Dependencias | `npm audit --omit=dev` | 0 vulnerabilidades altas o críticas |
| 7 | Seguridad | `fabrica:revisor-seguridad` | 0 hallazgos altos o medios sin corregir |
| 8 | Requisitos | `fabrica:revisor-requisitos` | Todos los criterios cumplidos o justificados |
| 9 | Código | `fabrica:revisor-codigo` | 0 hallazgos altos |
| 10 | Interfaz | `fabrica:revisor-visual` sobre las capturas | Ningún criterio por debajo de 4 |
| 11 | Móvil (si hay) | Verificación de `movil.md`, sección 4 | En verde |

## 2. Encargos para los revisores

Lánzalos en paralelo cuando las puertas 1 a 6 estén en verde, con la auditoría ya hecha (las capturas están en `.fabrica/auditoria/capturas/`).

**`fabrica:revisor-requisitos`**

```text
Comprueba si la aplicación cumple .fabrica/especificacion.md. Para cada historia y criterio, busca la prueba de
extremo a extremo que lo cubre (tests/e2e/) y el código que lo implementa, y mira las capturas.
Responde con una tabla: historia | criterio | cumple / parcial / no | evidencia (fichero de prueba o captura) |
arreglo propuesto. Señala también funcionalidades construidas que no estaban en la especificación.
```

**`fabrica:revisor-seguridad`**: el encargo de `datos-seguridad.md`, sección 4.

**`fabrica:revisor-codigo`**

```text
Revisa el código de la aplicación (git diff <commit-base>..HEAD, sin package-lock.json ni drizzle/meta).
Comprueba que se siguen los patrones de .fabrica/arquitectura.md y de CLAUDE.md (capa de datos con permisos,
acciones con validación, componentes de interfaz comunes), y busca errores de lógica, condiciones de carrera,
consultas N+1, código muerto, duplicación evitable y nombres confusos.
Clasifica cada hallazgo como alta, media o baja, con fichero, línea y arreglo propuesto.
```

**`fabrica:revisor-visual`**

```text
Revisa las capturas de .fabrica/auditoria/capturas/ de esta aplicación de gestión. Criterios (de 1 a 5):
claridad de cada pantalla, consistencia de componentes, legibilidad, uso en móvil, estados vacíos y de error,
y acabado. Da los 10 cambios concretos que más mejorarían la usabilidad, con pantalla, zona y qué cambiar.
```

Arregla lo de severidad alta y media, y lo bajo que sea barato. Registra como decisión lo que descartes y por qué.

## 3. Definición de terminado

**Funcionalidad**
- [ ] Todas las historias imprescindibles e importantes implementadas y con su prueba de extremo a extremo.
- [ ] Estados vacío, de carga y de error en cada pantalla.
- [ ] Integraciones reales configuradas o simuladas y documentadas.

**Seguridad y datos**
- [ ] Lista de `datos-seguridad.md` completa y revisor de seguridad sin hallazgos altos ni medios.
- [ ] `/privacidad` adaptada a los tratamientos reales.
- [ ] Datos de ejemplo eliminados de la plantilla (cliente de ejemplo, textos de relleno).

**Técnica**
- [ ] `npm run verificar` en verde y auditoría APTA.
- [ ] Migraciones versionadas que se aplican desde cero (`DATABASE_URL=pglite://memoria npm test` las aplica).
- [ ] `.env.example` con todas las variables documentadas.
- [ ] Sin `TODO`, `console.log` de depuración ni código comentado.

**Entrega**
- [ ] `ENTREGA.md`, `README.md` y `docs/` completos.
- [ ] Commit final y etiqueta `v1.0`.
