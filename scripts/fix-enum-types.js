#!/usr/bin/env node

/**
 * Script para corregir los problemas con tipos ENUM en PostgreSQL
 * Específicamente soluciona el problema de arrays de ENUMs para el campo roles
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');

// Reemplazar chalk con funciones simples de console.log para compatibilidad
const log = {
  blue: (text) => console.log('\x1b[34m%s\x1b[0m', text),
  green: (text) => console.log('\x1b[32m%s\x1b[0m', text),
  yellow: (text) => console.log('\x1b[33m%s\x1b[0m', text),
  red: (text) => console.log('\x1b[31m%s\x1b[0m', text),
  cyan: (text) => console.log('\x1b[36m%s\x1b[0m', text)
};

async function fixEnumTypes() {
  try {
    log.blue('🔧 Iniciando corrección de tipos ENUM en PostgreSQL...');
    
    // Comprobar conexión a la base de datos
    await sequelize.authenticate();
    log.green('✅ Conexión a la base de datos establecida');
    
    // Verificar si la tabla Profile existe
    log.yellow('🔍 Verificando si la tabla Profile existe...');
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Profile'
      );
    `;
    const [tableExists] = await sequelize.query(tableExistsQuery);
    
    if (!tableExists[0].exists) {
      log.yellow('⚠️ La tabla Profile no existe. No es necesario hacer correcciones.');
      return;
    }
    
    // Verificar si el tipo enum_Profile_roles existe
    log.yellow('🔍 Verificando si el tipo enum_Profile_roles existe...');
    const enumExistsQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'enum_profile_roles'
      );
    `;
    const [enumExists] = await sequelize.query(enumExistsQuery);
    
    // Paso 1: Si la columna roles existe y es de tipo ENUM array, eliminar restricciones y cambiar a VARCHAR array
    if (enumExists[0].exists) {
      log.yellow('🔄 El tipo enum_Profile_roles existe. Modificando columna roles...');
      
      // Primero crear una columna temporal
      log.yellow('🔄 Creando columna temporal roles_new...');
      await sequelize.query(`
        ALTER TABLE "Profile" 
        ADD COLUMN roles_new VARCHAR(255)[] DEFAULT ARRAY['USER']::VARCHAR(255)[];
      `);
      
      // Copiar los datos de la columna original a la nueva
      log.yellow('🔄 Copiando datos de roles a roles_new...');
      await sequelize.query(`
        UPDATE "Profile" 
        SET roles_new = array_agg(trim(both '"' from t.role))::VARCHAR(255)[]
        FROM (
          SELECT p.id, unnest(p.roles)::TEXT as role
          FROM "Profile" p
        ) t
        WHERE "Profile".id = t.id;
      `);
      
      // Eliminar la columna original
      log.yellow('🔄 Eliminando columna roles...');
      await sequelize.query(`
        ALTER TABLE "Profile" DROP COLUMN roles;
      `);
      
      // Renombrar la columna temporal
      log.yellow('🔄 Renombrando columna roles_new a roles...');
      await sequelize.query(`
        ALTER TABLE "Profile" 
        RENAME COLUMN roles_new TO roles;
      `);
      
      // Establecer la columna como NOT NULL si es necesario
      log.yellow('🔄 Estableciendo restricciones en la columna roles...');
      await sequelize.query(`
        ALTER TABLE "Profile" 
        ALTER COLUMN roles SET DEFAULT ARRAY['USER']::VARCHAR(255)[];
      `);
      
      // Verificar si el tipo enum_Profile_roles ya no se usa y eliminarlo
      log.yellow('🔄 Intentando eliminar el tipo enum_Profile_roles...');
      try {
        await sequelize.query(`DROP TYPE IF EXISTS "enum_Profile_roles";`);
        log.green('✅ Tipo enum_Profile_roles eliminado correctamente');
      } catch (dropError) {
        log.yellow('⚠️ No se pudo eliminar el tipo enum_Profile_roles. Puede estar en uso en otras columnas.');
      }
      
      log.green('✅ Columna roles modificada correctamente');
    } else {
      log.green('✅ El tipo enum_Profile_roles no existe. No es necesario modificar la columna.');
    }
    
    // Sincronizar todos los modelos para asegurar consistencia
    log.yellow('🔄 Sincronizando modelos...');
    await sequelize.sync({ alter: true });
    
    log.green('✅ Corrección completada correctamente');
    
    // Cerrar conexión
    await sequelize.close();
    
  } catch (error) {
    log.red('❌ Error al corregir tipos ENUM:');
    console.error(error);
    
    // Cerrar conexión en caso de error
    try {
      await sequelize.close();
    } catch (closeError) {
      log.red('Error adicional al cerrar la conexión:');
      console.error(closeError);
    }
    
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixEnumTypes()
    .then(() => {
      log.green('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch(err => {
      log.red('❌ Error en el script:');
      console.error(err);
      process.exit(1);
    });
}

module.exports = { fixEnumTypes };