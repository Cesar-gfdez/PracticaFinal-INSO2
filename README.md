# Matchitos

**Matchitos** es una plataforma web para la gestión de torneos competitivos online. Permite a los usuarios crear torneos, apuntarse, reportar resultados y consultar rankings en tiempo real, todo a través de una interfaz moderna y sencilla.

## Tecnologías utilizadas

* Frontend: Next.js 15, React, Tailwind CSS
* Backend: Go (Gin), PostgreSQL
* WebSockets: Notificaciones en tiempo real
* Despliegue: Render (backend), Vercel (frontend)

## Funcionalidades

* Autenticación con Discord
* Creación, edición y eliminación de torneos
* Inscripción y baja en torneos
* Generación automática de brackets
* Reporte de resultados (con subida opcional de capturas)
* Avance automático de rondas
* Notificaciones en tiempo real (WebSocket)
* Rankings globales
* Historial de torneos y matches por usuario
* Perfil de usuario con redes sociales

## Instalación y ejecución local

### Requisitos previos

* Go >= 1.20
* Node.js >= 18
* PostgreSQL >= 13

### Clonar el repositorio

```bash
git clone https://github.com/tu_usuario/tu_repositorio.git
cd tu_repositorio
```

### Configuración del Backend (Go)

```bash
cd torneos-backend
cp .env.example .env
# Editar el .env con tus variables (DB_URL, OAUTH_CONFIG, FRONTEND_URL, etc)

# Instalar dependencias
go mod tidy

# Ejecutar migraciones (si procede)

# Ejecutar el servidor local
go run main.go
```

### Configuración del Frontend (Next.js)

```bash
cd torneos-frontend
cp .env.local.example .env.local
# Editar NEXT_PUBLIC_BACKEND_URL apuntando al backend local (por ejemplo: http://localhost:8080)

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

Accede en [http://localhost:3000](http://localhost:3000)

## Despliegue en producción

### Backend (Render)

1. Crear servicio web en [https://render.com](https://render.com)
2. Seleccionar repo de `torneos-backend`
3. Configurar variables de entorno:

   * `DB_URL`
   * `OAUTH_CONFIG`
   * `FRONTEND_URL` → URL pública de Vercel
4. Deploy automático

### Frontend (Vercel)

1. Crear proyecto en [https://vercel.com](https://vercel.com)
2. Seleccionar repo de `torneos-frontend`
3. Configurar variable:

   * `NEXT_PUBLIC_BACKEND_URL` → URL pública del backend en Render (por ejemplo `https://practicafinal-inso2.onrender.com`)
4. Deploy automático

## Estructura del proyecto

```plaintext
/torneos-backend
├── main.go
├── models/
├── database/
└── routes/

└── /torneos-frontend
    ├── src/app/
    ├── src/components/
    ├── src/lib/
    ├── src/store/
    └── public/images/
```

## Créditos

Proyecto desarrollado por:

* Guillermo
* Kevin
* César

Universidad de Zaragoza - Grado en Ingeniería Informática
Proyecto Final de la asignatura INSO 2
