# 🐟 NaturaPiscis Backend API

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D15-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Backend API RESTful para NaturaPiscis**  
Sistema de comercialización de productos acuícolas con IoT integrado

[Características](#-características) •
[Instalación](#-instalación) •
[Uso](#-uso) •
[API Docs](#-api-endpoints) •
[Arquitectura](#-arquitectura)

</div>

---

## 📋 Tabla de Contenidos

- [Acerca del Proyecto](#-acerca-del-proyecto)
- [Características](#-características)
- [Tecnologías](#️-tecnologías)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Scripts](#-scripts)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🎯 Acerca del Proyecto

NaturaPiscis es una plataforma integral que conecta productores acuícolas con consumidores finales, integrando:

- 🛒 **E-commerce** - Compra/venta de productos acuícolas
- 🔐 **Autenticación** - Sistema seguro con JWT y roles
- 📊 **IoT** - Monitoreo en tiempo real de estanques con sensores
- 📦 **Gestión de Pedidos** - Sistema completo de órdenes
- 👥 **Multi-rol** - Admins, Productores y Consumidores

---

## ✨ Características

### 🏗️ **Arquitectura Profesional**
- ✅ **MVC + Clean Architecture** - Código organizado en capas
- ✅ **Modular** - Cada feature en su propio módulo
- ✅ **Escalable** - Fácil agregar nuevas funcionalidades
- ✅ **Mantenible** - Archivos pequeños y enfocados

### 🔒 **Seguridad Avanzada**
- ✅ **JWT Authentication** - Tokens seguros con expiración
- ✅ **Role-based Access Control** - Admin, Productor, Consumidor
- ✅ **Rate Limiting** - Protección contra ataques
- ✅ **Helmet** - Headers de seguridad HTTP
- ✅ **Input Validation** - Express-validator
- ✅ **Password Hashing** - bcryptjs

### 📊 **Features del Sistema**
- ✅ **Paginación** - En todas las listas
- ✅ **Búsqueda y Filtros** - Por categoría, precio, nombre
- ✅ **Logging Profesional** - Winston con múltiples niveles
- ✅ **Manejo de Errores** - Centralizado y consistente
- ✅ **CORS Configurado** - Para frontend seguro
- ✅ **API Responses Estandarizadas** - Formato consistente

### 🌐 **Módulos Implementados**
- ✅ **Productos** - CRUD completo con características
- 🔄 **Auth** - Login, registro, verificación
- 🔄 **Usuarios** - Gestión de perfiles
- 🔄 **Productores** - Perfiles de productores
- 🔄 **Pedidos** - Sistema de órdenes
- 🔄 **Carrito** - Gestión de carrito de compras
- 🔄 **Sensores IoT** - Datos de estanques
- 🔄 **Notificaciones** - Sistema push

---

## 🛠️ Tecnologías

| Categoría | Tecnología | Versión | Propósito |
|-----------|-----------|---------|-----------|
| **Runtime** | Node.js | ≥18.0.0 | JavaScript backend |
| **Framework** | Express.js | 4.18.2 | Web framework |
| **Base de Datos** | PostgreSQL | ≥15 | Database relacional |
| **Autenticación** | JWT | 9.0.2 | Tokens seguros |
| **Validación** | Express-validator | 7.0.1 | Input validation |
| **Logging** | Winston | 3.11.0 | Sistema de logs |
| **Seguridad** | Helmet | 7.1.0 | HTTP headers |
| **Rate Limiting** | express-rate-limit | 7.1.5 | API protection |
| **Password** | bcryptjs | 2.4.3 | Hash passwords |
| **Testing** | Jest | 29.7.0 | Unit/Integration tests |
| **Code Quality** | ESLint + Prettier | latest | Linting y formatting |

---

## 🏛️ Arquitectura

### **Clean Architecture + MVC**

```
┌─────────────────────────────────────────────┐
│              HTTP REQUEST                    │
└──────────────────┬──────────────────────────┘
                   │
          ┌────────▼────────┐
          │     ROUTES      │  ← Define rutas y middlewares
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │   CONTROLLER    │  ← Maneja HTTP (req/res)
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │    SERVICE      │  ← Lógica de negocio
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │   REPOSITORY    │  ← Acceso a datos (SQL)
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │    DATABASE     │  ← PostgreSQL
          └─────────────────┘
```

### **Separación de Responsabilidades**

- **Routes** - Define endpoints y aplica middlewares
- **Controller** - Extrae datos del request, llama al service
- **Service** - Contiene la lógica de negocio y validaciones
- **Repository** - Maneja queries SQL y acceso a datos
- **Middlewares** - Autenticación, validación, logging
- **Utils** - Funciones reutilizables

---

## 🚀 Instalación

### **Prerrequisitos**

Asegúrate de tener instalado:

- **Node.js** ≥ 18.0.0 ([Descargar](https://nodejs.org/))
- **PostgreSQL** ≥ 15 ([Descargar](https://www.postgresql.org/download/))
- **npm** ≥ 9.0.0 (viene con Node.js)
- **Git** (opcional)

### **Paso 1: Clonar el repositorio**

```bash
git clone https://github.com/naturapiscis/backend.git
cd backend
```

O si lo descargaste como ZIP, extráelo y navega a la carpeta.

### **Paso 2: Instalar dependencias**

```bash
npm install
```

Esto instalará todas las dependencias listadas en `package.json`:
- express, pg, jsonwebtoken, bcryptjs
- helmet, cors, winston, express-validator
- Y más...

### **Paso 3: Configurar variables de entorno**

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar con tu editor favorito
nano .env
# o
code .env
# o
vim .env
```

**Configurar las variables críticas:**

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=naturapiscis
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_AQUÍ

# JWT (IMPORTANTE: cambiar por una clave segura)
JWT_SECRET=una_clave_super_larga_y_segura_aquí

# Puerto
PORT=3001

# CORS (URL de tu frontend)
CORS_ORIGIN=http://localhost:5173
```

### **Paso 4: Configurar la base de datos**

**Opción A: Usando psql**

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE naturapiscis;

# Conectarse a la base de datos
\c naturapiscis

# Ejecutar schema
\i /ruta/a/tu/schema.sql

# Ejecutar datos de ejemplo
\i /ruta/a/tu/sample_data.sql

# Salir
\q
```

**Opción B: Usando pgAdmin**

1. Abrir pgAdmin
2. Crear nueva base de datos "naturapiscis"
3. Abrir Query Tool
4. Ejecutar `schema.sql`
5. Ejecutar `sample_data.sql`

### **Paso 5: Iniciar el servidor**

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

Verás algo como:

```
╔════════════════════════════════════════════════╗
║   🐟 NATURAPISCIS API - SERVIDOR INICIADO 🐟   ║
╠════════════════════════════════════════════════╣
║  Entorno: development                          ║
║  Puerto: 3001                                  ║
║  URL: http://localhost:3001                    ║
╚════════════════════════════════════════════════╝

✅ Conexión a PostgreSQL exitosa
```

---

## ⚙️ Configuración

### **Variables de Entorno Importantes**

| Variable | Descripción | Ejemplo | Requerido |
|----------|-------------|---------|-----------|
| `NODE_ENV` | Entorno de ejecución | `development` | No |
| `PORT` | Puerto del servidor | `3001` | No |
| `DB_HOST` | Host de PostgreSQL | `localhost` | Sí |
| `DB_PORT` | Puerto de PostgreSQL | `5432` | Sí |
| `DB_NAME` | Nombre de la BD | `naturapiscis` | Sí |
| `DB_USER` | Usuario de PostgreSQL | `postgres` | Sí |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `mipassword` | Sí |
| `JWT_SECRET` | Secret para JWT | `clave_larga_segura` | Sí |
| `CORS_ORIGIN` | Orígenes permitidos | `http://localhost:5173` | Sí |

**Ver `.env.example` para la lista completa.**

---

## 📖 Uso

### **Estructura de una Respuesta Exitosa**

```json
{
  "success": true,
  "message": "Productos obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "nombre": "Tilapia Fresca",
      "precio": 25.00,
      "stock": 100
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **Estructura de una Respuesta de Error**

```json
{
  "success": false,
  "message": "Error de validación",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔌 API Endpoints

### **Autenticación**

```http
POST   /api/auth/registro       # Registrar nuevo usuario
POST   /api/auth/login          # Iniciar sesión
GET    /api/auth/verificar      # Verificar token JWT
POST   /api/auth/logout         # Cerrar sesión
```

### **Productos**

```http
# Públicas
GET    /api/productos                     # Listar productos (paginado)
GET    /api/productos/destacados          # Productos destacados
GET    /api/productos/buscar?q=tilapia    # Buscar productos
GET    /api/productos/:id                 # Detalle de producto

# Protegidas (requiere auth + rol productor)
GET    /api/productos/productor/mis-productos  # Mis productos
POST   /api/productos                          # Crear producto
PUT    /api/productos/:id                      # Actualizar producto
DELETE /api/productos/:id                      # Eliminar producto
```

### **Ejemplo de Uso con cURL**

**Obtener productos:**

```bash
curl http://localhost:3001/api/productos
```

**Buscar productos:**

```bash
curl "http://localhost:3001/api/productos/buscar?q=tilapia"
```

**Login:**

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "productor@test.com",
    "password": "password123"
  }'
```

**Crear producto (requiere token):**

```bash
curl -X POST http://localhost:3001/api/productos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "nombre": "Tilapia Fresca",
    "descripcion": "Tilapia de 500g",
    "precio": 25.00,
    "stock": 100,
    "categoria_id": 1
  }'
```

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration

# Ver cobertura de código
npm test -- --coverage
```

---

## 📜 Scripts

```bash
npm start              # Iniciar servidor (producción)
npm run dev            # Iniciar con nodemon (desarrollo)
npm run dev:debug      # Iniciar con debugger
npm test               # Ejecutar tests
npm run test:watch     # Tests en modo watch
npm run lint           # Revisar código (ESLint)
npm run lint:fix       # Corregir errores de linting
npm run format         # Formatear código (Prettier)
npm run logs:clear     # Limpiar archivos de log
```

---

## 📁 Estructura del Proyecto

```
naturapiscis-backend/
├── src/
│   ├── config/              # Configuraciones
│   ├── constants/           # Constantes
│   ├── middlewares/         # Middlewares globales
│   ├── modules/             # Módulos por feature
│   │   └── productos/       # Ejemplo completo
│   ├── utils/               # Utilidades
│   ├── routes/              # Router principal
│   ├── app.js               # Express config
│   └── server.js            # Entry point
├── tests/                   # Tests
├── logs/                    # Logs
├── uploads/                 # Archivos subidos
├── docs/                    # Documentación
├── .env.example             # Ejemplo de variables
├── .gitignore               # Git ignore
├── package.json             # Dependencias
└── README.md                # Este archivo
```

**Ver `docs/ARQUITECTURA_RESUMEN.md` para más detalles.**

---

## 👥 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### **Convenciones de Código**

- Usar camelCase para variables y funciones
- Usar PascalCase para clases
- Siempre usar async/await (no callbacks)
- Comentar código complejo
- Escribir tests para nuevas features
- Seguir ESLint y Prettier configurados

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

---

## 📧 Contacto

- **Website:** [https://naturapiscis.com](https://naturapiscis.com)
- **Email:** soporte@naturapiscis.com
- **GitHub:** [https://github.com/naturapiscis](https://github.com/naturapiscis)

---

## 🙏 Agradecimientos

- Universidad Franz Tamayo
- Equipo de desarrollo de NaturaPiscis
- Comunidad de Open Source

---

<div align="center">

**Desarrollado con ❤️ por el equipo de NaturaPiscis**

⭐ Si te gusta el proyecto, dale una estrella en GitHub

</div>