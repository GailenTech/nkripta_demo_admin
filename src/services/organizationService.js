// src/services/organizationService.js
const { Organization, Profile } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

class OrganizationService {
  async listOrganizations(page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const result = await Organization.findAndCountAll({
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });
      
      return {
        items: result.rows,
        total: result.count,
        page,
        limit,
        totalPages: Math.ceil(result.count / limit)
      };
    } catch (error) {
      logger.error('Error al listar organizaciones:', error);
      throw error;
    }
  }
  async createOrganization(organizationData, createdById) {
    const transaction = await sequelize.transaction();
    
    try {
      // Crear slug único a partir del nombre
      const slug = organizationData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Verificar que el slug sea único
      const existingOrg = await Organization.findOne({
        where: { slug },
        transaction
      });
      
      if (existingOrg) {
        throw new Error('Ya existe una organización con un nombre similar');
      }
      
      // Crear la organización
      const organization = await Organization.create({
        ...organizationData,
        slug,
        createdById,
        createdAt: new Date()
      }, { transaction });
      
      await transaction.commit();
      return organization;
    } catch (error) {
      await transaction.rollback();
      logger.error('Error al crear organización:', error);
      throw error;
    }
  }

  async getOrganization(organizationId) {
    try {
      const organization = await Organization.findByPk(organizationId);
      
      if (!organization) {
        throw new Error('Organización no encontrada');
      }
      
      return organization;
    } catch (error) {
      logger.error('Error al obtener organización:', error);
      throw error;
    }
  }

  async updateOrganization(organizationId, organizationData, updatedById) {
    try {
      const organization = await Organization.findByPk(organizationId);
      
      if (!organization) {
        throw new Error('Organización no encontrada');
      }
      
      // Actualizar campos permitidos
      const allowedFields = ['name', 'description', 'website', 'phone', 'email', 'addressId'];
      
      allowedFields.forEach(field => {
        if (organizationData[field] !== undefined) {
          organization[field] = organizationData[field];
        }
      });
      
      // Actualizar metadatos
      organization.updatedAt = new Date();
      organization.updatedById = updatedById;
      
      await organization.save();
      
      return organization;
    } catch (error) {
      logger.error('Error al actualizar organización:', error);
      throw error;
    }
  }

  async getOrganizationMembers(organizationId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const result = await Profile.findAndCountAll({
        where: { organizationId },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });
      
      return {
        items: result.rows, // Changed from 'members' to 'items' to match frontend expectations
        total: result.count,
        page,
        limit,
        totalPages: Math.ceil(result.count / limit)
      };
    } catch (error) {
      logger.error('Error al obtener miembros de la organización:', error);
      throw error;
    }
  }
}

module.exports = new OrganizationService();
