# Guía de Migraciones con Prisma

## ¿Qué son las Migraciones?

Las migraciones son archivos SQL que registran cambios en el esquema de la base de datos. Prisma mantiene un historial de estos cambios en la carpeta `prisma/migrations/`.

## Flujo de Trabajo Normal

### 1. Cuando HACES cambios al esquema

Si necesitas modificar el esquema de la base de datos:

1. **Edita el archivo `prisma/schema.prisma`**
   - Agrega, modifica o elimina modelos/campos

2. **Crea la migración**
   ```bash
   npx prisma migrate dev --name descripcion_del_cambio
   ```
   
   Ejemplo:
   ```bash
   npx prisma migrate dev --name add_employee_phone_field
   ```

   Esto automáticamente:
   - ✅ Crea un archivo de migración en `prisma/migrations/`
   - ✅ Aplica los cambios a tu base de datos local
   - ✅ Regenera el Cliente de Prisma

3. **Commit ambos archivos a git**
   ```bash
   git add prisma/schema.prisma prisma/migrations/
   git commit -m "feat: agregar campo teléfono a empleado"
   git push
   ```

### 2. Cuando RECIBES cambios del esquema (pull)

Cuando alguien del equipo hace cambios al esquema y tú haces pull:

```bash
git pull
npx prisma migrate dev
```

Esto automáticamente:
- ✅ Detecta las migraciones pendientes
- ✅ Las aplica a tu base de datos local
- ✅ Regenera el Cliente de Prisma

**¡Eso es todo!** No necesitas comandos SQL manuales.

## Comandos Importantes

### Desarrollo Local
```bash
# Aplicar migraciones pendientes
npx prisma migrate dev

# Crear nueva migración con nombre descriptivo
npx prisma migrate dev --name nombre_descriptivo

# Ver estado de migraciones
npx prisma migrate status

# Resetear base de datos (borra todo y re-aplica migraciones)
npx prisma migrate reset
```

### Producción / CI / Testing
```bash
# Aplicar migraciones sin prompts (para automatización)
npx prisma migrate deploy
```

## Configuración Inicial (Solo Primera Vez)

Si estás configurando el proyecto por primera vez y ya existe una base de datos:

### Opción A: Base de Datos Vacía (Recomendado)
```bash
# Crear base de datos desde cero
npx prisma migrate reset

# Esto ejecutará:
# 1. Borra la base de datos
# 2. Re-crea el esquema desde las migraciones
# 3. Ejecuta el archivo seed (si existe)
```

### Opción B: Base de Datos Existente (Baseline)
Si ya tienes datos que no quieres perder:

```bash
# Marcar migraciones como aplicadas sin ejecutarlas
npx prisma migrate resolve --applied 20260419061249_init
npx prisma migrate resolve --applied 20260428120917_add_employee_type_salary_address
npx prisma migrate resolve --applied 20260429232000_legacy_snake_case_renames

# Verificar estado
npx prisma migrate status

# Si los nombres de columnas están desactualizados, ejecutar manualmente:
psql -U postgres -d postgres -f prisma/migrations/20260429232000_legacy_snake_case_renames/migration.sql
```

## Solución de Problemas Comunes

### "Drift detected: Your database schema is not in sync"
**Problema:** Tu base de datos tiene un esquema diferente al esperado.

**Solución:**
```bash
# Si no te importa perder los datos locales:
npx prisma migrate reset

# Si quieres mantener los datos:
# Contacta al líder técnico para ayuda con baseline
```

### "Error: P3005 - The database schema is not empty"
**Problema:** Intentas aplicar migraciones a una base de datos que ya tiene tablas.

**Solución:** Usa el proceso de baseline (Opción B arriba).

### Las pruebas de integración fallan con "column does not exist"
**Problema:** Tu base de datos local tiene nombres de columnas antiguos.

**Solución:**
```bash
npx prisma migrate status  # Verificar estado
npx prisma migrate dev     # Aplicar migraciones pendientes
```

## Mejores Prácticas

### ✅ Hacer
- Usar nombres descriptivos para migraciones
- Siempre ejecutar `npx prisma migrate dev` después de hacer pull
- Revisar los archivos de migración generados antes de hacer commit
- Mantener migraciones pequeñas y enfocadas
- Probar migraciones localmente antes de push

### ❌ No Hacer
- Editar archivos de migración ya aplicados
- Ejecutar comandos SQL directamente en producción sin migración
- Ignorar el archivo `prisma/migrations/` en `.gitignore`
- Hacer cambios al esquema sin crear migración
- Mezclar cambios de schema con cambios de código en el mismo commit

## Estructura de Archivos

```
rhcq_back/
├── prisma/
│   ├── schema.prisma              # ← Esquema principal (editar aquí)
│   └── migrations/                # ← Historial de cambios
│       ├── migration_lock.toml    # ← No editar
│       ├── 20260419061249_init/
│       │   └── migration.sql
│       ├── 20260428120917_add_employee_type_salary_address/
│       │   └── migration.sql
│       └── 20260429232000_legacy_snake_case_renames/
│           └── migration.sql
```

## Ejemplo Completo

### Escenario: Agregar campo "middle_name" a empleado

```bash
# 1. Editar prisma/schema.prisma
# Agregar: middleName String?

# 2. Crear y aplicar migración
npx prisma migrate dev --name add_employee_middle_name

# 3. Commit cambios
git add prisma/
git commit -m "feat: agregar segundo nombre a empleado"
git push

# 4. Tu compañero hace pull
git pull
npx prisma migrate dev

# ¡Listo! Ambos tienen el mismo esquema.
```

## Recursos Adicionales

- [Documentación oficial de Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Troubleshooting Prisma Migrate](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/troubleshooting-development)

## Contacto

Si tienes problemas con migraciones, contacta al líder técnico del equipo.
