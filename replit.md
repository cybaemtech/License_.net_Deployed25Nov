# Overview

LicenseHub is an enterprise software license management system designed for efficient tracking, monitoring, and management of software licenses. It centralizes software procurement, automates renewal cycles, and ensures compliance. Key capabilities include automated expiry notifications, multi-currency cost tracking, client and vendor management, and detailed reporting. The system aims to streamline operations, enhance regulatory adherence, and provide a comprehensive solution for software license lifecycle management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **Styling**: Tailwind CSS, supporting dark mode and responsive design.
- **State Management**: React Hooks.
- **Routing**: React Router DOM for SPA navigation.
- **Build Tool**: Vite.
- **Component Structure**: Modular, with reusable components.

## Backend Architecture
- **Runtime**: PHP 8.2+.
- **Architecture**: RESTful API with JSON responses.
- **Authentication**: Session-based with PHP sessions (note: currently has security limitations, not production-ready).
- **Database Driver**: PDO for MySQL interaction.
- **Email Service**: PHP native `mail()` function with custom SimpleMailService wrapper.

## Data Storage Solutions
- **Primary Database**: MySQL.
- **Key Tables**: `users`, `license_purchases`, `clients`, `currencies`, `email_notifications`, `notification_settings`, `vendors`, `tools`, `license_allocations`.
- **UUID Support**: Database tables are configured to support UUIDs for primary keys.

## Authentication & Authorization
- **Authentication**: Email/password with bcrypt hashing.
- **Session Management**: Basic session handling.
- **User Roles**: Supports Admin, Accounts, and User roles with granular CRUD permission controls (implemented RBAC).

## Notification System Architecture
- **Email Provider**: PHP native `mail()` function.
- **Trigger Points**: Configurable days before license expiry.
- **Delivery Method**: Professional HTML email templates with urgency-based color coding.
- **Recipients**: Client email addresses with automatic CC to admin.
- **Per-User Settings**: Notification preferences stored in `notification_settings` table.
- **Automated Scheduler**: Runs via cPanel cron job daily.
- **Configuration UI**: Web-based settings interface.
- **Duplicate Prevention**: Database-backed tracking prevents sending duplicate notifications.
- **Hybrid Email System**: Supports development (logs to files) and production (sends actual emails) modes.

## UI/UX Decisions
- **Design Template**: Admin dashboard template.
- **Theming**: Dark mode support via Tailwind CSS.
- **Forms**: Multi-step license form, direct input fields for clients/vendors.
- **Currency Display**: Prioritizes INR display with real-time conversion; includes a dedicated currency management interface.
- **Dashboard Analytics**: Features a two-tab dashboard (Purchase and Sales Analytics) with 2-column grid layouts, donut charts, and enhanced KPI sections.
- **Table Enhancements**: License tables feature smart invoice sorting, reordered columns, and new purchase cost breakdown details in the selling table.
- **Loading Indicators**: Animated loading spinners with text during data fetching.

## Technical Implementations
- **Cross-platform Compatibility**: `cross-env` for environment variables.
- **Automated Client/Vendor Creation**: License form automatically creates client and vendor records if new.
- **Data Validation**: Robust validation for fields (e.g., GST Number, exchange rates).
- **Dynamic API URL Detection**: Uses `window.location.origin` for dynamic API URL detection.
- **Environment Variable Handling**: PHP `load_env.php` for securely loading environment variables from `.env` files.
- **Automatic Invoice Numbering**: Implemented an auto-incrementing invoice number system (e.g., CYB0001) shared across sales and purchases, with intelligent numeric sorting.
- **File Uploads**: Document upload capability (PDF, JPG, PNG, DOC, DOCX up to 10MB) to license forms, clients, and vendors with secure validation (extension whitelist, MIME type validation, .htaccess protection).
- **CSV Import**: Bulk data import for Vendors, Clients, and Licenses with template downloads, validation, and progress tracking.

# External Dependencies

## Core Services
- **cPanel MySQL Database**: Primary database storage.
- **PHP 8.2+**: Backend runtime.
- **PHP mail()**: Native email sending.

## Development & Build Tools
- **Vite**: Frontend build tool and development server.
- **TypeScript**: For static type checking on frontend.
- **ESLint**: Code linting.
- **Tailwind CSS**: Utility-first CSS framework.
- **Concurrently**: For running PHP and React servers simultaneously.

## Frontend Libraries (React)
- **React**: v18.3.1 - UI library.
- **React Router DOM**: v6.22.2 - Client-side routing.
- **Recharts**: v2.12.2 - Data visualization.
- **Lucide React**: v0.344.0 - Icon library.
- **date-fns**: v3.3.1 - Date manipulation.