/**
 * Configuración de Jest para las pruebas
 */

module.exports = {
  // Directorio raíz desde donde Jest debería buscar archivos
  rootDir: '..',
  
  // Patrón de archivos que contienen pruebas
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  
  // Rutas a ignorar
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  
  // Tiempo máximo de ejecución para cada test
  testTimeout: 10000,
  
  // Reportes detallados
  verbose: true,
  
  // Configurar un reporte de cobertura
  collectCoverage: false,
  
  // Se debe establecer si el backend ya está en ejecución 
  // o si debemos iniciar uno como parte de las pruebas
  globalSetup: undefined, // '<rootDir>/tests/globalSetup.js',
  globalTeardown: undefined, // '<rootDir>/tests/globalTeardown.js',
  
  // Variables de entorno para las pruebas
  testEnvironment: 'node',
  
  // Número máximo de trabajadores 
  maxWorkers: '50%'
};