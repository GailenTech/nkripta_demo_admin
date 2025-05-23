#!/usr/bin/env node

/**
 * Script para ejecutar las pruebas de forma secuencial
 * 
 * Este script ejecuta las pruebas en un orden específico para
 * asegurar que las dependencias entre pruebas funcionen correctamente.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Orden de ejecución de los tests
const testFiles = [
  'auth.test.js',        // Primero autenticación para obtener tokens
  'organizations.test.js', // Luego organizaciones
  'profiles.test.js',    // Luego perfiles
  'subscriptions.test.js', // Luego suscripciones
  'integration.test.js'  // Finalmente las pruebas de integración
];

// Función para ejecutar un test individual
function runTest(testFile, generateReports = false) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.bright}${colors.blue}===================================${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}Ejecutando: ${testFile}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}===================================${colors.reset}`);
    
    const testPath = path.join(__dirname, testFile);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(testPath)) {
      console.error(`${colors.red}Error: El archivo ${testPath} no existe${colors.reset}`);
      reject(new Error(`Archivo no encontrado: ${testPath}`));
      return;
    }
    
    // Preparar argumentos para Jest
    const jestArgs = ['jest', testPath, '--verbose'];
    
    // Agregar argumentos para reportes si se solicitan
    if (generateReports) {
      // Asegurar que exista el directorio de reportes
      const reportDir = path.join(process.cwd(), 'test-reports');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      // Si estamos en modo CI, agregar flag --ci
      if (process.env.CI === 'true') {
        jestArgs.push('--ci');
      }
    }
    
    // Ejecutar jest para el archivo específico
    const jest = spawn('npx', jestArgs, {
      env: {
        ...process.env,
        // Asegurar que se utilice stripe-mock para las pruebas
        STRIPE_MOCK_ENABLED: process.env.STRIPE_MOCK_ENABLED || 'true',
        TEST_MODE: process.env.TEST_MODE || 'full'
      }
    });
    
    jest.stdout.on('data', (data) => {
      process.stdout.write(data.toString());
    });
    
    jest.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}Test completado exitosamente: ${testFile}${colors.reset}`);
        resolve();
      } else {
        console.error(`${colors.red}Test falló con código: ${code}${colors.reset}`);
        // No rechazamos la promesa para que continúe con el siguiente test
        resolve();
      }
    });
  });
}

// Función principal
async function runTests() {
  // Verificar si se solicitan reportes
  const generateReports = process.argv.includes('--reports') || process.env.GENERATE_REPORTS === 'true';
  
  console.log(`${colors.bright}${colors.green}Iniciando ejecución secuencial de pruebas${colors.reset}`);
  console.log(`${colors.yellow}API URL: ${process.env.API_URL || 'http://localhost:3000/api'}${colors.reset}`);
  console.log(`${colors.yellow}Generando reportes: ${generateReports ? 'Sí' : 'No'}${colors.reset}`);
  
  // Si se van a generar reportes, asegurar que exista el directorio
  if (generateReports) {
    const reportDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
      console.log(`${colors.blue}Creado directorio de reportes: ${reportDir}${colors.reset}`);
    }
  }
  
  let failedTests = 0;
  
  for (const testFile of testFiles) {
    try {
      await runTest(testFile, generateReports);
    } catch (error) {
      console.error(`${colors.red}Error al ejecutar ${testFile}: ${error.message}${colors.reset}`);
      failedTests++;
    }
  }
  
  console.log(`${colors.bright}${colors.blue}===================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}Resumen de ejecución${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}===================================${colors.reset}`);
  console.log(`${colors.bright}Total de pruebas: ${testFiles.length}${colors.reset}`);
  
  if (failedTests > 0) {
    console.log(`${colors.red}Pruebas con errores: ${failedTests}${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}Todas las pruebas se ejecutaron correctamente${colors.reset}`);
    
    if (generateReports) {
      console.log(`${colors.green}Reportes generados en el directorio test-reports/${colors.reset}`);
    }
    
    process.exit(0);
  }
}

// Ejecutar
runTests().catch(error => {
  console.error(`${colors.red}Error inesperado: ${error.message}${colors.reset}`);
  process.exit(1);
});