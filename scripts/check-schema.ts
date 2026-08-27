import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  envVars.SUPABASE_URL || '',
  envVars.SUPABASE_SERVICE_KEY || envVars.SUPABASE_ANON_KEY || ''
);

async function main() {
  // Check current columns
  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in legal_documents:', Object.keys(data[0]).join(', '));
    const hasContent = 'content' in data[0];
    console.log('Has content column:', hasContent);
  }
}

main().catch(console.error);
