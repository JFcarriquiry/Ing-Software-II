# Restaurant Reservations – Full‑Stack Project (Uruguay)

> **Stack**: Node.js + Express · PostgreSQL · React + Vite · Google Maps · Socket.io · Docker Compose

## Instrucciones completas para ejecutar el proyecto localmente

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd restaurant_reservations
```

### 2. Instalar Docker y Docker Compose

Este proyecto utiliza Docker para facilitar la configuración. Descarga e instala:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Asegúrate de que Docker esté funcionando antes de continuar.

### 3. Crear los archivos de entorno `.env`

Los archivos `.env` contienen variables sensibles y NO están incluidos en el repositorio. Debes crearlos manualmente:

#### backend/.env
Crea el archivo `backend/.env` con el siguiente contenido (reemplaza los valores según corresponda):

```
DATABASE_URL=postgres://postgres:postgres@db:5432/reservations
JWT_SECRET=tu_secreto_jwt
GOOGLE_CLIENT_ID=tu_client_id_google
GOOGLE_CLIENT_SECRET=tu_client_secret_google
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
PORT=3001

# SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_o_app_password
SMTP_FROM="Tu Nombre <tu_email@gmail.com>"
```

- Para obtener `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`, crea credenciales OAuth 2.0 en [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
- `JWT_SECRET` puede ser cualquier string aleatorio.

#### frontend/.env
Crea el archivo `frontend/.env` con el siguiente contenido:

```
VITE_GMAPS_KEY=tu_api_key_de_google_maps
```

- Obtén la API key de Google Maps en [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

### 4. Instalar dependencias (opcional, solo si quieres correr sin Docker)

Si prefieres correr el backend o frontend fuera de Docker, instala las dependencias manualmente:

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 5. Levantar el proyecto con Docker Compose

Desde la raíz del proyecto:

```bash
docker-compose up --build
```

Esto creará y levantará todos los servicios:
- Backend (API + WebSocket): http://localhost:3001
- Frontend (React): http://localhost:5173
- Base de datos PostgreSQL
- pgAdmin: http://localhost:5050 (usuario `admin@pg.com`, pass `admin`)

### 6. Acceso a la aplicación

- Frontend: http://localhost:5173
- API + WebSocket: http://localhost:3001
- pgAdmin: http://localhost:5050

### 7. Notas sobre archivos ignorados (`.gitignore`)
- Los archivos `.env`, `node_modules/`, `logs/`, y carpetas de configuración/editor no estarán presentes al clonar el repo.
- Debes crear los `.env` manualmente (ver paso 3).
- Las carpetas `node_modules/` se generan automáticamente al correr `npm install` (o al usar Docker).

### 8. Estructura de carpetas
```
backend/   → API, autenticación Google, websockets, SQL
frontend/  → React app con mapa y reservas en tiempo real
docker-compose.yml  → orquesta DB, API, frontend, pgAdmin
```

---

## Arranque rápido (dev)

```bash
# 1. Clonar este repo
git clone <url>
cd restaurant-reservations

# 2. Crear archivo .env (ver instrucciones arriba)
# Completar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET con credenciales OAuth 2.0
# Obtener API key de Google Maps y añadirla en frontend/.env: VITE_GMAPS_KEY=***

# 3. Levantar todo con Docker
docker-compose up --build
```

## Roadmap sugerido
1. **Sprint 1** – Mapa con markers desde DB ✔️  
2. **Sprint 2** – Crear reservas, actualizaciones en vivo via socket.io  
3. **Sprint 3** – Panel admin p/ restaurantes, ratings y fotos  
4. **Sprint 4** – Notificaciones e‑mail / push, refinamiento UI, deploy
