# MindMap - Privacy-First Mind Mapping Tool

## Overview

MindMap is a privacy-first mind-mapping and idea organization tool built as part of the MinimalAuth suite. It allows users to visually structure their thoughts, brainstorm projects, and connect ideas into clear networks without requiring email or third-party platform dependencies. The application features a clean, modern interface built with React and TypeScript, emphasizing user privacy and data sovereignty through username/password authentication with recovery keys.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development tooling
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Server Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Authentication**: Passport.js with local strategy using scrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful endpoints with proper error handling and validation

### Data Storage Solutions
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Schema Design**: Four main entities - users, maps, nodes, and connections
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple
- **Data Validation**: Zod schemas shared between client and server for consistent validation

### Authentication and Authorization
- **Authentication Method**: Username/password with generated recovery keys (no email required)
- **Password Security**: Scrypt-based password hashing with salt
- **Session Management**: HTTP-only cookies with 24-hour expiration
- **Recovery System**: 4-segment recovery keys (format: XXXX-XXXX-XXXX-XXXX) for password reset
- **Route Protection**: Server-side authentication middleware and client-side protected routes

### Mind Map Features
- **Visual Canvas**: Drag-and-drop node positioning with real-time updates
- **Node Customization**: Multiple shapes (rectangle, circle, hexagon), colors, and text styling
- **Connections**: Visual links between nodes with curved path rendering
- **Data Export**: JSON export functionality for data portability
- **Search**: Full-text search across maps and nodes
- **Multiple Maps**: Users can create and manage multiple mind maps

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: Custom WebSocket constructor for Neon serverless compatibility

### UI and Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Lucide React**: Modern icon library for consistent iconography
- **shadcn/ui**: Pre-built component library built on Radix UI primitives

### Development and Build Tools
- **Vite**: Fast build tool with HMR and modern ES modules support
- **TypeScript**: Static typing throughout the entire stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer

### Authentication and Security
- **Passport.js**: Authentication middleware with local strategy
- **Express Session**: Session management with PostgreSQL persistence
- **Crypto Module**: Node.js built-in crypto for secure password hashing

### Validation and Forms
- **Zod**: Runtime type validation shared between client and server
- **React Hook Form**: Performant form library with minimal re-renders
- **Drizzle Zod**: Integration between Drizzle ORM and Zod for schema validation

### Deployment and Runtime
- **Replit Platform**: Integrated development and hosting environment
- **Node.js**: Server runtime with ES modules support
- **Express.js**: Web application framework for API endpoints and middleware