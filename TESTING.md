# Guía de Testing para NKripta Admin

Esta guía explica cómo ejecutar y gestionar las pruebas automatizadas del proyecto NKripta Admin.

## Tipos de pruebas

El proyecto incluye varios tipos de pruebas:

1. **Pruebas unitarias**: Verifican componentes individuales de forma aislada.
2. **Pruebas de integración**: Verifican la integración entre diferentes componentes.
3. **Pruebas de API**: Verifican los endpoints de la API y sus respuestas.
4. **Pruebas end-to-end**: Verifican flujos completos de usuario.

## Estructura de las pruebas

Las pruebas están organizadas en archivos separados por dominio:

- `tests/auth.test.js` - Pruebas de autenticación y autorización
- `tests/organizations.test.js` - Pruebas de gestión de organizaciones
- `tests/profiles.test.js` - Pruebas de gestión de perfiles de usuario
- `tests/subscriptions.test.js` - Pruebas de gestión de suscripciones
- `tests/integration.test.js` - Pruebas de integración entre múltiples sistemas

## Servicios externos y mocks

Las pruebas utilizan varios servicios, ya sea en su versión real o en versiones simuladas (mocks):

1. **PostgreSQL**: Base de datos real ejecutada en un contenedor Docker.
2. **Cognito**: Servicio de autenticación de AWS, emulado localmente mediante cognito-local.
3. **Stripe**: Servicio de pagos, que puede ser:
   - Emulado internamente mediante la configuración `STRIPE_MOCK_ENABLED=true`
   - Emulado externamente mediante el contenedor Docker de stripe-mock
   - Usar el API real de Stripe en modo test (no recomendado para CI/CD)

## Modos de ejecución

Existen varios modos de ejecución de pruebas:

### Modo de prueba completo

Ejecuta todas las pruebas, incluyendo las que requieren servicios externos:

```bash
TEST_MODE=full npm test
```

### Modo de prueba básico

Omite pruebas que dependen de servicios externos:

```bash
TEST_MODE=basic npm test
```

### Modo secuencial

Ejecuta las pruebas en un orden específico para asegurar que las dependencias entre pruebas funcionan correctamente:

```bash
npm run test:sequential
```

## Variables de entorno para pruebas

Las pruebas requieren ciertas variables de entorno para funcionar correctamente:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `TEST_MODE` | Modo de prueba (full/basic) | basic |
| `STRIPE_MOCK_ENABLED` | Habilita el mock interno de Stripe | false |
| `DB_HOST` | Host de la base de datos | localhost |
| `DB_PORT` | Puerto de la base de datos | 5432 |
| `DB_NAME` | Nombre de la base de datos | nkripta_test |
| `DB_USER` | Usuario de la base de datos | postgres |
| `DB_PASSWORD` | Contraseña de la base de datos | postgres |

## Ejecución desde el exterior (fuera de Docker)

Para ejecutar las pruebas desde el sistema host:

```bash
# Script interactivo que verifica servicios y ejecuta las pruebas
./scripts/run-full-tests.sh
```

Este script:
1. Verifica que los servicios Docker estén en ejecución
2. Comprueba la conectividad con la base de datos
3. Configura el archivo .env.test si no existe
4. Ejecuta las pruebas con la configuración adecuada
5. Genera informes si se solicita

## Ejecución dentro de Docker

Para ejecutar las pruebas dentro del contenedor Docker:

```bash
# Script interactivo con múltiples opciones de ejecución
./scripts/docker-run-tests.sh
```

Este script permite:
1. Ejecutar todas las pruebas secuencialmente
2. Ejecutar pruebas con generación de informes
3. Ejecutar pruebas específicas por dominio
4. Ejecutar comandos personalizados dentro del contenedor

## Generación de informes

El proyecto está configurado para generar varios tipos de informes:

```bash
# Ejecutar pruebas y generar todos los informes
npm run test:all-reports

# Ejecutar pruebas secuencialmente con informes
npm run test:sequential-with-reports

# Generar documentación a partir de los informes existentes
npm run test:docs
```

Los informes se generan en el directorio `test-reports/`:
- `junit.xml` - Informe compatible con sistemas CI/CD
- `test-report.html` - Informe visual para navegadores
- `test-summary.md` - Resumen en formato Markdown

## Integración con CI/CD

Para integrar las pruebas en un sistema CI/CD:

1. Asegúrese de que los servicios necesarios estén disponibles
2. Configure las variables de entorno requeridas
3. Ejecute las pruebas con generación de informes
4. Publique los informes en su plataforma CI/CD

Ejemplo de configuración para GitHub Actions:
```yaml
# Ver archivo .github/workflows/ci.yml.example para un ejemplo completo
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_USER: postgres
          POSTGRES_DB: nkripta_test
        ports:
          - 5432:5432
      
      stripe-mock:
        image: stripe/stripe-mock:latest
        ports:
          - 12111:12111
    
    steps:
    - uses: actions/checkout@v3
    - name: Set up Node.js
      uses: actions/setup-node@v3
    - name: Run tests
      run: npm run test:full-ci
```

## Solución de problemas comunes

### Las pruebas fallan con errores de conexión a la base de datos

Verifique:
- Que el servicio PostgreSQL esté en ejecución: `docker compose ps`
- Que las variables de entorno de conexión sean correctas en .env.test
- Que la base de datos exista: `docker compose exec postgres psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'nkripta_test'"`

### Las pruebas de suscripciones fallan

Asegúrese de:
- Que STRIPE_MOCK_ENABLED=true esté configurado
- Que el servicio stripe-mock esté en ejecución (si no usa el mock interno)
- Que las pruebas se ejecuten en modo completo: TEST_MODE=full

### Las pruebas de autenticación fallan

Compruebe:
- Que cognito-local esté en ejecución y accesible
- Que las variables COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID y COGNITO_REGION estén configuradas correctamente

## Preguntas frecuentes

### ¿Puedo ejecutar las pruebas sin Docker?

Sí, pero necesitará instalar y configurar PostgreSQL localmente y asegurarse de que todos los servicios externos estén disponibles o configurar los mocks adecuados.

### ¿Cómo puedo añadir nuevas pruebas?

1. Cree un nuevo archivo en el directorio tests/ o añada pruebas a un archivo existente
2. Siga las convenciones existentes para organizar las pruebas
3. Utilice el helper de autenticación si necesita tokens para sus pruebas
4. Añada la nueva prueba al script run-tests.js si debe ejecutarse secuencialmente

### ¿Por qué algunas pruebas se saltan?

Las pruebas pueden saltarse por varias razones:
- `TEST_MODE=basic` omite pruebas que dependen de servicios externos
- `STRIPE_MOCK_ENABLED=false` omite pruebas que dependen de Stripe si no hay un mock configurado
- Algunas pruebas usan `test.skip()` para omitirse deliberadamente en ciertos contextos