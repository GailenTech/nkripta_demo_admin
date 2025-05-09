#!/bin/bash

# Script para crear una interfaz de administración de demostración usando React Admin

# Colores para la consola
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BOLD}${BLUE}==================================================${NC}"
echo -e "${BOLD}${BLUE}   NKRIPTA - CREACIÓN DE INTERFAZ ADMIN DEMO     ${NC}"
echo -e "${BOLD}${BLUE}==================================================${NC}"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js no está instalado. Por favor, instálalo antes de continuar.${NC}"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm no está instalado. Por favor, instálalo antes de continuar.${NC}"
    exit 1
fi

# Directorio para la interfaz admin
ADMIN_DIR="nkripta-admin-ui"
CURRENT_DIR=$(pwd)

# Verificar si el directorio ya existe
if [ -d "$ADMIN_DIR" ]; then
    echo -e "${YELLOW}El directorio $ADMIN_DIR ya existe.${NC}"
    read -p "¿Deseas eliminarlo y crear uno nuevo? (s/n): " OVERWRITE
    if [[ "$OVERWRITE" == "s" || "$OVERWRITE" == "S" ]]; then
        echo -e "${YELLOW}Eliminando directorio existente...${NC}"
        rm -rf "$ADMIN_DIR"
    else
        echo -e "${YELLOW}Operación cancelada.${NC}"
        exit 0
    fi
fi

# Crear directorio para el proyecto
echo -e "${BLUE}Creando directorio para la interfaz de administración...${NC}"
mkdir -p "$ADMIN_DIR"
cd "$ADMIN_DIR"

# Inicializar proyecto React
echo -e "${BLUE}Inicializando proyecto React...${NC}"
npm init -y

# Instalar dependencias
echo -e "${BLUE}Instalando dependencias...${NC}"
npm install react-admin ra-data-simple-rest @mui/material @emotion/react @emotion/styled react react-dom react-router-dom

# Crear estructura de directorios
echo -e "${BLUE}Creando estructura de directorios...${NC}"
mkdir -p src/components/{organizations,profiles,subscriptions}
mkdir -p src/providers
mkdir -p public

# Crear archivo principal
echo -e "${BLUE}Creando archivos principales...${NC}"
cat > src/index.js << 'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Crear App.js
cat > src/App.js << 'EOF'
import React from 'react';
import { Admin, Resource } from 'react-admin';
import { dataProvider } from './providers/dataProvider';
import { OrganizationList, OrganizationEdit } from './components/organizations';
import { ProfileList, ProfileEdit } from './components/profiles';
import { SubscriptionList, SubscriptionEdit } from './components/subscriptions';
import Dashboard from './components/Dashboard';

const App = () => (
  <Admin
    dashboard={Dashboard}
    dataProvider={dataProvider}
    title="Nkripta Admin"
  >
    <Resource
      name="organizations"
      list={OrganizationList}
      edit={OrganizationEdit}
      options={{ label: 'Organizaciones' }}
    />
    <Resource
      name="profiles"
      list={ProfileList}
      edit={ProfileEdit}
      options={{ label: 'Perfiles' }}
    />
    <Resource
      name="subscriptions"
      list={SubscriptionList}
      edit={SubscriptionEdit}
      options={{ label: 'Suscripciones' }}
    />
  </Admin>
);

export default App;
EOF

# Crear proveedor de datos
cat > src/providers/dataProvider.js << 'EOF'
import { fetchUtils } from 'react-admin';
import { stringify } from 'query-string';

const apiUrl = 'http://localhost:3000/api';
const httpClient = fetchUtils.fetchJson;

export const dataProvider = {
  getList: (resource, params) => {
    const { page, perPage } = params.pagination;
    const { field, order } = params.sort;
    
    let url = '';
    
    // Adaptación para la API de Nkripta
    switch(resource) {
      case 'organizations':
        url = `${apiUrl}/organizations`;
        break;
      case 'profiles':
        url = `${apiUrl}/profiles`;
        break;
      case 'subscriptions':
        url = `${apiUrl}/billing/subscriptions`;
        break;
      default:
        url = `${apiUrl}/${resource}`;
    }
    
    return httpClient(url).then(({ headers, json }) => {
      // Adaptación al formato esperado por react-admin
      return {
        data: json.items || json,
        total: json.count || (json.items ? json.items.length : json.length),
      };
    });
  },
  
  getOne: (resource, params) => {
    let url = '';
    
    switch(resource) {
      case 'organizations':
        url = `${apiUrl}/organizations/${params.id}`;
        break;
      case 'profiles':
        url = `${apiUrl}/profiles/${params.id}`;
        break;
      case 'subscriptions':
        url = `${apiUrl}/billing/subscriptions/${params.id}`;
        break;
      default:
        url = `${apiUrl}/${resource}/${params.id}`;
    }
    
    return httpClient(url).then(({ json }) => ({
      data: json,
    }));
  },
  
  update: (resource, params) => {
    let url = '';
    
    switch(resource) {
      case 'organizations':
        url = `${apiUrl}/organizations/${params.id}`;
        break;
      case 'profiles':
        url = `${apiUrl}/profiles/${params.id}`;
        break;
      case 'subscriptions':
        url = `${apiUrl}/billing/subscriptions/${params.id}`;
        break;
      default:
        url = `${apiUrl}/${resource}/${params.id}`;
    }
    
    return httpClient(url, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    }).then(({ json }) => ({ data: json }));
  },
  
  // Implementar otros métodos según sea necesario
  create: (resource, params) => Promise.resolve({ data: { ...params.data, id: Date.now() } }),
  delete: (resource, params) => Promise.resolve({ data: { id: params.id } }),
  deleteMany: (resource, params) => Promise.resolve({ data: params.ids }),
  getMany: (resource, params) => Promise.resolve({ 
    data: params.ids.map(id => ({ id })) 
  }),
  getManyReference: (resource, params) => Promise.resolve({ 
    data: [], 
    total: 0 
  }),
  updateMany: (resource, params) => Promise.resolve({ data: params.ids }),
};
EOF

# Crear componentes para organizaciones
cat > src/components/organizations/index.js << 'EOF'
import OrganizationList from './OrganizationList';
import OrganizationEdit from './OrganizationEdit';

export { OrganizationList, OrganizationEdit };
EOF

cat > src/components/organizations/OrganizationList.js << 'EOF'
import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  EditButton,
} from 'react-admin';

const OrganizationList = props => (
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

export default OrganizationList;
EOF

cat > src/components/organizations/OrganizationEdit.js << 'EOF'
import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
} from 'react-admin';

const OrganizationEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput disabled source="id" />
      <TextInput source="name" label="Nombre" />
      <TextInput source="slug" label="Slug" />
      <TextInput source="description" label="Descripción" multiline />
      <TextInput source="email" label="Email" />
      <TextInput source="phone" label="Teléfono" />
      <TextInput source="website" label="Sitio Web" />
      <DateInput source="createdAt" label="Fecha de Creación" disabled />
    </SimpleForm>
  </Edit>
);

export default OrganizationEdit;
EOF

# Crear componentes para perfiles
cat > src/components/profiles/index.js << 'EOF'
import ProfileList from './ProfileList';
import ProfileEdit from './ProfileEdit';

export { ProfileList, ProfileEdit };
EOF

cat > src/components/profiles/ProfileList.js << 'EOF'
import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  ReferenceField,
  EditButton,
} from 'react-admin';

const ProfileList = props => (
  <List {...props}>
    <Datagrid>
      <TextField source="firstName" label="Nombre" />
      <TextField source="lastName" label="Apellido" />
      <EmailField source="email" label="Email" />
      <TextField source="position" label="Cargo" />
      <TextField source="organizationId" label="ID Organización" />
      <DateField source="createdAt" label="Fecha de Creación" />
      <EditButton />
    </Datagrid>
  </List>
);

export default ProfileList;
EOF

cat > src/components/profiles/ProfileEdit.js << 'EOF'
import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
  ReferenceInput,
  SelectInput,
} from 'react-admin';

const ProfileEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput disabled source="id" />
      <TextInput source="firstName" label="Nombre" />
      <TextInput source="middleName" label="Segundo Nombre" />
      <TextInput source="lastName" label="Apellido" />
      <TextInput source="position" label="Cargo" />
      <TextInput source="email" label="Email" />
      <TextInput source="phone" label="Teléfono" />
      <TextInput source="organizationId" label="ID Organización" />
      <DateInput source="createdAt" label="Fecha de Creación" disabled />
    </SimpleForm>
  </Edit>
);

export default ProfileEdit;
EOF

# Crear componentes para suscripciones
cat > src/components/subscriptions/index.js << 'EOF'
import SubscriptionList from './SubscriptionList';
import SubscriptionEdit from './SubscriptionEdit';

export { SubscriptionList, SubscriptionEdit };
EOF

cat > src/components/subscriptions/SubscriptionList.js << 'EOF'
import React from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  EditButton,
} from 'react-admin';

const SubscriptionList = props => (
  <List {...props}>
    <Datagrid>
      <TextField source="planType" label="Plan" />
      <TextField source="status" label="Estado" />
      <TextField source="profileId" label="ID Perfil" />
      <TextField source="organizationId" label="ID Organización" />
      <DateField source="currentPeriodStart" label="Inicio Período" />
      <DateField source="currentPeriodEnd" label="Fin Período" />
      <DateField source="createdAt" label="Fecha de Creación" />
      <EditButton />
    </Datagrid>
  </List>
);

export default SubscriptionList;
EOF

cat > src/components/subscriptions/SubscriptionEdit.js << 'EOF'
import React from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  DateInput,
  BooleanInput,
  SelectInput,
} from 'react-admin';

const SubscriptionEdit = props => (
  <Edit {...props}>
    <SimpleForm>
      <TextInput disabled source="id" />
      <TextInput source="stripeSubscriptionId" label="ID Suscripción Stripe" />
      <TextInput source="profileId" label="ID Perfil" />
      <TextInput source="organizationId" label="ID Organización" />
      <SelectInput source="planType" label="Plan" choices={[
        { id: 'plan_basic', name: 'Básico (9.99€)' },
        { id: 'plan_premium', name: 'Premium (29.99€)' },
      ]} />
      <SelectInput source="status" label="Estado" choices={[
        { id: 'active', name: 'Activa' },
        { id: 'past_due', name: 'Pago Pendiente' },
        { id: 'canceled', name: 'Cancelada' },
        { id: 'unpaid', name: 'No Pagada' },
        { id: 'trialing', name: 'En Prueba' },
      ]} />
      <DateInput source="currentPeriodStart" label="Inicio Período" />
      <DateInput source="currentPeriodEnd" label="Fin Período" />
      <BooleanInput source="cancelAtPeriodEnd" label="Cancelar al final del período" />
      <DateInput source="createdAt" label="Fecha de Creación" disabled />
    </SimpleForm>
  </Edit>
);

export default SubscriptionEdit;
EOF

# Crear Dashboard
cat > src/components/Dashboard.js << 'EOF'
import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';

const Dashboard = () => (
  <Card>
    <CardHeader title="Bienvenido al Panel de Administración de Nkripta" />
    <CardContent>
      <p>
        Este es un panel de administración de demostración para visualizar y gestionar los datos 
        de Nkripta. Utiliza el menú de la izquierda para navegar entre las diferentes secciones.
      </p>
      <p>
        Desde aquí puedes gestionar:
      </p>
      <ul>
        <li>Organizaciones</li>
        <li>Perfiles de usuario</li>
        <li>Suscripciones</li>
      </ul>
      <p>
        Los datos son cargados desde la API en http://localhost:3000/api.
      </p>
    </CardContent>
  </Card>
);

export default Dashboard;
EOF

# Crear HTML index
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Nkripta Admin</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Roboto', sans-serif;
        }
    </style>
</head>
<body>
    <noscript>Necesitas habilitar JavaScript para ejecutar esta aplicación.</noscript>
    <div id="root"></div>
</body>
</html>
EOF

# Configurar package.json
cat > package.json << 'EOF'
{
  "name": "nkripta-admin-ui",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/material": "^5.13.0",
    "ra-data-simple-rest": "^4.10.0",
    "react": "^18.2.0",
    "react-admin": "^4.10.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.0"
  },
  "scripts": {
    "start": "npx vite",
    "build": "npx vite build",
    "serve": "npx vite preview"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^3.1.0",
    "vite": "^4.2.1"
  }
}
EOF

# Configurar vite.config.js
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true
  }
});
EOF

# Instalar dependencias de desarrollo
echo -e "${BLUE}Instalando dependencias de desarrollo...${NC}"
npm install --save-dev @vitejs/plugin-react vite

# Volver al directorio original
cd "$CURRENT_DIR"

echo -e "${BOLD}${GREEN}==================================================${NC}"
echo -e "${BOLD}${GREEN}   INTERFAZ DE ADMINISTRACIÓN CREADA CON ÉXITO    ${NC}"
echo -e "${BOLD}${GREEN}==================================================${NC}"
echo -e "${BLUE}Instrucciones:${NC}"
echo -e "1. Asegúrate de que el backend esté ejecutándose en http://localhost:3000"
echo -e "2. Navega al directorio ${YELLOW}$ADMIN_DIR${NC}"
echo -e "3. Ejecuta ${YELLOW}npm install${NC} para instalar dependencias"
echo -e "4. Ejecuta ${YELLOW}npm start${NC} para iniciar la interfaz"
echo -e "5. Abre ${YELLOW}http://localhost:3001${NC} en tu navegador"
echo -e ""
echo -e "${YELLOW}Nota:${NC} Esta es una versión de demostración. Para una implementación"
echo -e "completa, consulta la propuesta en ${YELLOW}docs/admin-ui-proposal.md${NC}"