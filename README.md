# Calendar PWA

Versión **Progressive Web App** de una aplicación de calendario hecha con **React 19 + Create React App + Redux**. Además del login, el registro y el CRUD de eventos sobre **react-big-calendar**, incorpora un **service worker de Workbox** que precachea la app, aplica estrategias de caché a la API y a los CDN, y **guarda las peticiones hechas sin conexión** (crear, editar o borrar eventos) para reenviarlas con **Background Sync** cuando vuelve la red.

![Tech](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tech](https://img.shields.io/badge/Create_React_App-5-09D3AC?logo=createreactapp)
![Tech](https://img.shields.io/badge/Redux-Thunk-764ABC?logo=redux)
![Tech](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter)
![Tech](https://img.shields.io/badge/Workbox-6-FF6F00?logo=googlechrome)
![Tech](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa)
![Tech](https://img.shields.io/badge/Bootstrap-4.5-7952B3?logo=bootstrap)

---

## Tabla de contenidos

- [Calendar PWA](#calendar-pwa)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [Qué hace el proyecto](#qué-hace-el-proyecto)
  - [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
    - [Requisitos](#requisitos)
    - [Instalación](#instalación)
    - [Variables de entorno](#variables-de-entorno)
    - [Scripts](#scripts)
    - [Generar la PWA](#generar-la-pwa)
  - [Uso](#uso)
  - [Cómo funciona](#cómo-funciona)
    - [1. Router (`src/router/AppRouter.js`)](#1-router-srcrouterapprouterjs)
    - [2. Peticiones (`src/helpers/fetch.js`)](#2-peticiones-srchelpersfetchjs)
    - [3. Acciones (`src/actions`)](#3-acciones-srcactions)
    - [4. Reducers y store](#4-reducers-y-store)
    - [5. Componentes (`src/components`)](#5-componentes-srccomponents)
    - [6. Service worker (`src/sw-template.js`)](#6-service-worker-srcsw-templatejs)
    - [Endpoints que consume](#endpoints-que-consume)
    - [Flujo de la aplicación](#flujo-de-la-aplicación)
  - [Tecnologías](#tecnologías)
  - [Estructura del proyecto](#estructura-del-proyecto)
  - [Personalización](#personalización)
  - [Licencia](#licencia)

---

## Qué hace el proyecto

- **Registro e inicio de sesión** contra una API REST con token JWT (cabecera `x-token`) guardado en `localStorage`.
- **Renovación del token** al arrancar (`auth/renew`) y rutas protegidas: `/login` para invitados y `/` para usuarios autenticados.
- **Calendario en español** con `react-big-calendar` y `moment` (vistas mes, semana, día y agenda); recuerda la última vista en `localStorage`.
- **Crear, editar y borrar eventos** desde un modal con `react-datetime-picker`; valida que la fecha de fin sea posterior a la de inicio y que el título tenga al menos 2 caracteres.
- **Eventos propios resaltados** en azul; los de otros usuarios, en gris.
- **Indicador Online / Offline** en la barra superior con `react-detect-offline`.
- **PWA**: `manifest.json`, service worker con precaché de los archivos del build y registro automático solo en producción.
- **Soporte offline**: `NetworkFirst` para `/api/auth/renew` y `/api/events`, `CacheFirst` para Bootstrap y Font Awesome, y cola de **Background Sync** (`posteos-offline`, retención de 24 h) para los `POST`, `PUT` y `DELETE` de eventos.

---

## Cómo ejecutar el proyecto

### Requisitos

- **Node.js** y **Yarn** (el repo incluye `yarn.lock`).
- Un **backend** compatible corriendo (ver [Endpoints que consume](#endpoints-que-consume)). Este repositorio contiene solo el _frontend_.
- **Workbox CLI** para generar el service worker: viene como `devDependency` (`workbox-cli`), así que `yarn install` ya lo instala.

### Instalación

```bash
yarn install
```

### Variables de entorno

Copia `.env.template` a `.env`:

```bash
REACT_APP_API_URL=http://localhost:4000/api
```

| Variable            | Descripción                                                     |
| ------------------- | --------------------------------------------------------------- |
| `REACT_APP_API_URL` | URL base de la API usada por `fetchSinToken`, `fetchConToken` y el service worker. |

### Scripts

| Comando      | Comando real               | Qué hace                                                       |
| ------------ | -------------------------- | -------------------------------------------------------------- |
| `yarn start` | `react-scripts start`      | Servidor de desarrollo en `http://localhost:3000`.             |
| `yarn build` | `react-scripts build`      | Build de producción en `build/`.                               |
| `yarn PWA`   | `workbox injectManifest`   | Genera `build/sw.js` a partir de `src/sw-template.js`.         |
| `yarn test`  | `react-scripts test`       | Jest en modo _watch_.                                          |
| `yarn eject` | `react-scripts eject`      | Expulsa la configuración de CRA (irreversible).                |

### Generar la PWA

El service worker solo existe después del build y solo se registra cuando `NODE_ENV` es `production`:

```bash
yarn build   # genera build/
yarn PWA     # inyecta el manifiesto de precaché y escribe build/sw.js
```

Después sirve la carpeta `build/` con cualquier servidor estático (por ejemplo `npx serve -s build`) para probar la instalación y el modo offline.

---

## Uso

| Acción                       | Cómo                                                          |
| ---------------------------- | ------------------------------------------------------------- |
| Registrarse / iniciar sesión | Formularios **Registro** e **Ingreso** en `/login`.           |
| Crear un evento              | Botón flotante **+** → rellenar el modal → **Guardar**.       |
| Editar un evento             | Seleccionarlo y hacer doble clic → modal **Editar evento**.   |
| Borrar un evento             | Seleccionarlo y pulsar **Borrar evento**.                     |
| Deseleccionar                | Clic en un hueco vacío del calendario.                        |
| Cerrar sesión                | Botón **Salir** de la barra superior.                         |

---

## Cómo funciona

### 1. Router (`src/router/AppRouter.js`)

Despacha `startChecking()` al montarse y muestra "Espere..." mientras `checking` es `true`. Después usa `BrowserRouter` y `Routes`: `/login` redirige a `/` si hay `uid`, y `/` redirige a `/login` si no lo hay; cualquier otra ruta va a `/`.

### 2. Peticiones (`src/helpers/fetch.js`)

- **`fetchSinToken`** — `fetch` a `${REACT_APP_API_URL}/${endpoint}` con cuerpo JSON (login y registro).
- **`fetchConToken`** — igual, añadiendo la cabecera `x-token` con el token de `localStorage`.

`prepareEvents` convierte `start` y `end` de cada evento a `Date` con `moment`.

### 3. Acciones (`src/actions`)

Acciones asíncronas (_thunks_):

- **`auth.js`** — `startLogin`, `startRegister`, `startChecking`, `startLogout`.
- **`events.js`** — `eventStartLoading`, `eventStartAddNew`, `eventStartUpdate`, `eventStartDelete`, además de `eventSetActive`, `eventClearActiveEvent` y `eventLogout`.
- **`ui.js`** — `uiOpenModal`, `uiCloseModal`.

Los tipos de acción están centralizados en `src/types/types.js`.

### 4. Reducers y store

`rootReducer` combina `uiReducer` (`modalOpen`), `calendarReducer` (`events`, `activeEvent`) y `authReducer` (`checking`, `uid`, `name`). `store.js` lo monta con `configureStore` de Redux Toolkit, con DevTools solo fuera de producción.

### 5. Componentes (`src/components`)

- **`auth/LoginScreen`** — formularios de ingreso y registro (con `useForm`), comprueba que las contraseñas coincidan.
- **`calendar/CalendarScreen`** — `<Calendar>` con `momentLocalizer`, mensajes en español y `eventStyleGetter`.
- **`calendar/CalendarModal`** — formulario de evento; decide entre crear o actualizar según haya `activeEvent`.
- **`calendar/CalendarEvent`** — título + nombre del autor.
- **`ui/Navbar`**, **`ui/AddNewFab`**, **`ui/DeleteEventFab`** — barra con estado de conexión y botones flotantes.

### 6. Service worker (`src/sw-template.js`)

`workbox-config.js` toma los archivos de `build/` (`json`, `ico`, `html`, `png`, `txt`, `css`, `js`) e inyecta su lista en `self.__WB_MANIFEST`. La plantilla carga Workbox 6.4.1 desde su CDN, lee la URL de la API del parámetro `apiUrl` con el que se registra y define:

- `precacheAndRoute` — precaché del build.
- `NetworkFirst` — `<ruta de la API>/auth/renew` y `<ruta de la API>/events` (`/api/...` con la URL por defecto).
- `CacheFirst` — CSS de Bootstrap 4.5 y Font Awesome 5.12.
- `NetworkOnly` + `BackgroundSyncPlugin('posteos-offline')` — `POST`, `PUT` y `DELETE` a `${REACT_APP_API_URL}/events`.

`public/index.html` registra `sw.js?apiUrl=%REACT_APP_API_URL%` solo si `%NODE_ENV%` es `production`; CRA sustituye la variable al hacer el build, de modo que la app y el service worker usan la misma URL.

### Endpoints que consume

| Método   | Ruta              | Uso                              |
| -------- | ----------------- | -------------------------------- |
| `POST`   | `/auth`           | Login (`email`, `password`).     |
| `POST`   | `/auth/new`       | Registro (`email`, `password`, `name`). |
| `GET`    | `/auth/renew`     | Renovar el token.                |
| `GET`    | `/events`         | Listar eventos (`eventos`).      |
| `POST`   | `/events`         | Crear evento.                    |
| `PUT`    | `/events/:id`     | Actualizar evento.               |
| `DELETE` | `/events/:id`     | Borrar evento.                   |

Las respuestas deben incluir `ok` (y `msg` en caso de error), tal como las leen las acciones.

### Flujo de la aplicación

```
index.js → CalendarApp (Provider store)
  └─ AppRouter
       ├─ startChecking() → GET auth/renew
       ├─ sin uid → LoginScreen → startLogin / startRegister
       └─ con uid → CalendarScreen
              ├─ eventStartLoading() → GET events → prepareEvents()
              ├─ AddNewFab → uiOpenModal → CalendarModal
              │                 ├─ nuevo   → eventStartAddNew  (POST)
              │                 └─ activo  → eventStartUpdate  (PUT)
              └─ DeleteEventFab → eventStartDelete (DELETE)

Service worker (producción)
  ├─ precaché del build
  ├─ GET api/events, api/auth/renew → NetworkFirst
  └─ POST/PUT/DELETE events sin red → cola "posteos-offline" → reintento al reconectar
```

---

## Tecnologías

- **React 19** con **Create React App** (`react-scripts` 5).
- **Redux** + **Redux Toolkit** (`configureStore`) + _thunks_.
- **React Router 7**.
- **react-big-calendar**, **react-datetime-picker**, **react-modal**, **moment**.
- **react-detect-offline** — estado de la conexión.
- **SweetAlert2** — alertas.
- **Workbox 6** — precaché, estrategias de caché y Background Sync.
- **Bootstrap 4.5** y **Font Awesome 5.12** vía CDN.

---

## Estructura del proyecto

```
pwa-web/
├── public/
│   ├── index.html          # CDN de estilos + registro del service worker
│   ├── manifest.json       # Manifiesto de la PWA
│   ├── favicon.ico, logo192.png, logo512.png
│   └── robots.txt
├── src/
│   ├── actions/            # auth.js, events.js, ui.js
│   ├── components/
│   │   ├── auth/           # LoginScreen.js + login.css
│   │   ├── calendar/       # CalendarScreen, CalendarModal, CalendarEvent
│   │   └── ui/             # Navbar, AddNewFab, DeleteEventFab
│   ├── helpers/            # fetch.js, prepareEvents.js, calendar-messages-es.js
│   ├── hooks/useForm.js
│   ├── reducers/           # authReducer, calendarReducer, uiReducer, rootReducer
│   ├── router/             # AppRouter.js
│   ├── store/store.js
│   ├── types/types.js
│   ├── CalendarApp.js
│   ├── index.js
│   ├── styles.css
│   └── sw-template.js      # Plantilla del service worker
├── .env.template
├── workbox-config.js
└── package.json
```

---

## Personalización

| Qué                               | Dónde                                    | Por defecto                     |
| --------------------------------- | ---------------------------------------- | ------------------------------- |
| URL de la API (app y service worker) | `REACT_APP_API_URL` en `.env`         | `http://localhost:4000/api`     |
| Rutas `NetworkFirst`              | `cacheNetworkFirst` en `sw-template.js`  | `auth/renew`, `events` bajo la ruta de la API |
| Recursos `CacheFirst`             | `cacheFirstNetwork` en `sw-template.js`  | Bootstrap 4.5, Font Awesome 5.12 |
| Retención de la cola offline      | `maxRetentionTime` (minutos)             | `24 * 60` (24 h)                |
| Archivos precacheados             | `globPatterns` en `workbox-config.js`    | `json, ico, html, png, txt, css, js` |
| Nombre y colores de la PWA        | `public/manifest.json`                   | Valores por defecto de CRA      |
| Vista inicial del calendario      | `lastView` en `CalendarScreen.js`        | `month`                         |

---

## Licencia

Proyecto de uso libre con fines educativos y de práctica.
