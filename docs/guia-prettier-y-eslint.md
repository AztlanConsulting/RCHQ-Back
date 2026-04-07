# Guía: Prettier y ESLint (backend)

Este proyecto incluye **Prettier** (formato de código) y **ESLint** (reglas de calidad y buenas prácticas). La idea es que **ejecutéis los comandos a mano** antes de subir cambios al remoto, para ir familiarizándoos con qué hace cada uno.

Todos los comandos se ejecutan desde la carpeta del backend (`rhcq_back`), en una terminal:

```bash
npm run <nombre-del-script>
```

---

## Prettier

| Comando | Qué hace |
|--------|----------|
| `npm run format` | Aplica el formato a **todo** el proyecto según Prettier (modifica archivos). Equivale a `prettier --write .` |
| `npm run format:check` | **No** escribe archivos: solo comprueba si algo no cumple el formato. Útil para ver si falta formatear sin tocar nada. |

**Archivos:** respeta `.prettierignore` (por ejemplo `node_modules`).

**Tip:** podéis usar `format:check` para ver si hay diferencias; si falla, ejecutad `format` y volved a comprobar.

---

## ESLint

La configuración está en `eslint.config.mjs` (reglas recomendadas de JavaScript para Node y compatibilidad con Prettier).

| Comando | Qué hace |
|--------|----------|
| `npm run lint` | Analiza **todo** el proyecto y muestra errores y avisos. No modifica archivos. Equivale a `eslint .` |
| `npm run lint:fix` | Igual que `lint`, pero **corrige automáticamente** lo que ESLint pueda. Equivale a `eslint . --fix` |

**Cuándo usar cada uno:** `lint` para ver el estado; `lint:fix` cuando queráis aplicar correcciones automáticas. Después de `lint:fix`, conviene volver a ejecutar `lint` por si quedan problemas que hay que resolver a mano.

---

## Solo archivos en staging (`lint-staged`)

A veces no queréis formatear ni analizar **todo** el repo, sino solo lo que vais a commitear (archivos ya añadidos con `git add`).

| Comando | Qué hace |
|--------|----------|
| `npm run lint:staged` | Ejecuta **lint-staged**: según la configuración en `package.json`, pasa ESLint con `--fix` y Prettier con `--write` solo sobre los archivos **staged** que coincidan con los patrones (por ejemplo `*.js`). |

**Flujo típico:** `git add` de los archivos → `npm run lint:staged` → revisar → `git commit`.

**Diferencia con `lint` / `format`:** esos dos actúan sobre **todo** el proyecto (salvo ignorados). `lint:staged` solo toca lo que está en el índice de Git, útil para no reformatear código ajeno de golpe.

---

## Orden recomendado antes de subir código

No hay un script único que lo haga todo: el equipo puede acordar un orden, por ejemplo:

1. `npm run format` (o `format:check` si solo queréis verificar).
2. `npm run lint` (y si hace falta, `npm run lint:fix` y otra vez `npm run lint`).

Así separáis **formato** (Prettier) de **reglas de código** (ESLint), que son herramientas distintas aunque trabajen bien juntas gracias a `eslint-config-prettier`.

---

## Comandos directos con `npx` (opcional)

Lo mismo que hacen los scripts, pero sobre rutas concretas:

```bash
npx prettier --write src/controller/user.controller.js
npx eslint src/controller/user.controller.js
npx eslint --fix src/router/user.route.js
```

Útil para practicar en un solo archivo sin pasar por todo el proyecto.
