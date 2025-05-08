/**
 * Configuración de Jest para tests de nkripta_admin
 */

module.exports = {
  // Directorio raíz donde Jest buscará los archivos
  rootDir: '../',
  
  // Patrón para los archivos de test
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  
  // Ignorar directorios
  testPathIgnorePatterns: ['/node_modules/'],
  
  // Tiempo máximo de ejecución para cada test (en ms)
  testTimeout: 30000,
  
  // Mostrar salida de consola durante las pruebas
  verbose: true,
  
  // Ejecutar tests en modo secuencial
  // Esto es importante porque tenemos dependencias entre tests
  // (un test usa los datos creados por otro)
  runInBand: true,
  
  // No cachear las transformaciones (para asegurar que las pruebas corren con código fresco)
  cache: false,
  
  // Variables de entorno para tests
  globals: {
    API_URL: 'http://localhost:3000/api'
  }
};