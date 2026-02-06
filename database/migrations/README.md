# Database Migrations

This directory contains SQL migration files that manage the database schema.

## How Migrations Work

1. Migration files are executed in alphabetical order (by filename)
2. Each migration is tracked in the `migrations` table
3. Already executed migrations are skipped
4. Migrations are idempotent (safe to run multiple times)

## Migration File Naming

Use a numbered prefix to ensure execution order:
- `001_create_tickets_table.sql`
- `002_add_comments_table.sql`
- `003_add_indexes.sql`

## Running Migrations

### Run all pending migrations
```bash
npm run migrate
# or
npm run migrate:up
```

### Create database only
```bash
npm run migrate:create-db
```

## Creating a New Migration

1. Create a new SQL file in this directory with a descriptive name:
   ```bash
   touch database/migrations/002_your_migration_name.sql
   ```

2. Write your SQL statements:
   ```sql
   -- Migration: Your migration description
   -- Created: YYYY-MM-DD
   
   CREATE TABLE IF NOT EXISTS your_table (
     id INT PRIMARY KEY,
     name VARCHAR(255)
   );
   ```

3. Run migrations:
   ```bash
   npm run migrate
   ```

## Migration Best Practices

- ✅ Use `IF NOT EXISTS` for tables/columns
- ✅ Use transactions where possible (for rollback support)
- ✅ Include descriptive comments
- ✅ Test migrations on a development database first
- ✅ Keep migrations small and focused
- ✅ Never modify existing migration files (create new ones instead)

## Migration Status

Check which migrations have been executed:
```sql
SELECT * FROM migrations ORDER BY executed_at;
```
