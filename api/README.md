# License Management System - PHP Backend API

A complete PHP backend for the License Management System with PostgreSQL database support.

## Project Structure

```
php/backend/
├── api/
│   └── index.php           # Main API entry point and routing
├── config/
│   ├── database.php        # Database connection configuration
│   └── constants.php       # Application constants
├── controllers/
│   ├── AuthController.php  # Authentication endpoints
│   ├── ClientController.php # Client management
│   └── LicenseController.php # License management
├── middleware/
│   ├── Auth.php            # JWT authentication middleware
│   └── CORS.php            # CORS handling
├── models/
│   ├── Client.php          # Client data model
│   ├── License.php         # License data model
│   └── User.php            # User data model
├── utils/
│   ├── JWT.php             # JWT token handling
│   ├── Response.php        # HTTP response helper
│   └── Validator.php       # Input validation
└── .htaccess              # Apache URL rewriting rules
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change user password

### Licenses
- `GET /api/licenses` - List all licenses
- `POST /api/licenses` - Create new license
- `GET /api/licenses/{id}` - Get specific license
- `PUT /api/licenses/{id}` - Update license
- `DELETE /api/licenses/{id}` - Delete license
- `GET /api/licenses/dashboard` - Get dashboard statistics
- `GET /api/licenses/expiring` - Get expiring licenses (admin/accounts only)
- `GET /api/licenses/expired` - Get expired licenses (admin/accounts only)

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/{id}` - Get specific client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client

### Users (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/{id}` - Get specific user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

## Configuration

1. **Database Configuration** (`config/database.php`):
   ```php
   private $config = [
       'host' => 'localhost',
       'port' => '5432',
       'dbname' => 'license_management_system',
       'user' => 'your_username',
       'password' => 'your_password',
       'charset' => 'utf8'
   ];
   ```

2. **JWT Secret** (`config/constants.php`):
   ```php
   define('JWT_SECRET', 'your-secret-key-here');
   ```

## Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin, Accounts, and User roles
- **Input Validation**: Comprehensive validation for all inputs
- **CORS Support**: Cross-origin request handling
- **Error Handling**: Structured error responses
- **SQL Injection Protection**: Prepared statements throughout
- **Password Security**: Bcrypt password hashing

## Installation

1. Copy the `php/backend/` folder to your web server
2. Configure your database connection in `config/database.php`
3. Set up your JWT secret in `config/constants.php`
4. Import the database schema using `database_setup.sql`
5. Ensure mod_rewrite is enabled for clean URLs

## Usage Examples

### Login
```bash
curl -X POST http://your-domain/php/backend/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rohan.bhosale@cybaemtech.com","password":"password"}'
```

### Get Licenses (with Authorization)
```bash
curl -X GET http://your-domain/php/backend/api/licenses \
  -H "Authorization: Bearer your-jwt-token"
```

### Create License
```bash
curl -X POST http://your-domain/php/backend/api/licenses \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "Adobe Photoshop",
    "cost_per_user": 599.00,
    "quantity": 5,
    "total_cost": 2995.00,
    "purchase_date": "2025-01-01",
    "expiration_date": "2025-12-31",
    "currency_code": "USD"
  }'
```

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- SQL injection prevention with prepared statements
- Input validation and sanitization
- CORS protection
- Security headers via .htaccess
- Role-based access control

## Requirements

- PHP 7.4+ with PDO PostgreSQL extension
- PostgreSQL 12+
- Apache with mod_rewrite (or equivalent URL rewriting)
- SSL/HTTPS recommended for production