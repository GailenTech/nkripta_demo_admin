# Propuesta de Interfaz de Administración para Nkripta

Este documento presenta una propuesta para implementar una interfaz de administración que permita explorar y gestionar los datos de Nkripta de forma visual.

## Tecnologías Propuestas

Para crear rápidamente una interfaz administrativa efectiva, recomendamos:

1. **[React Admin](https://marmelab.com/react-admin/)** - Una solución completa para construir aplicaciones B2B en React
2. **[Next.js](https://nextjs.org/)** - Framework React con funcionalidades de SSR y API
3. **[Material UI](https://mui.com/)** - Biblioteca de componentes visuales

## Características Principales

El panel de administración incluiría las siguientes funcionalidades:

- **Autenticación** integrada con Cognito
- **Dashboard** con métricas clave y gráficos
- **CRUD** completo para organizaciones, perfiles y suscripciones
- **Filtros avanzados** para búsqueda y exploración de datos
- **Exportación** de datos a CSV/Excel
- **Gestión de permisos** basada en roles

## Estructura Propuesta

```
nkripta-admin-ui/
├── public/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   ├── organizations/
│   │   ├── profiles/
│   │   ├── subscriptions/
│   │   └── common/
│   ├── pages/
│   │   ├── _app.js
│   │   ├── dashboard.js
│   │   ├── organizations/
│   │   ├── profiles/
│   │   └── subscriptions/
│   ├── providers/
│   │   ├── authProvider.js
│   │   └── dataProvider.js
│   ├── theme/
│   └── utils/
└── package.json
```

## Diseño Visual Propuesto

### Pantalla de Login

![Login Screen](https://i.imgur.com/placeholder-login.png)

```jsx
// Ejemplo conceptual del componente de login
import { useState } from 'react';
import { Card, CardContent, TextField, Button, Typography, Box } from '@mui/material';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Integración con Cognito para autenticación
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent>
          <Typography variant="h5" component="h1" align="center" gutterBottom>
            Nkripta Admin
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Contraseña"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
            >
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
```

### Dashboard

![Dashboard](https://i.imgur.com/placeholder-dashboard.png)

El dashboard incluiría:

- Gráfico de usuarios por organización
- Gráfico de distribución de planes de suscripción
- Métricas de ingresos mensuales
- Listado de últimos usuarios registrados
- Estado de salud del sistema

### Lista de Organizaciones

![Organizations List](https://i.imgur.com/placeholder-orgs.png)

```jsx
// Ejemplo conceptual de la lista de organizaciones
import { List, Datagrid, TextField, EmailField, DateField, EditButton } from 'react-admin';

export const OrganizationList = props => (
  <List {...props}>
    <Datagrid>
      <TextField source="name" label="Nombre" />
      <TextField source="slug" label="Slug" />
      <EmailField source="email" label="Email" />
      <TextField source="phone" label="Teléfono" />
      <DateField source="createdAt" label="Fecha de Creación" />
      <EditButton />
    </Datagrid>
  </List>
);
```

### Detalles de Organización

La vista de detalles de una organización incluiría:

- Información general (nombre, descripción, contacto)
- Listado de miembros (perfiles)
- Historial de suscripciones
- Gráficos de actividad
- Acciones disponibles (editar, eliminar, etc.)

### Lista de Perfiles

![Profiles List](https://i.imgur.com/placeholder-profiles.png)

```jsx
// Ejemplo conceptual de la lista de perfiles
import { List, Datagrid, TextField, EmailField, ReferenceField, ArrayField, ChipField } from 'react-admin';

export const ProfileList = props => (
  <List {...props}>
    <Datagrid>
      <TextField source="firstName" label="Nombre" />
      <TextField source="lastName" label="Apellido" />
      <EmailField source="email" label="Email" />
      <TextField source="position" label="Cargo" />
      <ReferenceField source="organizationId" reference="organizations" label="Organización">
        <TextField source="name" />
      </ReferenceField>
      <ArrayField source="roles" label="Roles">
        <ChipField source="roles" />
      </ArrayField>
      <EditButton />
    </Datagrid>
  </List>
);
```

### Lista de Suscripciones

![Subscriptions List](https://i.imgur.com/placeholder-subs.png)

Con información sobre:
- Plan (Básico/Premium)
- Propietario
- Organización
- Estado (activa, cancelada, etc.)
- Fechas de inicio y fin
- Acciones disponibles

## Integraciones con la API existente

La interfaz se integraría con los endpoints:

- `/api/organizations` - CRUD de organizaciones
- `/api/profiles` - CRUD de perfiles de usuario
- `/api/billing/subscriptions` - Gestión de suscripciones
- `/api/auth` - Autenticación y autorización

## Plan de Implementación

Para implementar esta interfaz, proponemos el siguiente plan:

1. **Fase 1 - Configuración** (1-2 días)
   - Crear proyecto Next.js
   - Integrar React Admin
   - Configurar autenticación con Cognito

2. **Fase 2 - Componentes Básicos** (3-4 días)
   - Dashboard con métricas principales
   - CRUD de organizaciones
   - CRUD de perfiles
   - CRUD de suscripciones
  
3. **Fase 3 - Características Avanzadas** (2-3 días)
   - Filtros avanzados
   - Exportación de datos
   - Informes y gráficos detallados
  
4. **Fase 4 - Pulido y Testing** (2 días)
   - Mejoras de UI/UX
   - Testing e2e
   - Documentación

**Tiempo total estimado**: 8-11 días laborables

## Conclusión

Este panel de administración proporcionaría una forma intuitiva y eficiente de visualizar y gestionar todos los datos de Nkripta, facilitando enormemente la administración y las demostraciones del sistema.

## Ejemplos de Implementación

Para comenzar rápidamente, sugerimos este enfoque inicial que puedes expandir:

```jsx
// dataProvider.js - Conecta React Admin con tu API
import { fetchUtils } from 'react-admin';
import { stringify } from 'query-string';

const apiUrl = 'http://localhost:3000/api';
const httpClient = fetchUtils.fetchJson;

export const dataProvider = {
    getList: (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const query = {
            sort: JSON.stringify([field, order]),
            range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            filter: JSON.stringify(params.filter),
        };
        const url = `${apiUrl}/${resource}?${stringify(query)}`;

        return httpClient(url).then(({ headers, json }) => ({
            data: json.items,
            total: json.count,
        }));
    },
    // Implementar otros métodos: getOne, getMany, create, update, delete...
};

// App.js - Aplicación principal
import { Admin, Resource } from 'react-admin';
import { dataProvider } from './dataProvider';
import { authProvider } from './authProvider';
import { OrganizationList, OrganizationEdit, OrganizationCreate } from './organizations';
import { ProfileList, ProfileEdit, ProfileCreate } from './profiles';
import { SubscriptionList, SubscriptionEdit, SubscriptionCreate } from './subscriptions';
import Dashboard from './Dashboard';

const App = () => (
    <Admin 
        dashboard={Dashboard}
        dataProvider={dataProvider}
        authProvider={authProvider}
    >
        <Resource 
            name="organizations" 
            list={OrganizationList} 
            edit={OrganizationEdit} 
            create={OrganizationCreate} 
        />
        <Resource 
            name="profiles" 
            list={ProfileList} 
            edit={ProfileEdit} 
            create={ProfileCreate} 
        />
        <Resource 
            name="subscriptions" 
            list={SubscriptionList} 
            edit={SubscriptionEdit} 
            create={SubscriptionCreate} 
        />
    </Admin>
);

export default App;
```

## Recursos

- [Documentación de React Admin](https://marmelab.com/react-admin/documentation.html)
- [Ejemplos de código](https://github.com/marmelab/react-admin/tree/master/examples)
- [Tutoriales](https://marmelab.com/react-admin/tutorials.html)