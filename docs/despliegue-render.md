# Publicar la versión web en Render

Esta guía explica, paso a paso, cómo poner la web de Agendality en internet con **Render** (que aloja la página) y **Cloudflare** (que maneja el dominio `agendality.com`).

## Cómo funciona, en pocas palabras

- La web es un **sitio estático**: Render descarga el código de GitHub, ejecuta `npx expo export --platform web` y publica la carpeta `dist`.
- Toda la configuración está en el archivo `render.yaml`, en la raíz del proyecto. No hay que escribirla a mano en Render.
- La web es una aplicación de una sola página. Cualquier dirección (`/MI-NEGOCIO`, `/cliente`, `/panel`, `/pagar/...`) carga `index.html` y la app muestra la pantalla que corresponde. Por eso recargar la página no da error 404.
- La dirección del servidor (API) se escribe **al compilar**: `EXPO_PUBLIC_API_URL=https://api.agendality.com`. Si cambia, hay que volver a desplegar.
- No pongas claves secretas en `render.yaml` ni en variables `EXPO_PUBLIC_*`: todo lo que empieza por `EXPO_PUBLIC_` queda visible para cualquiera que abra la web.

## 1. Crear el sitio en Render

1. Sube la rama con `render.yaml` a GitHub y únela a `master`.
2. Entra a <https://dashboard.render.com> e inicia sesión con tu cuenta de GitHub.
3. Haz clic en **New** → **Blueprint**.
4. Elige el repositorio de la app. Render lee `render.yaml` y te muestra el sitio `agendality-web`.
5. Haz clic en **Apply** (o **Deploy Blueprint**). Render instala, compila y publica. Tarda unos minutos.
6. Cuando termine, abre la dirección que te da Render (algo como `https://agendality-web.onrender.com`) y revisa que se vea la página principal.

El despliegue automático está **apagado** (`autoDeployTrigger: "off"` en `render.yaml`): unir a `master` **no** publica nada. Tú decides cuándo publicar (ver "Desplegar a mano y revertir").

## 2. Conectar agendality.com y www en Cloudflare

`render.yaml` ya le dice a Render que el sitio usa `agendality.com` y `www.agendality.com`. Falta apuntar el dominio desde Cloudflare.

1. En Render, abre el sitio `agendality-web` → **Settings** → **Custom Domains**. Debes ver los dos dominios. Render te muestra a qué dirección deben apuntar (por ejemplo `agendality-web.onrender.com`).
2. En Cloudflare, abre el dominio `agendality.com` → **DNS** → **Records** y crea estos dos registros:

   | Tipo  | Nombre | Destino                         | Proxy                 |
   | ----- | ------ | ------------------------------- | --------------------- |
   | CNAME | `@`    | `agendality-web.onrender.com`   | Solo DNS (nube gris)  |
   | CNAME | `www`  | `agendality-web.onrender.com`   | Solo DNS (nube gris)  |

   Usa exactamente el destino que te muestra Render. Cloudflare permite un CNAME en `@` (lo convierte por dentro, se llama "CNAME flattening").
3. Deja la **nube gris** ("Solo DNS") al principio. Así Render puede verificar el dominio y crear el certificado HTTPS.
4. Vuelve a Render → **Custom Domains** y pulsa **Verify** en cada dominio. Cuando diga **Certificate issued**, ya funciona con `https://`.
5. (Opcional) Después puedes activar la **nube naranja** (proxy de Cloudflare). Si lo haces, en Cloudflare → **SSL/TLS** elige el modo **Full (strict)**. Nunca uses "Flexible": provoca redirecciones infinitas.
6. No borres el registro de `api.agendality.com`: ese es el backend y no cambia.

## 3. Revisar que todo esté bien

- `https://agendality.com` muestra la página principal.
- `https://www.agendality.com` también abre la web.
- Abre `https://agendality.com/cliente`, `https://agendality.com/login` y el código de un negocio (`https://agendality.com/CODIGO`) y **recarga la página** (F5): no debe salir error 404.
- Inicia sesión: si funciona, la web está hablando con `https://api.agendality.com`.

## Desplegar a mano y revertir

**Desplegar**

1. Une los cambios a `master`.
2. En Render abre el servicio → **Manual Deploy** → **Deploy latest commit**.
3. Espera a que el despliegue diga **Live** y revisa la web (sección 3).

**Revertir (Rollback)**

1. En Render abre el servicio → **Events** (o **Deploys**).
2. Busca el último despliegue que funcionaba y pulsa **Rollback**.
3. Render vuelve a publicar esa versión sin compilar de nuevo. Después corrige el error en `master` y despliega otra vez a mano.

Un Rollback solo devuelve el código. **No deshace cambios en la base de datos.**

**Copia de seguridad antes de migraciones (backend)**

Si el despliegue del backend trae migraciones, saca primero una copia de la base:

1. En Render abre la base PostgreSQL → **Recovery** (o **Backups**) y crea una copia manual / exportación, o desde tu PC:

   ```bash
   pg_dump "<URL externa de la base>" -Fc -f respaldo-AAAA-MM-DD.dump
   ```

2. Comprueba que el archivo existe y no está vacío. Guárdalo fuera del repositorio (no lo subas a GitHub).
3. Solo entonces despliega el backend con **Manual Deploy**.
4. Si la migración sale mal: haz Rollback del servicio y restaura la copia (`pg_restore --clean -d "<URL externa de la base>" respaldo-AAAA-MM-DD.dump`).

## Qué revisar si algo falla

**El despliegue falla en Render**

- Abre el sitio → **Events** o **Logs** y busca la primera línea roja.
- `npm ci` falla: `package-lock.json` no coincide con `package.json`. En tu PC ejecuta `npm install`, haz commit del `package-lock.json` y vuelve a subir.
- Error de versión de Node: la variable `NODE_VERSION` de `render.yaml` es `24`. Debe ser una versión que soporte Expo.
- Error de TypeScript o de importación: compila en tu PC con `npx expo export --platform web` para ver el mismo error.

**La página carga en blanco**

- Abre las herramientas del navegador (F12) → **Console** y mira el error.
- Revisa que **Publish Directory** sea `dist` (en `render.yaml`: `staticPublishPath: ./dist`).

**Sale "Sin conexión" o no deja iniciar sesión**

- Comprueba que `https://api.agendality.com` responde.
- El backend debe permitir peticiones (CORS) desde la web: en el servidor del backend, la variable `CORS_ORIGINS` debe incluir `https://agendality.com,https://www.agendality.com`. Si la abriste en `onrender.com`, agrega también esa dirección.
- Si cambiaste `EXPO_PUBLIC_API_URL`, vuelve a desplegar: el valor se guarda al compilar. En Render usa **Manual Deploy** → **Clear build cache & deploy**.

**Error 404 al recargar una página**

- Revisa en Render → **Redirects/Rewrites** que exista la regla `/*` → `/index.html` de tipo **Rewrite**.

**El dominio no verifica o sale error de certificado**

- Los registros de Cloudflare deben estar en **nube gris** mientras Render verifica.
- Los cambios de DNS pueden tardar desde minutos hasta unas horas.
- Con la nube naranja, el modo SSL/TLS debe ser **Full (strict)**.

**Después de publicar sigo viendo la versión vieja**

- Recarga con Ctrl + F5. `index.html` no se guarda en caché, pero el navegador puede tener la página abierta desde antes.
- Si usas la nube naranja, en Cloudflare → **Caching** → **Purge Everything**.

## Qué hace cada parte de render.yaml

- `buildCommand`: instala las dependencias y exporta la web a `dist`.
- `routes`: la regla que evita el 404 al recargar.
- `headers`:
  - cabeceras de seguridad (no dejar que la web se abra dentro de otra página, no adivinar tipos de archivo, enviar menos datos al salir a otro sitio, usar siempre HTTPS);
  - caché de un año para `/_expo/*` y `/assets/*`: sus nombres llevan un código (hash) que cambia en cada versión, así que nunca quedan viejos;
  - `index.html` sin caché, para que cada publicación se vea enseguida.
