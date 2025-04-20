# Restaurant Reservations – Full‑Stack Project (Uruguay)

> **Stack**: Node.js + Express · PostgreSQL · React + Vite · Google Maps · Socket.io · Docker Compose

## Arranque rápido (dev)

```bash
# 1. Clonar este repo
git clone <url>
cd restaurant-reservations

# 2. Crear archivo .env
cp backend/.env.example backend/.env
# Completar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET con credenciales OAuth 2.0
# Obtener API key de Google Maps y añadirla en frontend/.env: VITE_GMAPS_KEY=***

# 3. Levantar todo con Docker
docker-compose up --build
```

Accesos:
- Frontend: <http://localhost:5173>
- API + WebSocket: <http://localhost:3001>
- pgAdmin: <http://localhost:5050> (usuario `admin@pg.com`, pass `admin`)

## Estructura de carpetas
```
backend/   → API, autenticación Google, websockets, SQL
frontend/  → React app con mapa y reservas en tiempo real
docker-compose.yml  → orquesta DB, API, frontend, pgAdmin
```

## Roadmap sugerido
1. **Sprint 1** – Mapa con markers desde DB ✔️  
2. **Sprint 2** – Crear reservas, actualizaciones en vivo via socket.io  
3. **Sprint 3** – Panel admin p/ restaurantes, ratings y fotos  
4. **Sprint 4** – Notificaciones e‑mail / push, refinamiento UI, deploy

¡Listo para codear!
