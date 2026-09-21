# spacecraft-tickets-frontend (tienda) — AGENTS.md

> Proyecto independiente. Abrir opencode con cwd en `spacecraft-tickets-frontend/`, nunca en `Projects/`.
> Stack: React 18.3 + Vite 5 + Axios. Tienda pública de entradas (museo por franja, teatro con asientos).

## Cómo correr
- `npm.cmd install`, copiar `.env.example` a `.env`, `npm.cmd run dev` → `:5174` (sin colisiones)
- Backend flota en local: `http://localhost:8080/api`
- Sin `run-*.ps1` en este repo

## Contrato API
- `VITE_API_URL` por env (dev `localhost:8080/api`); en prod fallback en código a
  `https://spacecraftsystem.onrender.com/api`. No romper ese fallback.
- El cobro va vía backend (nunca llamar a BankIn desde el frontend).
- Pendiente conocido: el checkout aún no pide número de tarjeta BankIn
  (ver `BANKIN-INTEGRATION.md` canónico en `Bankin/docs/`, paso 1).

## Deploy
- Multi-site `spacecraft-system`, target `tickets`:
  `npm.cmd run build` + `firebase.cmd deploy --project spacecraft-system --only hosting:tickets`
- URL: `spacecraft-tickets.web.app`

## No hacer
- No hardcodear URLs. No commitear `.env`, `node_modules/`, `dist/`.
- No confirmar entradas sin `201` del backend (el cobro lo valida el servidor).
