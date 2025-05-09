/**
 * Script de prueba para los endpoints de perfil
 * 
 * Este script prueba específicamente:
 * 1. La creación de perfiles
 * 2. Obtener miembros de una organización
 * 
 * Uso:
 * node scripts/test-profile-endpoints.js
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
const API_URL = process.env.API_URL || 'http://localhost:3000/api';
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
async function testProfileEndpoints() {
  try {
    // 1. Verificar que la API está en funcionamiento
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('1. Verificando que la API está en funcionamiento'));
    console.log(colors.blue('=============================================\n'));
    
    console.log(colors.green('Haciendo GET a ' + API_URL));
    const healthResponse = await axios.get(API_URL);
    printResponse('Estado de la API', healthResponse);

    // 2. Autenticación - Login
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('2. Autenticación - Iniciar sesión con el usuario admin'));
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

    // 3. Obtener perfil del usuario
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('3. Verificar perfil del usuario autenticado'));
    console.log(colors.blue('=============================================\n'));
    
    console.log(colors.green('Haciendo GET a ' + `${API_URL}/auth/me`));
    const profileResponse = await axios.get(`${API_URL}/auth/me`, { headers: authHeader });
    const profileData = printResponse('Perfil', profileResponse);
    
    // Extraer el ID de la organización del perfil
    const organizationId = profileData.organizationId;
    console.log(colors.green('ID de organización obtenido: ' + organizationId));

    // 4. Obtener miembros de la organización
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('4. Obtener miembros de la organización'));
    console.log(colors.blue('=============================================\n'));
    
    console.log(colors.green('Haciendo GET a ' + `${API_URL}/organizations/${organizationId}/members?page=1&limit=10`));
    const membersResponse = await axios.get(`${API_URL}/organizations/${organizationId}/members?page=1&limit=10`, { headers: authHeader });
    const membersData = printResponse('Miembros', membersResponse);

    // 5. Crear un nuevo perfil
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('5. Crear un nuevo perfil en la organización'));
    console.log(colors.blue('=============================================\n'));
    
    const timestamp = Date.now();
    const newProfileData = {
      email: `test.user.${timestamp}@example.com`,
      firstName: `Test`,
      lastName: `User ${timestamp}`,
      organizationId: organizationId,
      roles: ['USER']
    };
    
    console.log(colors.green('Haciendo POST a ' + `${API_URL}/profiles`));
    console.log('Datos:', JSON.stringify(newProfileData, null, 2));
    
    try {
      const createProfileResponse = await axios.post(`${API_URL}/profiles`, newProfileData, { headers: authHeader });
      const newProfile = printResponse('Nuevo perfil creado', createProfileResponse);
      
      // Verificar que el perfil fue creado correctamente
      if (newProfile.id) {
        console.log(colors.green('Verificando el nuevo perfil creado...'));
        const verifyProfileResponse = await axios.get(`${API_URL}/profiles/${newProfile.id}`, { headers: authHeader });
        printResponse('Verificación', verifyProfileResponse);
      }
    } catch (error) {
      console.log(colors.red('Error al crear perfil: ' + (error.response ? JSON.stringify(error.response.data) : error.message)));
      console.log(colors.yellow('Detalles completos del error:'));
      console.log(error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : error);
    }

    // 6. Verificar la lista actualizada de miembros
    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('6. Verificar la lista actualizada de miembros'));
    console.log(colors.blue('=============================================\n'));
    
    console.log(colors.green('Haciendo GET a ' + `${API_URL}/organizations/${organizationId}/members?page=1&limit=10`));
    const updatedMembersResponse = await axios.get(`${API_URL}/organizations/${organizationId}/members?page=1&limit=10`, { headers: authHeader });
    printResponse('Miembros actualizados', updatedMembersResponse);

    console.log(colors.blue('\n============================================='));
    console.log(colors.blue('Prueba de endpoints de perfil completada'));
    console.log(colors.blue('=============================================\n'));
    
  } catch (error) {
    console.error(colors.red('Error en la prueba: ' + (error.response ? JSON.stringify(error.response.data) : error.message)));
    console.log(colors.yellow('Detalles completos del error:'));
    console.log(error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : error);
  }
}

// Ejecutar la prueba
testProfileEndpoints();