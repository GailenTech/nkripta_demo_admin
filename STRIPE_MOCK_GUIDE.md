# Guía de Uso de Stripe Mock en Nkripta

Esta guía explica cómo utilizar el sistema de simulación de Stripe (stripe-mock) para el desarrollo y pruebas en Nkripta.

## ¿Qué es Stripe Mock?

Stripe Mock es un servicio que simula la API de Stripe, permitiendo realizar desarrollos y pruebas sin realizar transacciones reales. En Nkripta, hemos configurado un sistema que:

1. Utiliza el contenedor Docker oficial de `stripe/stripe-mock`
2. Crea productos, precios, clientes y suscripciones en Stripe Mock que coinciden con nuestros datos de demostración
3. Permite a la API obtener datos directamente de Stripe Mock en lugar de la base de datos local

## Configuración

### Requisitos previos

- Docker y Docker Compose instalados
- Node.js y npm instalados
- Proyecto Nkripta clonado y configurado

### Inicialización del entorno con Stripe Mock

```bash
# Desde el directorio raíz del proyecto
./scripts/init-stripe-mock.sh
```

Este script:
1. Verifica que el contenedor de Stripe Mock esté en ejecución
2. Configura las variables de entorno necesarias
3. Inicializa los datos de demostración en Stripe Mock
4. Sincroniza las suscripciones existentes con Stripe Mock

### Variables de entorno

Las siguientes variables de entorno controlan el comportamiento del sistema con Stripe Mock:

```
STRIPE_MOCK_ENABLED=true       # Habilita la comunicación con Stripe Mock 
USE_STRIPE_MOCK=true           # Hace que la API obtenga datos directamente de Stripe Mock
STRIPE_MOCK_HOST=localhost     # Host donde se ejecuta Stripe Mock
STRIPE_MOCK_PORT=12111         # Puerto principal de Stripe Mock
```

Estas variables se añaden automáticamente a tu archivo `.env` cuando ejecutas el script de inicialización.

## Funcionamiento

### Datos disponibles en Stripe Mock

Después de ejecutar el script de inicialización, tendrás los siguientes datos en Stripe Mock:

**Productos y Precios**:
- Plan Básico: 9.99€/mes
- Plan Premium: 29.99€/mes

**Clientes**:
- Un cliente por cada perfil en la base de datos

**Suscripciones**:
- Una suscripción por cada perfil, conectada con el plan correspondiente

### Cómo se obtienen los datos

Con `USE_STRIPE_MOCK=true` (valor predeterminado después de la inicialización):

1. Cuando la API recibe una solicitud para listar suscripciones, llama directamente a Stripe Mock
2. Stripe Mock devuelve las suscripciones con todos sus detalles (cliente, plan, fechas, etc.)
3. La API transforma estos datos al formato esperado por el frontend
4. El frontend muestra los datos con origen "Stripe"

Con `USE_STRIPE_MOCK=false` (comportamiento anterior):

1. La API consulta la tabla `Subscription` en la base de datos local
2. Devuelve los datos directamente desde PostgreSQL
3. El frontend muestra los datos con origen "BD Local"

## Desarrollo con Stripe Mock

### Probando nuevas suscripciones

Puedes crear nuevas suscripciones utilizando la API de Stripe directamente:

```javascript
const { stripe } = require('../src/config/stripe');

// Crear un cliente
const customer = await stripe.customers.create({
  email: 'nuevo@cliente.com',
  name: 'Nuevo Cliente'
});

// Crear una suscripción
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: 'plan_basic' }]  // o 'plan_premium'
});
```

### Simulando eventos de Stripe

Puedes simular eventos de Stripe llamando directamente a los endpoints correspondientes:

```javascript
// Actualizar una suscripción
const updatedSubscription = await stripe.subscriptions.update('sub_123', {
  cancel_at_period_end: true
});

// Cancelar una suscripción
const canceledSubscription = await stripe.subscriptions.cancel('sub_123', {
  prorate: true
});
```

## Integración con la Interfaz de Administración

La interfaz de administración ha sido actualizada para mostrar datos adicionales cuando provienen de Stripe:

- Nombre del plan (obtenido del producto en Stripe)
- Precio exacto y moneda
- Email del cliente
- Indicador de origen de datos (Stripe o BD Local)

De esta forma, puedes verificar fácilmente que los datos están viniendo correctamente de Stripe Mock.

## Solución de problemas

### Stripe Mock no se inicia

Si el contenedor de Stripe Mock no se inicia correctamente:

```bash
# Verificar los logs
docker logs nkripta-stripe-mock

# Reiniciar el contenedor
docker compose restart stripe-mock
```

### Problemas con los datos

Si los datos no aparecen correctamente en Stripe Mock:

```bash
# Reinicializar los datos
node scripts/init-stripe-mock-data.js
```

### Volver al comportamiento anterior

Si deseas volver a utilizar la base de datos local para las suscripciones:

```bash
# Editar el archivo .env
USE_STRIPE_MOCK=false
```

## Referencias

- [Documentación oficial de Stripe Mock](https://github.com/stripe/stripe-mock)
- [API de Stripe para Node.js](https://stripe.com/docs/api?lang=node)
- [Pruebas de Stripe](https://stripe.com/docs/testing)