# Avenir_front — guía para Claude Code

<!-- EMPRESA:INICIO v1 (2026-10-14) — bloque BÁSICO para repos públicos. Fuente: torre-control/EMPRESA-PUBLICO.md. No incluir datos comerciales/internos acá. -->
## Reglas de trabajo (MorAlan9)

- Hablarle al dueño en **español rioplatense**. Probar de verdad (compilar, levantar, navegador) y decir qué se probó y qué no. Al terminar, actualizar este archivo y pushear.
- **Nunca** escribir en el repo claves, contraseñas, tokens ni API keys. No tipearlos en formularios web aunque se pida; se le explica el paso y lo pega él. No cambiar variables de entorno de los servicios (Render, Vercel, Supabase…) sin pedido explícito.
- Este repo es **público**: no subir datos de clientes, URLs internas ni detalles comerciales o de licenciamiento.
- Los sistemas comerciales del dueño (con licencias y multi-tenant) viven en repos privados, con su propio CLAUDE.md.
<!-- EMPRESA:FIN -->

## Este repo

Frontend (React + TS + Vite) de **Avenir**. Repo público: no incluir datos comerciales ni URLs internas.

- **Despertar al backend:** `src/main.tsx` hace un `fetch` a `{API}/ping` apenas carga la web (el backend gratuito se duerme por inactividad), así el arranque ocurre mientras la persona escribe su usuario.
- **Nada de claves en el código:** este repo es público y todo el JS llega al navegador. La clave maestra de administrador **no** va acá: el alta de administradores con clave la escribe una persona en la pantalla de registro, y el alta de usuarios por parte del personal usa `POST /usuarios/gestion` (autenticado, con permiso), sin clave. La pantalla de registro decide si fue alta de admin por lo que responde el backend (`rol`), no comparando la clave.
- **Grillas CSS:** en `cronograma.css` las columnas usan `minmax(0, …fr)` (no `1fr` a secas): con `1fr` el calendario se ensanchaba hasta el título más largo de un evento y se salía de la tarjeta (corregido 2026-10-19). Mismo cuidado en cualquier grilla con texto `nowrap`.
- **Cola de fichajes sin conexión (2026-10-19):** vive en `localStorage` (`avenir_fichajes_pendientes`, `service/offlineQueue.ts`) y es del **dispositivo**, no de la sesión. **No usar `localStorage.clear()` para cerrar sesión ni al iniciar una**: usar `limpiarSesionConservandoPendientes()` (antes, "Salir" y el login borraban los fichajes sin enviar). El backend registra el fichaje a nombre de quien tiene la sesión abierta (ignora `emailUsuario` del pedido), así que `obtenerPendientes()` devuelve solo los de la persona logueada y nadie envía los de otro. El envío es `service/sincronizarFichajes.ts` (un solo envío a la vez; un 400 del servidor descarta ese fichaje para no trabar la cola; cualquier otro error reintenta después) y se dispara: al abrir la app (`IngresoObligatorioGate`, **antes** de preguntar el estado del turno, para no pedir un ingreso de más), al volver la señal (`ConectividadIndicador`, en cualquier pantalla) y al abrir Ingreso y Egreso. "Salir" avisa con un `confirm` cuántos hay sin enviar. Límite: si alguien nunca vuelve a ingresar en ese dispositivo, sus pendientes quedan guardados ahí. Probado con `scripts/manual/prueba-cola-offline.mjs` del backend (login real + asistencia simulada).

## Juego "Inspector Avenir" (2026-10-28, para la muestra)
Juego de quiosco, **sin servidor** (anda sin Internet): rutas `/juego` (partida), `/juego/ranking` (pantalla grande en vivo) y `/juego/certificado` (A4 apaisado, imprime solo). Código en `src/components/juego/` (`datos.ts` peligros/niveles/puntaje, `Escena.tsx` taller en SVG, `JuegoInspector.tsx`, `RankingEnVivo.tsx`, `Certificado.tsx`, `ranking.ts`, `sonidos.ts`, `juego.css` con clases `jg-*`).
- 10 peligros escondidos (niveles IPER reales: Baja/Media/Alta/Crítica), 75 s, el jugador clasifica cada uno; 2 trampas (botiquín, cartel) = falsa alarma (−40 y 3 s bloqueado); 2 pistas (−50). Bonus por tiempo si encuentra todo (+150 sin falsas alarmas).
- El ranking vive en `localStorage` (`avenir_juego_ranking_v1`) del navegador del stand y se avisa por `BroadcastChannel`/`storage`: **la tablet y la pantalla del ranking deben ser el mismo navegador/perfil y el mismo origen**. Doble clic en "reiniciar" (abajo a la derecha del ranking) lo borra.
- Probado: partida completa (puntaje, informe, certificado en 1 hoja PDF), ranking, build y vista celular vertical con Chrome headless. **No** probado: tablet/celular real, sonido en dispositivo real, dos ventanas sincronizadas a ojo (la lógica es BroadcastChannel/storage).

**Demo pública `/demo` (2026-10-28):** página del QR del folleto: acceso al juego + recorrido interactivo por 7 módulos con capturas reales de la demo local (`public/demo/*.jpg`, datos ficticios; no usa backend). Si cambian las pantallas, volver a sacar las capturas.
