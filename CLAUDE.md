# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js backend API for managing organizations, user profiles, and subscriptions, integrating:
- PostgreSQL database (via Sequelize ORM)
- AWS Cognito for authentication
- Stripe for payment processing
- Express for API routing

## Commands

### Development
```bash
# Install dependencies
npm install

# Start development server with hot-reload
npm run dev

# Start production server
npm start

# Run tests
npm test
```

## Environment Setup

The application requires a `.env` file with the following variables:
```
NODE_ENV=development
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nkripta
DB_USER=postgres
DB_PASSWORD=postgres

# AWS Cognito
COGNITO_USER_POOL_ID=region_userPoolId
COGNITO_CLIENT_ID=clientId
COGNITO_REGION=region

# Stripe
STRIPE_SECRET_KEY=sk_test_yoursecretkey
STRIPE_WEBHOOK_SECRET=whsec_yoursecretkey

# JWT
JWT_SECRET=yoursecretkey
JWT_EXPIRES_IN=1d
```

## Architecture

### Core Components

1. **Models** - Sequelize models for data entities:
   - `Organization` - Companies/businesses
   - `Profile` - User profiles associated with organizations
   - `Subscription` - Billing subscriptions linked to profiles and organizations

2. **Controllers** - Handle API request/response logic:
   - `authController` - Authentication operations
   - `organizationController` - Organization CRUD operations
   - `profileController` - User profile management
   - `subscriptionController` - Subscription and billing management

3. **Services** - Business logic implementation:
   - `authService` - Cognito authentication and JWT token handling
   - `organizationService` - Organization business logic
   - `profileService` - User profile business logic
   - `subscriptionService` - Subscription and payment processing

4. **Middleware**:
   - `auth.js` - JWT authentication and role verification
   - `errorHandler.js` - Centralized error handling

5. **Routes** - API endpoint definitions:
   - `/api/auth/*` - Authentication endpoints
   - `/api/profiles/*` - User profile management 
   - `/api/organizations/*` - Organization management
   - `/api/billing/*` - Subscription management

### Authentication Flow

1. Users register/login through Cognito
2. Upon successful authentication, a JWT token is generated
3. The JWT contains user profile ID, organization ID, and roles
4. APIs use the `auth` middleware to validate tokens and `checkRole` to verify permissions

### Database Relationships

- Organizations have many Profiles (one-to-many)
- Profiles belong to one Organization (many-to-one)
- Profiles have many Subscriptions (one-to-many)
- Organizations have many Subscriptions (one-to-many)

## Logging

Winston logger is configured to:
- Log to console with color formatting
- Write errors to `logs/error.log`
- Write all logs to `logs/combined.log`
- Use JSON format with timestamps in files