// src/services/profileService.js
const { Profile, Organization } = require('../models');
const logger = require('../utils/logger');

class ProfileService {
  async getProfile(profileId) {
    try {
      const profile = await Profile.findByPk(profileId, {
        include: [{ model: Organization }]
      });

      if (!profile) {
        throw new Error('Perfil no encontrado');
      }

      return profile;
    } catch (error) {
      logger.error('Error al obtener perfil:', error);
      throw error;
    }
  }

  async updateProfile(profileId, profileData, currentUserId) {
    try {
      const profile = await Profile.findByPk(profileId);
      
      if (!profile) {
        throw new Error('Perfil no encontrado');
      }
      
      // Actualizar campos permitidos
      const allowedFields = ['firstName', 'middleName', 'lastName', 'position', 
                            'phone', 'mobile', 'avatar', 'preferredLanguage', 
                            'publicKey', 'privateKey'];
      
      allowedFields.forEach(field => {
        if (profileData[field] !== undefined) {
          profile[field] = profileData[field];
        }
      });
      
      // Actualizar metadatos
      profile.updatedAt = new Date();
      profile.updatedById = currentUserId;
      
      await profile.save();
      
      return profile;
    } catch (error) {
      logger.error('Error al actualizar perfil:', error);
      throw error;
    }
  }

  async listProfiles(organizationId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      const result = await Profile.findAndCountAll({
        where: { organizationId },
        limit,
        offset,
        include: [{ model: Organization }],
        order: [['createdAt', 'DESC']]
      });
      
      return {
        profiles: result.rows,
        total: result.count,
        page,
        limit,
        totalPages: Math.ceil(result.count / limit)
      };
    } catch (error) {
      logger.error('Error al listar perfiles:', error);
      throw error;
    }
  }
}

module.exports = new ProfileService();