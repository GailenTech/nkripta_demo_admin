// src/services/authService.js
const { cognitoIdentityServiceProvider, cognitoConfig } = require('../config/cognito');
const { Profile, Organization } = require('../models');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class AuthService {
  async registerUser(userData) {
    try {
      // Verificar si la organización existe
      const organization = await Organization.findByPk(userData.organizationId);
      if (!organization) {
        throw new Error('La organización especificada no existe');
      }

      // Registrar usuario en Cognito con todos los atributos necesarios
      const params = {
        ClientId: cognitoConfig.ClientId,
        Username: userData.email,
        Password: userData.password,
        UserAttributes: [
          {
            Name: 'email',
            Value: userData.email
          },
          {
            Name: 'custom:organizationId',
            Value: userData.organizationId
          },
          {
            Name: 'given_name',
            Value: userData.firstName || ''
          },
          {
            Name: 'family_name',
            Value: userData.lastName || ''
          },
          {
            Name: 'custom:roles',
            Value: JSON.stringify(userData.roles || ['USER'])
          }
        ]
      };

      // Añadir campos opcionales si están presentes
      if (userData.phone) {
        params.UserAttributes.push({
          Name: 'phone_number',
          Value: userData.phone
        });
      }

      const cognitoResponse = await cognitoIdentityServiceProvider.signUp(params).promise();
      const sub = cognitoResponse.UserSub;

      // Crear perfil en la base de datos (con referencia a Cognito, pero sin duplicar datos)
      const profile = await Profile.create({
        email: userData.email, // Mantenemos el email para búsquedas rápidas
        sub, // Identificador único de Cognito
        organizationId: userData.organizationId, // Relación esencial con la organización
        roles: userData.roles || ['USER'] // Mantener roles localmente para control de acceso rápido
      });

      return {
        success: true,
        message: 'Usuario registrado correctamente',
        profileId: profile.id
      };
    } catch (error) {
      logger.error('Error al registrar usuario:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Autenticar con Cognito
      const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: cognitoConfig.ClientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      };

      const cognitoResponse = await cognitoIdentityServiceProvider.initiateAuth(params).promise();
      const { AccessToken, IdToken, RefreshToken } = cognitoResponse.AuthenticationResult;

      // Obtener datos del usuario desde Cognito
      const userParams = {
        AccessToken: AccessToken
      };
      const cognitoUser = await cognitoIdentityServiceProvider.getUser(userParams).promise();
      
      // Parsear atributos de usuario
      const userAttributes = {};
      cognitoUser.UserAttributes.forEach(attr => {
        userAttributes[attr.Name] = attr.Value;
      });

      // Obtener referencia al perfil en la base de datos
      const profile = await Profile.findOne({
        where: { email },
        include: [{ model: Organization }]
      });

      if (!profile) {
        logger.error(`Perfil de usuario no encontrado para email: ${email}`);
        throw new Error('Perfil de usuario no encontrado');
      }

      // Extraer roles desde Cognito (o usar los de la base de datos como fallback)
      let roles;
      try {
        roles = userAttributes['custom:roles'] ? JSON.parse(userAttributes['custom:roles']) : profile.roles;
      } catch (e) {
        logger.warn('Error al parsear roles desde Cognito, usando roles locales', e);
        roles = profile.roles;
      }

      // Generar token JWT para uso interno con datos de Cognito
      const token = jwt.sign(
        {
          sub: userAttributes.sub,
          email: userAttributes.email,
          profileId: profile.id,
          organizationId: userAttributes['custom:organizationId'] || profile.organizationId,
          roles: roles
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      return {
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken,
        token,
        profile: {
          id: profile.id,
          email: userAttributes.email,
          firstName: userAttributes.given_name || '',
          lastName: userAttributes.family_name || '',
          roles: roles,
          organization: profile.Organization ? {
            id: profile.Organization.id,
            name: profile.Organization.name
          } : null
        }
      };
    } catch (error) {
      logger.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      // PARA DESARROLLO: Permitir token de desarrollo frontend
      if (process.env.NODE_ENV === 'development' && (
        token === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi11c2VyLWlkIiwiZW1haWwiOiJhZG1pbkBua3JpcHRhLmNvbSIsInByb2ZpbGVJZCI6ImFkbWluLTEyMyIsIm9yZ2FuaXphdGlvbklkIjoib3JnLTEyMyIsInJvbGVzIjpbIkFETUlOIiwiVVNFUiJdLCJpYXQiOjE2OTYxNzM3NjksImV4cCI6NDEwMjQ0NDgwMH0.mQ0DZZfWGw7yCaTeVGu2oEK-8ibfN4B_uPNbgMfmhO0' ||
        token === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi11c2VyLWlkIiwiZW1haWwiOiJhZG1pbkBua3JpcHRhLmNvbSIsInByb2ZpbGVJZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMSIsIm9yZ2FuaXphdGlvbklkIjoiMTIzZTQ1NjctZTg5Yi0xMmQzLWE0NTYtNDI2NjE0MTc0MDAwIiwicm9sZXMiOlsiQURNSU4iLCJVU0VSIl0sImlhdCI6MTY5NjE3Mzc2OSwiZXhwIjo0MTAyNDQ0ODAwfQ.kXaXsOWQQDTsZbkK9Cg7QZ8Q7dhYiRmXfm0RXNtZmKI'
      )) {
        logger.info('Autenticación con token de desarrollo para frontend');
        
        // Crear un perfil simulado para desarrollo
        const mockProfile = {
          id: 'admin-123',
          email: 'admin@nkripta.com',
          organizationId: 'org-123',
          roles: ['ADMIN', 'USER'],
          sub: 'admin-user-id',
          Organization: {
            id: 'org-123',
            name: 'Organización de Desarrollo'
          }
        };
        
        return {
          profile: mockProfile,
          decoded: {
            sub: 'admin-user-id',
            email: 'admin@nkripta.com',
            profileId: 'admin-123',
            organizationId: 'org-123',
            roles: ['ADMIN', 'USER']
          }
        };
      }
      
      // Verificación normal para otros casos
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar si el usuario sigue existiendo en la base de datos local
      const profile = await Profile.findOne({
        where: { id: decoded.profileId },
        include: [{ model: Organization }]
      });

      if (!profile) {
        throw new Error('Usuario no encontrado en la base de datos local');
      }

      // Intentar obtener datos actualizados desde Cognito si tenemos un accessToken
      // Nota: Este paso puede omitirse en verificaciones frecuentes para mejorar el rendimiento
      // En una implementación completa, podrías añadir un parámetro para controlar esto
      if (decoded.accessToken) {
        try {
          const userParams = {
            AccessToken: decoded.accessToken
          };
          const cognitoUser = await cognitoIdentityServiceProvider.getUser(userParams).promise();
          
          // Parsear atributos de usuario
          const userAttributes = {};
          cognitoUser.UserAttributes.forEach(attr => {
            userAttributes[attr.Name] = attr.Value;
          });
          
          // Actualizar campos si es necesario (ejemplo: roles)
          if (userAttributes['custom:roles']) {
            try {
              const cognitoRoles = JSON.parse(userAttributes['custom:roles']);
              if (JSON.stringify(cognitoRoles) !== JSON.stringify(profile.roles)) {
                profile.roles = cognitoRoles;
                await profile.save();
                logger.info(`Roles actualizados desde Cognito para el usuario ${profile.email}`);
              }
            } catch (e) {
              logger.warn('Error al parsear roles desde Cognito', e);
            }
          }
        } catch (cognitoError) {
          // Si hay un error al obtener datos de Cognito, continuamos con los datos locales
          logger.warn('No se pudieron obtener datos actualizados de Cognito:', cognitoError.message);
        }
      }

      return {
        profile,
        decoded
      };
    } catch (error) {
      logger.error('Error al verificar token:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const params = {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: cognitoConfig.ClientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken
        }
      };

      const cognitoResponse = await cognitoIdentityServiceProvider.initiateAuth(params).promise();
      const { AccessToken, IdToken } = cognitoResponse.AuthenticationResult;

      return {
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken // Devolvemos el mismo refreshToken ya que Cognito no genera uno nuevo
      };
    } catch (error) {
      logger.error('Error al refrescar token:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();