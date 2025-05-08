# Configuración de PgAdmin

Este documento explica cómo configurar y utilizar PgAdmin para gestionar la base de datos PostgreSQL del proyecto.

## Acceso a PgAdmin

PgAdmin está disponible en:
- URL: http://localhost:5050
- Email: admin@nkripta.com
- Password: admin

## Configuración automática

Se ha incluido un script para configurar automáticamente la conexión a PostgreSQL:

```bash
./scripts/setup-pgadmin.sh
```

Este script:
1. Crea un archivo de configuración para PgAdmin
2. Lo copia al contenedor
3. Reinicia PgAdmin para aplicar la configuración

## Configuración manual

Si prefieres configurar manualmente la conexión, sigue estos pasos:

1. Accede a PgAdmin en http://localhost:5050
2. Inicia sesión con las credenciales mencionadas arriba
3. Haz clic derecho en "Servers" en el panel izquierdo y selecciona "Create" → "Server..."
4. En la pestaña "General":
   - Name: nkripta-postgres
5. En la pestaña "Connection":
   - Host name/address: postgres
   - Port: 5432
   - Maintenance database: postgres
   - Username: postgres
   - Password: postgres
   - Save password: Activar
6. Haz clic en "Save"

## Solución de problemas

Si no puedes ver la base de datos después de la configuración, intenta estos pasos:

1. Asegúrate de que el contenedor de PostgreSQL está en ejecución:
   ```bash
   docker ps | grep postgres
   ```

2. Verifica que la base de datos existe:
   ```bash
   docker exec nkripta-postgres psql -U postgres -c "\l"
   ```

3. Reinicia PgAdmin:
   ```bash
   docker restart nkripta-pgadmin
   ```

4. Si persisten los problemas, vuelve a ejecutar el script de configuración:
   ```bash
   ./scripts/setup-pgadmin.sh
   ```

## Operaciones comunes

### Ver tablas

1. Expande el servidor "nkripta-postgres"
2. Expande "Databases" → "nkripta" → "Schemas" → "public" → "Tables"

### Ejecutar consultas SQL

1. Haz clic derecho en la base de datos "nkripta"
2. Selecciona "Query Tool"
3. Escribe tu consulta SQL y haz clic en el botón "Execute/Refresh" (F5)

### Ejemplo de consulta

```sql
-- Ver todas las organizaciones
SELECT * FROM "Organization";

-- Ver todos los perfiles
SELECT * FROM "Profile";

-- Ver relación entre organizaciones y perfiles
SELECT o.name as organization_name, p.email, p.roles 
FROM "Profile" p 
JOIN "Organization" o ON p.organizationId = o.id;
```