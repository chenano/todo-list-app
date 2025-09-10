# Supabase Database Setup

This directory contains the database schema, migrations, and configuration for the Todo List application.

## Files Overview

- `config.toml` - Supabase local development configuration
- `migrations/` - Database migration files
  - `001_initial_schema.sql` - Creates tables, RLS policies, and indexes
  - `002_updated_at_trigger.sql` - Adds automatic timestamp updates
- `seed.sql` - Sample data for development (optional)

## Database Schema

### Tables

#### `lists`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `name` (Text, Required)
- `description` (Text, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

#### `tasks`
- `id` (UUID, Primary Key)
- `list_id` (UUID, Foreign Key to lists)
- `user_id` (UUID, Foreign Key to auth.users)
- `title` (Text, Required)
- `description` (Text, Optional)
- `completed` (Boolean, Default: false)
- `priority` (Enum: 'low', 'medium', 'high', Default: 'medium')
- `due_date` (Date, Optional)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Security Features

### Row Level Security (RLS)
Both tables have RLS enabled with policies that ensure:
- Users can only access their own data
- All CRUD operations are restricted to the authenticated user
- Cascade deletion when lists are deleted

### Indexes
Performance indexes are created for:
- User-based queries
- Date-based sorting and filtering
- Priority and completion status filtering

## Setup Instructions

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase** (if not already done):
   ```bash
   supabase init
   ```

3. **Start local Supabase**:
   ```bash
   supabase start
   ```

4. **Apply migrations**:
   ```bash
   supabase db reset
   ```

5. **Access local services**:
   - Supabase Studio: http://localhost:54323
   - API: http://localhost:54321
   - Database: postgresql://postgres:postgres@localhost:54322/postgres

## Environment Variables

Make sure to set these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The keys can be found in the Supabase Studio or by running:
```bash
supabase status
```

## Production Deployment

For production:
1. Create a new Supabase project at https://supabase.com
2. Run the migration files in the Supabase SQL editor
3. Update environment variables with production URLs and keys
4. Enable RLS policies in production dashboard