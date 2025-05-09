# Nkripta Admin UI

Esta interfaz de administración permite visualizar y gestionar los datos de Nkripta de forma sencilla.

## Requisitos previos

- Node.js 14 o superior
- npm o yarn
- Backend de Nkripta ejecutándose en http://localhost:3000

## Instalación

```bash
# Instalar dependencias
npm install
```

## Ejecución

```bash
# Iniciar el servidor de desarrollo
npm start
```

La aplicación se abrirá automáticamente en http://localhost:3000 (o el primer puerto disponible).

## Funcionalidades

Esta interfaz permite:

- Ver todas las organizaciones registradas
- Ver todos los perfiles de usuario
- Ver todas las suscripciones activas

## Inicialización completa

Para una experiencia completa, asegúrate de seguir estos pasos:

1. Inicia el backend de Nkripta:
   ```bash
   cd .. # (directorio raíz del proyecto)
   npm run dev
   ```

2. Carga los datos de demostración:
   ```bash
   cd .. # (directorio raíz del proyecto)
   ./scripts/init-demo-db.sh
   ```

3. Inicia la interfaz admin:
   ```bash
   cd nkripta-admin-ui
   npm start
   ```

## Solución de problemas

Si encuentras errores 404 al intentar cargar los datos:

1. Verifica que el backend esté ejecutándose en http://localhost:3000
2. Asegúrate de que los datos de demostración estén cargados (ejecuta `./scripts/init-demo-db.sh`)
3. Revisa la consola del navegador para ver mensajes de error específicos

## Configuración

El archivo principal para la configuración es `src/App.js`, donde puedes modificar:

- `API_URL`: URL base del backend (por defecto: http://localhost:3000/api)
