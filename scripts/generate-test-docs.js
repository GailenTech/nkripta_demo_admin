#!/usr/bin/env node

/**
 * Script para generar documentación de los resultados de pruebas
 * 
 * Este script procesa los resultados de las pruebas generados por Jest
 * y crea un informe en formato Markdown que puede ser incluido en la documentación
 * o en pull requests.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Configuración
const CONFIG = {
  junitReportPath: path.join(process.cwd(), 'test-reports', 'junit.xml'),
  htmlReportPath: path.join(process.cwd(), 'test-reports', 'test-report.html'),
  outputPath: path.join(process.cwd(), 'test-reports', 'test-summary.md'),
  failedTestsDetailsPath: path.join(process.cwd(), 'test-reports', 'failed-tests-details.md')
};

/**
 * Verifica si los archivos de reporte existen
 */
function checkReportFiles() {
  const junitExists = fs.existsSync(CONFIG.junitReportPath);
  const htmlExists = fs.existsSync(CONFIG.htmlReportPath);
  
  if (!junitExists || !htmlExists) {
    console.error(`${colors.red}Error: No se encontraron los archivos de reporte.${colors.reset}`);
    console.log(`${colors.yellow}Ejecute primero las pruebas con el comando:${colors.reset}`);
    console.log(`${colors.blue}npm run test:all-reports${colors.reset}`);
    process.exit(1);
  }
  
  return true;
}

/**
 * Extrae estadísticas básicas del reporte JUnit
 */
function extractJUnitStats() {
  try {
    const xmlContent = fs.readFileSync(CONFIG.junitReportPath, 'utf8');
    
    // Extraer información básica usando expresiones regulares
    const testsMatch = xmlContent.match(/tests="(\d+)"/);
    const failuresMatch = xmlContent.match(/failures="(\d+)"/);
    const errorsMatch = xmlContent.match(/errors="(\d+)"/);
    const timeMatch = xmlContent.match(/time="([\d\.]+)"/);
    
    // Extraer nombres de pruebas fallidas
    const failedTestsRegex = /<testcase.*?name="(.*?)".*?><failure/g;
    const failedTests = [];
    let match;
    
    while ((match = failedTestsRegex.exec(xmlContent)) !== null) {
      failedTests.push(match[1]);
    }
    
    return {
      total: testsMatch ? parseInt(testsMatch[1], 10) : 0,
      failures: failuresMatch ? parseInt(failuresMatch[1], 10) : 0,
      errors: errorsMatch ? parseInt(errorsMatch[1], 10) : 0,
      time: timeMatch ? parseFloat(timeMatch[1]) : 0,
      failedTests
    };
  } catch (error) {
    console.error(`${colors.red}Error al procesar el archivo JUnit: ${error.message}${colors.reset}`);
    return {
      total: 0,
      failures: 0,
      errors: 0,
      time: 0,
      failedTests: []
    };
  }
}

/**
 * Genera un informe en formato Markdown
 */
function generateMarkdownReport(stats) {
  const passed = stats.total - stats.failures - stats.errors;
  const passRate = stats.total > 0 ? ((passed / stats.total) * 100).toFixed(2) : '0.00';
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  
  let markdown = `# Resumen de Pruebas - ${dateStr} ${timeStr}\n\n`;
  
  // Añadir insignias de estado
  markdown += `![Total de Pruebas](https://img.shields.io/badge/Pruebas-${stats.total}-blue)\n`;
  markdown += `![Pruebas Exitosas](https://img.shields.io/badge/Exitosas-${passed}-success)\n`;
  
  if (stats.failures > 0 || stats.errors > 0) {
    markdown += `![Pruebas Fallidas](https://img.shields.io/badge/Fallidas-${stats.failures + stats.errors}-critical)\n`;
  } else {
    markdown += `![Pruebas Fallidas](https://img.shields.io/badge/Fallidas-0-success)\n`;
  }
  
  markdown += `![Tasa de Éxito](https://img.shields.io/badge/Éxito-${passRate}%25-${passRate >= 95 ? 'success' : passRate >= 80 ? 'yellow' : 'critical'})\n\n`;
  
  // Tabla de estadísticas
  markdown += `## Estadísticas\n\n`;
  markdown += `| Métrica | Valor |\n`;
  markdown += `| ------- | ----- |\n`;
  markdown += `| **Total Pruebas** | ${stats.total} |\n`;
  markdown += `| **Exitosas** | ${passed} |\n`;
  markdown += `| **Fallidas** | ${stats.failures} |\n`;
  markdown += `| **Errores** | ${stats.errors} |\n`;
  markdown += `| **Tiempo Total** | ${stats.time.toFixed(2)}s |\n`;
  markdown += `| **Tasa de Éxito** | ${passRate}% |\n\n`;
  
  // Añadir información sobre pruebas fallidas si hay alguna
  if (stats.failedTests.length > 0) {
    markdown += `## Pruebas Fallidas\n\n`;
    markdown += `Las siguientes pruebas han fallado y requieren atención:\n\n`;
    
    stats.failedTests.forEach(test => {
      markdown += `- ❌ \`${test}\`\n`;
    });
    
    markdown += `\nPara más detalles, consulte el informe HTML o los logs completos.\n\n`;
  }
  
  // Añadir enlaces a los reportes completos
  markdown += `## Informes Completos\n\n`;
  markdown += `- [Informe HTML](./test-report.html)\n`;
  markdown += `- [Informe JUnit XML](./junit.xml)\n\n`;
  
  // Añadir nota sobre CI/CD
  markdown += `## Integración con CI/CD\n\n`;
  markdown += `Este informe puede ser utilizado en flujos de CI/CD para visualizar los resultados de las pruebas.\n`;
  markdown += `Execute \`npm run test:all-reports\` para generar los informes completos.\n\n`;
  
  // Añadir nota de generación
  markdown += `---\n\n`;
  markdown += `*Informe generado automáticamente el ${dateStr} a las ${timeStr}*\n`;
  
  return markdown;
}

/**
 * Función principal
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}Generando documentación de resultados de pruebas...${colors.reset}`);
  
  // Verificar si existen los archivos de reporte
  if (!checkReportFiles()) {
    return;
  }
  
  // Extraer estadísticas
  const stats = extractJUnitStats();
  console.log(`${colors.green}Estadísticas extraídas: ${stats.total} pruebas, ${stats.failures} fallos, ${stats.errors} errores${colors.reset}`);
  
  // Generar informe Markdown
  const markdownReport = generateMarkdownReport(stats);
  
  // Guardar el informe
  const reportDir = path.dirname(CONFIG.outputPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(CONFIG.outputPath, markdownReport);
  console.log(`${colors.green}Informe guardado en: ${CONFIG.outputPath}${colors.reset}`);
  
  // Mostrar resultados en la consola
  console.log(`${colors.bright}${colors.blue}===================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}Resumen de pruebas${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}===================================${colors.reset}`);
  console.log(`${colors.bright}Total de pruebas: ${stats.total}${colors.reset}`);
  console.log(`${colors.green}Pruebas exitosas: ${stats.total - stats.failures - stats.errors}${colors.reset}`);
  
  if (stats.failures > 0 || stats.errors > 0) {
    console.log(`${colors.red}Pruebas fallidas: ${stats.failures + stats.errors}${colors.reset}`);
  } else {
    console.log(`${colors.green}Pruebas fallidas: 0${colors.reset}`);
  }
  
  console.log(`${colors.blue}Tiempo total: ${stats.time.toFixed(2)}s${colors.reset}`);
  
  const passRate = stats.total > 0 ? ((stats.total - stats.failures - stats.errors) / stats.total) * 100 : 0;
  
  if (passRate === 100) {
    console.log(`${colors.green}Tasa de éxito: 100%${colors.reset}`);
  } else if (passRate >= 80) {
    console.log(`${colors.yellow}Tasa de éxito: ${passRate.toFixed(2)}%${colors.reset}`);
  } else {
    console.log(`${colors.red}Tasa de éxito: ${passRate.toFixed(2)}%${colors.reset}`);
  }
}

// Ejecutar
main().catch(error => {
  console.error(`${colors.red}Error inesperado: ${error.message}${colors.reset}`);
  process.exit(1);
});