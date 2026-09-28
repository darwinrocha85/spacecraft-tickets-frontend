# spacecraft-tickets-frontend

Tienda pública de entradas: compra para naves-museo (por franja horaria) y naves-teatro
(asientos numerados), con cobro real vía BankIn y una sección "Mis entradas" para buscar,
cancelar o reprogramar.

## Stack
React 18 + Vite 5, Axios, mismo tema visual que el panel admin. Firebase Hosting (multi-site).

## Cómo correr en local
```powershell
npm.cmd install
Copy-Item .env.example .env.development
npm.cmd run dev
```
Abre `http://localhost:5174`. Necesita `spacecraftSystem` (8080) corriendo.

## Variables de entorno
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL de `spacecraftSystem` |

## Build y deploy
Sitio propio (`tickets`) dentro del mismo proyecto de Firebase que el panel admin:
```bash
npm run build
firebase deploy --project spacecraft-system --only hosting:tickets
```

## Repos relacionados
Backend: [spacecraftSystem](https://github.com/darwinrocha85/spacecraftSystem). Panel admin:
[spacecraftSystem-frontend](https://github.com/darwinrocha85/spacecraftSystem-frontend).
