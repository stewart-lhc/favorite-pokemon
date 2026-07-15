import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const migrationName = '2026-07-15-declaration-rate-limits.sql';
const statementSeparator = '-- favmon:migration-statement';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = join(repositoryRoot, 'db', 'migrations', migrationName);
const migrationSql = await readFile(migrationPath, 'utf8');
const statements = migrationSql
  .split(statementSeparator)
  .map((statement) => statement.trim())
  .filter(Boolean);

if (statements.length !== 2) {
  throw new Error(`Expected exactly two statements in ${migrationName}.`);
}

const sql = neon(databaseUrl);
const targetRows = await sql`
  select
    current_database() as database_name,
    to_regclass('public.declarations') is not null as has_declarations,
    to_regclass('public.pokemon_stats') is not null as has_favourite_stats,
    to_regclass('public.pokemon_stats_not_favourite') is not null as has_not_favourite_stats,
    (
      select count(*) = 7
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'declarations'
        and column_name in (
          'id', 'trainer_name', 'pokemon_id', 'pokemon_name', 'reason', 'type', 'created_at'
        )
    ) as has_expected_declaration_columns
`;

const target = targetRows[0] ?? {};
if (
  !target.has_declarations
  || !target.has_favourite_stats
  || !target.has_not_favourite_stats
  || !target.has_expected_declaration_columns
) {
  throw new Error('Refusing to migrate a database without the expected Favmon schema.');
}

for (const statement of statements) {
  await sql.query(statement);
}

const verificationRows = await sql`
  select
    to_regclass('public.declaration_rate_limits') is not null as has_rate_limit_table,
    (
      select count(*) = 4
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'declaration_rate_limits'
        and (
          (column_name = 'key_hash' and data_type = 'text' and is_nullable = 'NO' and column_default is null)
          or (column_name = 'window_started_at' and data_type = 'timestamp with time zone' and is_nullable = 'NO' and column_default is not null)
          or (column_name = 'attempt_count' and data_type = 'integer' and is_nullable = 'NO' and column_default is not null)
          or (column_name = 'updated_at' and data_type = 'timestamp with time zone' and is_nullable = 'NO' and column_default is not null)
        )
    ) as has_expected_columns,
    (
      select count(*) = 1 and max(columns.column_name) = 'key_hash'
      from information_schema.table_constraints constraints
      join information_schema.key_column_usage columns
        on columns.constraint_catalog = constraints.constraint_catalog
        and columns.constraint_schema = constraints.constraint_schema
        and columns.constraint_name = constraints.constraint_name
      where constraints.table_schema = 'public'
        and constraints.table_name = 'declaration_rate_limits'
        and constraints.constraint_type = 'PRIMARY KEY'
    ) as has_key_hash_primary_key,
    (
      select count(*) = 2
      from pg_constraint
      where conrelid = 'public.declaration_rate_limits'::regclass
        and contype = 'c'
        and conname in (
          'declaration_rate_limits_key_hash_check',
          'declaration_rate_limits_attempt_count_check'
        )
    ) as has_expected_checks,
    exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and tablename = 'declaration_rate_limits'
        and indexname = 'declaration_rate_limits_updated_at_idx'
        and indexdef like '%(updated_at)%'
    ) as has_cleanup_index
`;

const verification = verificationRows[0] ?? {};
if (
  !verification.has_rate_limit_table
  || !verification.has_expected_columns
  || !verification.has_key_hash_primary_key
  || !verification.has_expected_checks
  || !verification.has_cleanup_index
) {
  throw new Error(`${migrationName} did not create the expected table shape and cleanup index.`);
}

console.log(JSON.stringify({
  database: target.database_name,
  migration: migrationName,
  applied: true,
}));
