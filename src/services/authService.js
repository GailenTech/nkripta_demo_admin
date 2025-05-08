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

      // Registrar usuario en Cognito
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
          }
        ]
      };

      const cognitoResponse = await cognitoIdentityServiceProvider.signUp(params).promise();
      const sub = cognitoResponse.UserSub;

      // Crear perfil en la base de datos
      const profile = await Profile.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        cognitoUsername: sub,
        sub,
        organizationId: userData.organizationId,
        roles: userData.roles || ['USER']
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

      // Obtener perfil del usuario
      const profile = await Profile.findOne({
        where: { email },
        include: [{ model: Organization }]
      });

      if (!profile) {
        throw new Error('Perfil de usuario no encontrado');
      }

      // Generar token JWT para uso interno
      const token = jwt.sign(
        {
          sub: profile.sub,
          email: profile.email,
          profileId: profile.id,
          organizationId: profile.organizationId,
          roles: profile.roles
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
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          roles: profile.roles,
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verificar si el usuario sigue existiendo
      const profile = await Profile.findOne({
        where: { id: decoded.profileId },
        include: [{ model: Organization }]
      });

      if (!profile) {
        throw new Error('Usuario no encontrado');
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