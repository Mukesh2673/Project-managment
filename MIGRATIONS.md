# Database Migrations Guide

This project uses a custom migration system to manage database schema changes.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Make sure your `.env` file is configured with database credentials:
```env
DB_HOST=your-host
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=your-database
```

### 3. Create Database and Run Migrations
```bash
# This will:
# 1. Create the database if it doesn't exist
# 2. Run all pending migrations
npm run migrate
```

### 4. Verify
Check that the tables were created:
```sql
SHOW TABLES;
SELECT * FROM migrations;
```

## Available Commands

### Run All Migrations
```bash
npm run migrate
# or
npm run migrate:up
```

This command will:
- Create the database if it doesn't exist
- Create a `migrations` table to track executed migrations
- Run all pending migration files in order
- Skip already executed migrations

### Create Database Only
```bash
npm run migrate:create-db
```

This only creates the database without running migrations.

## Migration System Features

✅ **Automatic Database Creation** - Creates database if it doesn't exist  
✅ **Migration Tracking** - Tracks executed migrations in `migrations` table  
✅ **Idempotent** - Safe to run multiple times  
✅ **Ordered Execution** - Migrations run in alphabetical order  
✅ **Skip Already Executed** - Automatically skips completed migrations  
✅ **SSL Support** - Works with Aiven MySQL and other SSL-enabled databases  

## Creating New Migrations

### Step 1: Create Migration File
Create a new SQL file in `database/migrations/` with a numbered prefix:

```bash
touch database/migrations/002_add_comments_table.sql
```

### Step 2: Write SQL
```sql
-- Migration: Add comments table
-- Created: 2026-02-06
-- Description: Create comments table for ticket comments

CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author VARCHAR(255),
  created_at DATETIME NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  INDEX idx_ticket_id (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Step 3: Run Migration
```bash
npm run migrate
```

## Migration File Naming Convention

Use numbered prefixes to ensure execution order:
- `001_create_tickets_table.sql`
- `002_add_comments_table.sql`
- `003_add_indexes.sql`
- `004_add_user_table.sql`

## Best Practices

### ✅ Do:
- Use `IF NOT EXISTS` for tables and columns
- Include descriptive comments in migration files
- Test migrations on development database first
- Keep migrations small and focused
- Use transactions for complex migrations (when supported)

### ❌ Don't:
- Modify existing migration files (create new ones instead)
- Delete migration files that have been executed
- Include data migrations in schema migrations (create separate files)

## Migration Status

### Check Executed Migrations
```sql
SELECT * FROM migrations ORDER BY executed_at;
```

### View Migration Details
```sql
SELECT 
  name,
  executed_at,
  TIMESTAMPDIFF(SECOND, executed_at, NOW()) as seconds_ago
FROM migrations
ORDER BY executed_at DESC;
```

## Troubleshooting

### Migration Fails
If a migration fails:
1. Check the error message in the console
2. Fix the SQL in the migration file
3. If the migration was partially executed, you may need to manually clean up
4. Re-run: `npm run migrate`

### Database Connection Issues
- Verify `.env` file has correct credentials
- Check database is accessible
- For Aiven MySQL, ensure SSL is configured:
  ```env
  DB_SSL_MODE=REQUIRED
  DB_SSL=true
  DB_SSL_REJECT_UNAUTHORIZED=false
  ```

### Migration Already Executed
If you need to re-run a migration:
1. Remove it from the migrations table:
   ```sql
   DELETE FROM migrations WHERE name = '001_create_tickets_table';
   ```
2. Re-run: `npm run migrate`

## Example Migration Files

### Creating a Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Adding a Column
```sql
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS due_date DATETIME;
```

### Adding an Index
```sql
CREATE INDEX IF NOT EXISTS idx_due_date 
ON tickets(due_date);
```

### Adding a Foreign Key
```sql
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS user_id INT,
ADD FOREIGN KEY (user_id) REFERENCES users(id);
```

## Integration with Application

The migration system is separate from the application's database initialization. The application will still work if migrations haven't been run (it creates tables on first use), but it's recommended to run migrations for production deployments.

For production:
```bash
# Before deploying
npm run migrate

# Then start the application
npm run build
npm start
```
