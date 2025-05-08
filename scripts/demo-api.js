/**
 * Script de demostración de API para nkripta_admin
 * 
 * Este script muestra cómo usar la API desde JavaScript (Node.js)
 * Útil para integraciones y pruebas automatizadas
 */

const axios = require('axios');
// Colores para la salida en consola sin dependencias externas
const colors = {
  blue: (text) => `\u001b[34m${text}\u001b[0m`,
  green: (text) => `\u001b[32m${text}\u001b[0m`,
  yellow: (text) => `\u001b[33m${text}\u001b[0m`,
  red: (text) => `\u001b[31m${text}\u001b[0m`
};

// Configuración base
const API_URL = 'http://app:3000/api'; // Usando hostname del servicio en docker-compose
let token = '';

// Función para imprimir respuestas
const printResponse = (title, response) => {
  console.log(colors.blue('\n============================================='));
  console.log(colors.blue(title));
  console.log(colors.blue('=============================================\n'));
  
  console.log(colors.yellow('Respuesta:'));
  // Mostrar solo los datos relevantes
  const data = response.data;
  console.log(JSON.stringify(data, null, 2));
  console.log('\n');
  
  return data;
};

// Función principal
async function runDemo() {
  try {
    // 0. Verificar que la API está en funcionamiento
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('0. Verificando que la API está en funcionamiento'));
    console.log(colors.blue('=============================================\n'));
    
    console.log(colors.green('Haciendo GET a ' + API_URL));
    const healthResponse = await axios.get(API_URL);
    printResponse('Estado de la API', healthResponse);

    // 1. Autenticación - Login
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('1. Autenticación - Iniciar sesión con el usuario admin'));
    console.log(colors.blue('=============================================\n'));
    
    console.log(colors.green('Haciendo POST a ' + `${API_URL}/auth/login`));
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'Password123'
    });
    
    const loginData = printResponse('Login', loginResponse);
    token = loginData.token;
    
    console.log(colors.green('Token JWT obtenido: ' + token.substring(0, 30) + '...'));

    // Configurar el header de autorización para futuras peticiones
    const authHeader = { Authorization: `Bearer ${token}` };

    // 2. Obtener perfil del usuario
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('2. Verificar perfil del usuario autenticado'));
    console.log(colors.blue('=============================================\n'));
    
    console.log(colors.green('Haciendo GET a ' + `${API_URL}/auth/me`));
    const profileResponse = await axios.get(`${API_URL}/auth/me`, { headers: authHeader });
    const profileData = printResponse('Perfil', profileResponse);

    // 3. Obtener detalles de la organización
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('3. Obtener detalles de la organización'));
    console.log(colors.blue('=============================================\n'));
    
    const orgId = '00000000-0000-0000-0000-000000000000';
    console.log(colors.green('Haciendo GET a ' + `${API_URL}/organizations/${orgId}`));
    const orgResponse = await axios.get(`${API_URL}/organizations/${orgId}`, { headers: authHeader });
    const orgData = printResponse('Organización', orgResponse);

    // 4. Obtener miembros de la organización
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('4. Obtener miembros de la organización'));
    console.log(colors.blue('=============================================\n'));
    
    console.log(colors.green('Haciendo GET a ' + `${API_URL}/organizations/${orgId}/members?page=1&limit=10`));
    const membersResponse = await axios.get(`${API_URL}/organizations/${orgId}/members?page=1&limit=10`, { headers: authHeader });
    const membersData = printResponse('Miembros', membersResponse);

    // 5. Crear una nueva organización
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('5. Crear una nueva organización'));
    console.log(colors.blue('=============================================\n'));
    
    const newOrgData = {
      name: 'Organización JavaScript',
      description: 'Esta es una organización creada desde JavaScript',
      slug: 'js-org',
      website: 'https://js-org.example.com',
      email: 'info@js-org.example.com',
      phone: '+123456789'
    };
    
    console.log(colors.green('Haciendo POST a ' + `${API_URL}/organizations`));
    console.log('Datos:', JSON.stringify(newOrgData, null, 2));
    
    try {
      const createOrgResponse = await axios.post(`${API_URL}/organizations`, newOrgData, { headers: authHeader });
      const newOrg = printResponse('Nueva organización creada', createOrgResponse);
      
      // Verificar que la organización fue creada correctamente
      console.log(colors.green('Verificando la nueva organización creada...'));
      const verifyOrgResponse = await axios.get(`${API_URL}/organizations/${newOrg.id}`, { headers: authHeader });
      printResponse('Verificación', verifyOrgResponse);
    } catch (error) {
      console.log(colors.red('Error al crear organización: ' + (error.response ? error.response.data : error.message)));
    }

    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('Demostración de API completada'));
    console.log(colors.blue('=============================================\n'));
    
    console.log(colors.green('Credenciales para uso manual:'));
    console.log('Email: admin@example.com');
    console.log('Password: Password123');
    console.log('Token:', token.substring(0, 30) + '...\n');
    
  } catch (error) {
    console.error(colors.red('Error en la demostración: ' + (error.response ? error.response.data : error.message)));
  }
}

// Ejecutar la demostración
runDemo();