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

- Para obtener `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`, crea credenciales OAuth 2.0 en [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Estas claves permiten a tu aplicación autenticar usuarios a través de Google.
- `GOOGLE_CALLBACK_URL` es la URL a la que Google redirigirá después de una autenticación exitosa. Debe coincidir con la configurada en Google Cloud Console.
- `JWT_SECRET` puede ser cualquier string aleatorio seguro. Se utiliza para firmar y verificar los JSON Web Tokens (JWT) para la autenticación basada en tokens.
- `DATABASE_URL` es la cadena de conexión para tu base de datos PostgreSQL.
- `PORT` es el puerto en el que se ejecutará el servidor backend.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` son configuraciones para el envío de correos electrónicos a través de un servidor SMTP (por ejemplo, para notificaciones). `SMTP_PASS` podría ser una contraseña de aplicación si usas Gmail con 2FA.

#### frontend/.env
Crea el archivo `frontend/.env` con el siguiente contenido:

```
VITE_GMAPS_KEY=tu_api_key_de_google_maps
```

- Obtén la API key de Google Maps en [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Esta clave es necesaria para mostrar mapas de Google Maps en el frontend. Asegúrate de restringir la clave API para evitar el uso no autorizado.

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

### 7. Ejecutar Pruebas

Para ejecutar las pruebas automatizadas del backend (asumiendo que tienes un script `test` en `backend/package.json`):

```bash
cd backend
npm install # Si aún no lo has hecho y no usas Docker para pruebas
npm test
```

### 8. Notas sobre archivos ignorados (`.gitignore`)
- Los archivos `.env`, `node_modules/`, `logs/`, y carpetas de configuración/editor no estarán presentes al clonar el repo.
- Debes crear los `.env` manualmente (ver paso 3).
- Las carpetas `node_modules/` se generan automáticamente al correr `npm install` (o al usar Docker).

### 9. Estructura de carpetas
```
backend/                → Contiene la lógica del servidor Node.js + Express.
├── src/
│   ├── controllers/    → Manejadores de lógica para las rutas (ej. reservations.controller.ts).
│   ├── db.ts           → Configuración de la conexión a la base de datos PostgreSQL.
│   ├── index.ts        → Punto de entrada principal del servidor backend.
│   ├── routes/         → Definición de las rutas de la API (ej. auth.ts, reservations.ts).
│   ├── sockets/        → Lógica para WebSockets (ej. occupancySocket.ts para actualizaciones en tiempo real).
│   ├── types/          → Definiciones de tipos TypeScript personalizadas.
│   └── utils/          → Utilidades compartidas (ej. auth.ts para autenticación, mailer.ts para envío de correos).
├── Dockerfile          → Define el entorno Docker para el backend.
├── jest.config.js      → Configuración para el framework de pruebas Jest.
├── package.json        → Dependencias y scripts del backend.
├── schema.sql          → Esquema SQL para la creación inicial de tablas en la base de datos.
├── seed.sql            → Script SQL para poblar la base de datos con datos iniciales.
└── test/               → Contiene los archivos de pruebas (ej. restaurants.test.ts).

frontend/               → Contiene la aplicación cliente React + Vite.
├
├── src/
│   ├── assets/         → (Si mueves `img/` aquí, sería más convencional para Vite/React)
│   ├── components/     → Componentes reutilizables de React (ej. LoginButton.tsx, Map.tsx).
│   ├── hooks/          → Hooks personalizados de React (ej. useAuth.ts, useSocket.ts).
│   ├── App.tsx         → Componente raíz de la aplicación React.
│   ├── main.tsx        → Punto de entrada de la aplicación React, donde se renderiza App.tsx.
│   └── theme/          → Configuración del tema de la interfaz (ej. temaPrincipal.ts).
├── index.html          → Archivo HTML principal que sirve como plantilla para la aplicación Vite.
├── package.json        → Dependencias y scripts del frontend.
└── vite.config.ts      → Archivo de configuración para Vite.

docker-compose.yml      → Orquesta los servicios de Docker (backend, frontend, base de datos, pgAdmin).
README.md               → Este archivo de documentación.
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

## Roadmap planificado
1. **Sprint 1** – Mapa con markers desde DB ✔️  
2. **Sprint 2** – Crear reservas, actualizaciones en vivo via socket.io  
3. **Sprint 3** – Panel admin p/ restaurantes, ratings y fotos  
4. **Sprint 4** – Notificaciones e‑mail / push, refinamiento UI, deploy
