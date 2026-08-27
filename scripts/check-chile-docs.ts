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
  const { data: chile } = await supabase.from('countries').select('id').eq('code', 'CHILE').single();
  
  const { data: docs } = await supabase
    .from('legal_documents')
    .select('title, document_number, summary')
    .eq('country_id', chile!.id)
    .order('created_at', { ascending: false })
    .limit(15);
  
  docs?.forEach(d => {
    console.log(`${d.document_number} | ${(d.title || '').substring(0, 80)}`);
  });
  
  console.log('\n--- Checking priority keywords ---');
  const priorityKw = ['CODIGO CIVIL', 'CODIGO PENAL', 'CONSTITUCION', 'TRABAJO', 'COMERCIO'];
  const { data: allDocs } = await supabase
    .from('legal_documents')
    .select('title, document_number')
    .eq('country_id', chile!.id);
  
  for (const kw of priorityKw) {
    const matches = (allDocs || []).filter(d => (d.title || '').toUpperCase().includes(kw));
    console.log(`${kw}: ${matches.length} matches`);
    matches.slice(0, 3).forEach(m => console.log(`  - ${m.document_number}: ${(m.title || '').substring(0, 60)}`));
  }
}

main().catch(console.error);
