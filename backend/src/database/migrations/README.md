# Database Migrations

This directory contains TypeORM migrations for production deployments.

## Why Migrations?

In production, `synchronize: false` is set to prevent automatic schema changes that could cause data loss. Migrations provide a safe, versioned way to evolve the database schema.

## Quick Start

### 1. Generate a Migration

After modifying entity files, generate a migration that captures the schema changes:

```bash
# Ensure PostgreSQL is running and env vars are set
cd backend

# Generate migration from current entities vs database
npm run migration:generate -- src/database/migrations/AddNewFeature
```

### 2. Review the Generated Migration

Always review the generated `.ts` file before committing:
- Check `up()` for correctness (additions, modifications)
- Check `down()` for safe rollbacks
- Ensure no accidental data loss (e.g., column drops)

### 3. Run Migrations

```bash
# Apply pending migrations
npm run migration:run

# Check migration status
npm run migration:show

# Revert last migration (emergency only)
npm run migration:revert
```

### 4. Production Deployment

On production servers:

```bash
# Build first
npm run build

# Run migrations before starting the app
npm run migration:run

# Start the app
npm run start:prod
```

## Environment Requirements

Migrations require:
- `DB_TYPE=postgres` (SQLite does not support migrations)
- Running PostgreSQL instance
- Valid `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`

## Initial Production Setup

For a fresh production database:

1. Create the database:
   ```sql
   CREATE DATABASE etunisia_prod;
   CREATE USER etunisia_prod WITH PASSWORD 'strong_password';
   GRANT ALL PRIVILEGES ON DATABASE etunisia_prod TO etunisia_prod;
   ```

2. Generate the initial migration from your dev SQLite schema:
   ```bash
   # Switch to postgres connection
   DB_TYPE=postgres npm run migration:generate -- src/database/migrations/InitialSchema
   ```

3. Run it on production:
   ```bash
   NODE_ENV=production npm run migration:run
   ```

## Best Practices

- **Never edit** a migration after it has been run in production
- **Always test** migrations on a staging database first
- **Keep migrations small** — one logical change per migration
- **Ensure `down()` is safe** — it should restore the previous state without data loss
- **Commit migrations** to version control alongside the entity changes
