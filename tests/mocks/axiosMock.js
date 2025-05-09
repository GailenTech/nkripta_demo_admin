/**
 * Mock para axios que permite simular respuestas de API
 * durante las pruebas unitarias.
 */

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

// Crear instancia del mock
const mock = new MockAdapter(axios, { onNoMatch: "passthrough" });

// Resetear todos los mocks
const resetMocks = () => {
  mock.reset();
};

// Configurar una respuesta exitosa para una URL específica
const mockSuccess = (url, method, data, status = 200) => {
  const methodFn = method.toLowerCase();
  if (typeof mock[methodFn] === 'function') {
    mock[methodFn](url).reply(status, data);
  }
};

// Configurar un error para una URL específica
const mockError = (url, method, errorData, status = 400) => {
  const methodFn = method.toLowerCase();
  if (typeof mock[methodFn] === 'function') {
    mock[methodFn](url).reply(status, errorData);
  }
};

// Restaurar axios original (desactivar mocks)
const restore = () => {
  mock.restore();
};

module.exports = {
  mock,
  resetMocks,
  mockSuccess,
  mockError,
  restore
};