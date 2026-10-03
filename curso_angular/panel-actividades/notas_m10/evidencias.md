# Módulo 10 — Calidad, pruebas y producto final

## Línea base y pruebas

La primera ejecución encontró pruebas antiguas de persistencia local y rutas que ya fallaban con el flujo HTTP del módulo 9. Se sustituyeron por pruebas para el estado actual de la aplicación; no se modificó la lógica de componentes, servicios ni rutas. También se eliminó `src/app/app.spec.ts`, la prueba genérica del andamiaje.

`npm test -- --watch=false` termina con **30 pruebas en verde, en cuatro archivos**:

- `src/app/actividades/actividades.spec.ts`: 14 pruebas del servicio y sus reglas.
- `src/app/actividades/tarjeta-actividad/tarjeta-actividad.spec.ts`: 5 pruebas del DOM y las salidas del componente.
- `src/app/app.routes.spec.ts`: 5 pruebas de navegación.
- `src/app/actividades/actividades-api.spec.ts`: 6 pruebas HTTP. El archivo queda junto a `actividades-api.ts`, donde está el adaptador en este repositorio.

Las peticiones se resuelven con `HttpTestingController`; la suite no necesita que `npm run api` esté activo. El último resultado fue 30/30; la ejecución completa del runner duró 3,84 s y el tiempo reportado para las pruebas fue 1,18 s.

Como comprobación de que una prueba detecta una regresión, se cambió temporalmente el mínimo de título de 3 a 2 caracteres. La suite se puso roja; al restaurar el límite original, volvió a verde. El cambio temporal no quedó en el código.

## Auditoría manual

Revisé `/actividades`, `/actividades/1`, `/actividades/nueva`, `/estadisticas` y `/sugerencias`.

- Cada pantalla muestra un solo `h1` y la jerarquía observada continúa desde `h1` a `h2`; en la lista y sugerencias sigue con `h3`/`h4` sin saltos.
- A 320 px no observé desplazamiento horizontal en esas rutas.
- Con Tab, los controles alcanzables conservaron un indicador de foco visible y siguieron el orden de lectura. En el formulario, `ArrowRight` movió la selección del radio «Baja» a «Media».
- Los estados de las actividades incluyen etiquetas textuales; la selección y las acciones de tarjeta tienen nombres accesibles.

**Hallazgo que impide completar el recorrido del detalle:** el servidor local entrega los `id` como cadenas (`"1"`, `"2"`, `"3"`), mientras `ActividadesApi` los declara y usa como números. Al abrir `/actividades/1`, la aplicación muestra «Esa actividad no existe o se eliminó», aunque ese registro aparece en `/actividades`. No se corrigió en este módulo porque la práctica pide registrar los hallazgos, no modificar la aplicación.

## Límites y asuntos pendientes

- No hay autenticación ni autorización: quien accede a la aplicación puede ver y modificar los datos.
- La validación del navegador mejora la experiencia, pero no protege los datos del servidor.
- `localStorage` aún aparece como alternativa cuando falla la carga HTTP; no desapareció por completo en el módulo 9. No está cifrado y es accesible para scripts de la página.
- `avanzarEstado()` solo cambia el estado local; no envía un `PUT`, así que el cambio no queda persistido en el servidor.
- Si falla un `DELETE`, el servicio muestra un aviso, pero no restaura la actividad retirada de la lista.
- `mensajeDe()` devuelve un mensaje genérico para `HttpErrorResponse`, no una explicación específica del estado HTTP.

Estos son hallazgos para trabajo posterior, no cambios de implementación de esta práctica.

## Build y tamaño

`npm run build` terminó sin errores:

- Paquete inicial: **331,45 kB raw**, **88,37 kB** de transferencia estimada.
- Tres chunks diferidos: `formulario-actividad` (68,15 kB), `pagina-estadisticas` (3,08 kB) y `pagina-sugerencias` (2,50 kB).
