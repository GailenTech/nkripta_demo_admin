# Interfaz de Administración de Nkripta

Esta es una interfaz simple para visualizar y explorar los datos de la API de Nkripta. Proporciona una forma fácil de ver las organizaciones, perfiles y suscripciones creadas en el sistema.

## Requisitos

- Node.js y npm instalados
- API de Nkripta ejecutándose en http://localhost:3000
- Datos de demostración cargados (ver sección "Datos de Demostración")

## Instalación

```bash
# Desde el directorio nkripta-admin-ui
npm install
```

## Ejecución

```bash
# Desde el directorio nkripta-admin-ui
npm start
```

La aplicación se iniciará en http://localhost:3000 o el siguiente puerto disponible.

## Funcionalidades

- **Pestaña Organizaciones**: Muestra todas las organizaciones en el sistema
- **Pestaña Perfiles**: Muestra todos los perfiles de usuario
- **Pestaña Suscripciones**: Muestra todas las suscripciones activas

## Estructura de la Aplicación

- `src/App.js`: Componente principal que maneja la UI y la carga de datos
- `public/index.html`: Plantilla HTML base
- `package.json`: Dependencias y scripts del proyecto

## Datos de Demostración

Para poblar la base de datos con datos de demostración, desde el directorio raíz del proyecto:

```bash
./scripts/init-demo-db.sh
```

Esto creará:
- 3 organizaciones
- 3-4 usuarios por organización
- Suscripciones a planes Basic (9.99€) y Premium (29.99€)

Para más detalles sobre los datos creados, consulta:
- `DEMO_DATA.md` en el directorio raíz

## Solución de Problemas

### API devuelve 404 para `/api/organizations` u otros endpoints

1. Asegúrate de que el backend esté ejecutándose:
   ```bash
   cd ..
   npm run dev
   ```

2. Verifica que los datos de demostración estén cargados:
   ```bash
   cd ..
   ./scripts/init-demo-db.sh
   ```

3. La aplicación está configurada para omitir la autenticación en solicitudes GET para facilitar la demostración.

### La UI no se inicia

1. Comprueba que tienes todas las dependencias instaladas:
   ```bash
   npm install
   ```

2. Asegúrate de no tener otro servidor ejecutándose en el puerto 3000:
   ```bash
   lsof -i :3000
   # Si hay algo ejecutándose, termínalo o cambia el puerto en package.json
   ```

## Notas de Desarrollo

Esta interfaz de administración es una versión simplificada diseñada para exploración y demostración. Para un entorno de producción, se recomienda:

1. Implementar autenticación real
2. Añadir funcionalidades de edición y creación
3. Mejorar el manejo de errores y la validación
4. Añadir pruebas automatizadas

## Extensiones Futuras

- Implementar autenticación con Cognito
- Añadir formularios para creación y edición de entidades
- Añadir gráficos y estadísticas sobre suscripciones
- Mejorar la navegación y experiencia de usuario