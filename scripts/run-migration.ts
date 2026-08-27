/**
 * Migration runner - connects directly to Supabase PostgreSQL
 * 
 * Usage: 
 *   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres" npx tsx scripts/run-migration.ts
 * 
 * Get your DATABASE_URL from:
 *   Supabase Dashboard > Project Settings > Database > Connection string > URI
 */
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL no configurada.');
    console.error('');
    console.error('Obtén tu connection string desde:');
    console.error('  Supabase Dashboard > Project Settings > Database > Connection string > URI');
    console.error('');
    console.error('Luego ejecuta:');
    console.error('  $env:DATABASE_URL="postgresql://..."; npx tsx scripts/run-migration.ts');
    process.exit(1);
  }

  const sqlPath = path.join(process.cwd(), 'database', 'migration-combined.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('📡 Conectando a PostgreSQL...');
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log('🔧 Ejecutando migración...');
  
  try {
    await client.query(sql);
    console.log('✅ Migración completada exitosamente');
  } catch (error: any) {
    console.error('❌ Error en migración:', error.message);
    
    // Try statement by statement
    console.log('🔄 Intentando paso a paso...');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      if (stmt.trim().startsWith('--')) continue;
      try {
        await client.query(stmt + ';');
        console.log(`  ✅ ${stmt.substring(0, 60)}...`);
      } catch (e: any) {
        console.warn(`  ⚠️  ${stmt.substring(0, 60)}... → ${e.message}`);
      }
    }
  }

  await client.end();
  console.log('🔌 Conexión cerrada');
}

main().catch(console.error);
