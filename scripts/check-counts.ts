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
  
  const { count: docCount } = await supabase
    .from('legal_documents')
    .select('*', { count: 'exact', head: true })
    .eq('country_id', chile!.id);
  
  const { count: chunkCount } = await supabase
    .from('document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('country_id', chile!.id);

  const { count: totalDocs } = await supabase
    .from('legal_documents')
    .select('*', { count: 'exact', head: true });

  const { count: totalChunks } = await supabase
    .from('document_chunks')
    .select('*', { count: 'exact', head: true });

  console.log(`Chile docs: ${docCount} | Chile chunks: ${chunkCount}`);
  console.log(`Total docs: ${totalDocs} | Total chunks: ${totalChunks}`);
}

main().catch(console.error);
