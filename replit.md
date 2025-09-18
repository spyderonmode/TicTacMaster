# TicTac 3x5 Game

## Overview

This is a full-stack web application for a strategic Tic-Tac-Toe game played on a unique 3x5 grid. The application features multiple game modes (AI, pass-and-play, and online multiplayer), real-time gameplay through WebSockets, and a modern React frontend with a Node.js/Express backend. The project aims to provide an engaging and accessible gaming experience with features like comprehensive achievement tracking, leaderboards, and a dynamic sharing system.

## User Preferences

Preferred communication style: Simple, everyday language.

**Game Abandonment Preference**: Only abandon games when users explicitly exit rooms (Leave Room/Main Menu buttons), NOT when browser is closed or connection lost.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: React Query (TanStack Query)
- **UI Components**: Radix UI components with custom styling via shadcn/ui
- **Styling**: Tailwind CSS with CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit Auth with OpenID Connect
- **Real-time Communication**: WebSockets for live game updates
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Relational design with tables for users, rooms, games, moves, room participants, achievements, and user themes.
- **Migrations**: Drizzle Kit for database schema management

### Core Features
- **Custom Game Logic**: 3x5 grid Tic-Tac-Toe with diagonal-only winning conditions, server-side move validation, and real-time state synchronization.
- **AI Player**: Multi-difficulty AI (random, strategic, minimax-like) optimized for diagonal patterns.
- **Authentication System**: Replit Auth integration, secure server-side sessions, user management including guest users.
- **Real-time Features**: WebSocket server for game updates, connection management, and message broadcasting.
- **Room and Game Management**: Private/public rooms, AI, pass-and-play, and online multiplayer modes, spectator support, player statistics.
- **Achievement System**: Comprehensive achievement tracking with visual borders and seasonal themes.
- **Internationalization**: Multi-language support (English, Arabic, Bengali, Hindi, Spanish, Indonesian) with full RTL support for Arabic.
- **User Interaction**: Real-time chat system, friend requests, online status indicators, user blocking, and room invitation system.
- **UI/UX**: Dynamic sharing system, responsive mobile layouts, custom themes, animated loading screens, and visual effects for wins and achievements.

## External Dependencies

### Authentication
- **Replit Auth**: OAuth2 provider for user authentication
- **OpenID Connect**: Standard protocol for identity verification

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **connect-pg-simple**: PostgreSQL session store

### UI and Styling
- **Radix UI**: Accessible, unstyled UI components
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **framer-motion**: For animations (used selectively for specific effects)

### Development Tools
- **Vite**: Fast build tool
- **TypeScript**: Type safety
- **ESLint/Prettier**: Code quality and formatting

### Email Service
- **Nodemailer**: For SMTP email sending (verification and password reset)

### Other Integrations
- **Unsplash**: Source for bot avatars (animal/nature images)