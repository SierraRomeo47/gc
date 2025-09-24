# FuelEU Maritime Compliance Management Platform

## Overview

This is a comprehensive FuelEU Maritime compliance management platform designed to help shipping companies monitor fuel consumption, manage regulatory compliance, and handle credit pooling/banking according to FuelEU Maritime regulations. The platform provides vessel management, GHG intensity tracking, compliance reporting, penalty calculations, and credit trading capabilities for maritime operators navigating the evolving regulatory landscape.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type-safe component development
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Radix UI components with shadcn/ui design system implementation
- **Styling**: Tailwind CSS with custom maritime-themed color palette and spacing system
- **State Management**: TanStack Query for server state management and data fetching
- **Charts**: Recharts library for fuel consumption and compliance data visualization

### Component Architecture
- **Design System**: Maritime-themed component library with consistent spacing (Tailwind units 2, 4, 8, 12, 16, 20)
- **Color Palette**: Professional maritime blues with functional compliance colors
- **Typography**: Roboto and Open Sans fonts via Google Fonts CDN
- **Layout**: Responsive grid-based layouts with hover effects and elevation states
- **Navigation**: Tab-based navigation system with mobile-responsive design

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ESM module support
- **Database Layer**: Drizzle ORM for type-safe database operations
- **API Pattern**: RESTful API design with /api prefix routing
- **Session Management**: Express sessions with PostgreSQL session store
- **Development**: Hot module replacement with Vite integration

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless configuration
- **ORM**: Drizzle ORM with schema-driven development
- **Migrations**: Drizzle Kit for database schema migrations
- **Connection Pooling**: Neon serverless connection pooling with WebSocket support

### Core Business Logic Components
- **Vessel Management**: Comprehensive vessel data tracking (IMO numbers, vessel types, tonnage, flags)
- **Compliance Monitoring**: GHG intensity calculations, target tracking, and compliance status assessment
- **Credit Pooling System**: Banking, borrowing, and trading of compliance credits between vessels
- **Penalty Calculator**: Automated penalty calculations based on compliance deficits
- **Voyage Data Management**: Fuel consumption tracking, voyage-specific compliance metrics
- **Reporting System**: Export capabilities for compliance documentation

### Authentication and Authorization
- **User System**: Basic user management with username/password authentication
- **Session Storage**: PostgreSQL-backed session management
- **Security**: Input validation with Zod schema validation

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: Real-time database connections via ws library

### UI and Styling Dependencies
- **Radix UI**: Comprehensive accessible component primitives for dialogs, dropdowns, navigation, forms
- **Tailwind CSS**: Utility-first CSS framework with custom maritime design tokens
- **Google Fonts**: Roboto and Open Sans font families via CDN
- **Lucide React**: Icon library for maritime and business iconography

### Data Visualization
- **Recharts**: React charting library for fuel consumption trends and compliance metrics
- **Embla Carousel**: Touch-friendly carousel for data presentation

### Development Tools
- **TypeScript**: Type safety across full-stack application
- **Vite**: Fast build tooling with development server
- **ESBuild**: JavaScript bundling for production builds
- **Drizzle Kit**: Database schema management and migration tooling

### Form Management
- **React Hook Form**: Form state management with validation
- **Hookform Resolvers**: Integration layer for schema validation
- **Date-fns**: Date manipulation for voyage and compliance date handling

### Utility Libraries
- **Class Variance Authority**: Type-safe CSS class composition
- **clsx**: Conditional CSS class management
- **CMDK**: Command palette functionality for navigation
- **Nanoid**: Unique ID generation for entities