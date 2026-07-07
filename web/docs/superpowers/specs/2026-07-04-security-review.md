# Chequeo de seguridad pre-deploy — hallazgos y arreglos

## Contexto

Antes de desplegar a Vercel por primera vez, se pidió una revisión de seguridad explícita:
secretos no expuestos al front, contraseñas hasheadas, control de indexado en buscadores, y
manejo correcto de async. Sin skill de "code review" disponible en esta sesión, la revisión se
hizo a mano: lectura completa de todas las server actions/rutas nuevas, auditoría de qué llega al
bundle de cliente, y comparación contra la guía oficial de Next.js
(`node_modules/next/dist/docs/01-app/02-guides/data-security.md` y `content-security-policy.md`).

## Hallazgo crítico: loop infinito de login (bloqueaba el acceso por completo)

Al levantar la app en modo producción (`next start`, sin la variable `VERCEL=1` que Vercel setea
automáticamente), Auth.js tira `UntrustedHost` porque no reconoce el host como confiable. Ese
error dejaba `req.auth` en un estado "truthy pero vacío" dentro de `proxy.ts`, y el chequeo
`Boolean(req.auth)` lo interpretaba como "sesión válida" — **sin sesión real, sin cookie, sin
nada**. Resultado: cualquier visita a `/login` se redirigía a `/outliers`, que a su vez revalidaba
la sesión de verdad, no encontraba nada, y redirigía de vuelta a `/login` → loop infinito. Nadie
podía loguearse.

Arreglo (dos capas, no una sola):
- `lib/auth.ts`: `trustHost: true` en la config de NextAuth — arregla la causa raíz.
- `proxy.ts`: el chequeo pasó de `Boolean(req.auth)` a `Boolean(req.auth?.user)` — si `auth()`
  vuelve a fallar por cualquier motivo en el futuro, ahora falla cerrado (bloquea acceso) en vez
  de fallar abierto (concede acceso).

Verificado con un `next build` + `next start` real y un login end-to-end vía curl (usuario/clave
sembrados, contraseña incorrecta, email inexistente) — sin loops, sin bypass.

## Otros hallazgos y arreglos

- **CRON_SECRET comparado con `!==`** (ataque de timing) y **fallaba abierto si la variable de
  entorno estaba vacía** (`Bearer` + string vacío podía calzar con un header `Bearer ` vacío).
  Arreglado con comparación en tiempo constante (`lib/security.ts`) + chequeo explícito de que el
  secreto esté configurado antes de comparar.
- **Login filtraba (por timing) si un email existía**: `authorize()` retornaba antes de correr
  `bcrypt.compare` cuando el usuario no existía, haciendo la respuesta mucho más rápida que cuando
  sí existía. Arreglado corriendo `bcrypt.compare` siempre (contra un hash dummy si no hay
  usuario), igualando el tiempo de respuesta.
- **`/robots.txt` quedaba atrapado por el proxy de auth** y se redirigía a `/login` en vez de
  servirse público — lo cual rompe el propósito del archivo (los crawlers nunca ven el
  `Disallow: /`). Arreglado excluyéndolo del matcher de `proxy.ts`.
- **Subida de fotos sin validar tipo/tamaño**: cualquier archivo, de cualquier tamaño, se aceptaba
  y subía a Vercel Blob. Arreglado con `lib/hostPhotos/validation.ts` (solo `image/*`, máximo
  10 MB), extraído como función pura y testeada.
- **Mensajes de error sin higienizar**: a diferencia de errores no capturados en el render (que
  Next.js sí redacta en producción), un `throw` dentro de una Server Action invocada
  imperativamente desde un componente cliente llega tal cual al `catch` del cliente. Si
  `generateThumbnailIdea` o Prisma tiraban un error con detalle interno, se mostraba entero en la
  UI. Arreglado con `lib/errors.ts` (`UserFacingError` + `runOrGenericError`): los mensajes de
  validación propios siguen llegando tal cual, cualquier otro error se loguea en el servidor y se
  reemplaza por un mensaje genérico antes de cruzar al cliente.
- **Sin control de indexado**: no había `robots.txt` ni metadata `robots`. Agregado `app/robots.ts`
  (disallow total) + `metadata.robots` en `app/layout.tsx` + header `X-Robots-Tag` como respaldo
  para rutas que no pasan por metadata (ej. `/api/*`).
- **Sin headers de seguridad**: `next.config.ts` no seteaba nada. Agregado
  `Content-Security-Policy` (sin nonces — ver nota abajo), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.

## Cosas ya verificadas como correctas (sin cambios)

- **Ningún secreto se referencia desde código `"use client"`** — se grepeó todo `process.env.*` del
  proyecto; todo vive en módulos server-only (`lib/*`, rutas API, server actions).
- **Contraseñas**: bcrypt costo 12, nunca se devuelve `passwordHash` al cliente (los `select`
  siempre son explícitos y mínimos).
- **CSRF**: cubierto por el chequeo automático de Origin/Host de Next.js en Server Actions — no
  hace falta nada manual.
- **SQL injection**: todo pasa por el query builder de Prisma, no hay `$queryRaw`/`$executeRaw` en
  el proyecto.
- **SSRF en la llamada a Anthropic**: las imágenes de referencia que se le pasan al modelo de
  visión solo pueden venir de `Outlier.thumbnailUrl`, poblado por nuestro propio pipeline desde la
  API de YouTube — nunca de una URL escrita a mano por el usuario.
- **Async/await**: revisado módulo por módulo (todas las server actions, `blobClient.ts`,
  `anthropicClient.ts`) — sin promesas sueltas sin `await`.

## Decisión consciente: CSP sin nonces

Next.js documenta dos formas de armar el CSP: con nonces por request (más estricto, pero exige que
*todas* las páginas se rendericen dinámicamente, incluida `/login`) o un CSP fijo vía
`next.config.ts` con `'unsafe-inline'` en script/style (más simple, sin ese requisito). Se eligió
la segunda por menor riesgo de romper el build en un entorno donde no se puede probar con un
navegador real de punta a punta. Igual bloquea framing (clickjacking), `object-src`, imágenes de
orígenes no permitidos, y fuerza HTTPS. Si en el futuro quieren el nivel estricto, es la mejora
natural — ver `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` en el
proyecto para la receta exacta con nonces.

## No implementado (evaluado y descartado por ahora)

- **Bloqueo por intentos fallidos de login**: bcrypt (costo 12, ~100-300ms/intento) ya limita
  naturalmente la velocidad de fuerza bruta. Un sistema de lockout es una función nueva (con sus
  propias decisiones de UX: duración, por cuenta o por IP) más que un arreglo de seguridad
  puntual — queda como mejora futura si lo priorizan, no se construyó sin pedirlo explícitamente.
