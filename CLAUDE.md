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
