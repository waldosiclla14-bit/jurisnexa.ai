const k = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGJvdW5jb3Zvc2Ridm1ndW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk4NzY4NSwiZXhwIjoyMTAyNTYzNjg1fQ.983hpIeySJKymq01B8iPo23Qwr9Ras8kVOsE2lEXxwc';
const h = { apikey: k, Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' };
const base = 'https://iodbouncovosdbvmguox.supabase.co/rest/v1';

async function q(table, params = '') {
  const r = await fetch(`${base}/${table}?${params}`, { headers: h });
  return r.json();
}

(async () => {
  const countries = await q('countries', 'select=id,code');
  for (const c of countries) {
    const docs = await q('legal_documents', `select=id&country_id=eq.${c.id}&limit=1`);
    const arts = await q('legal_articles', `select=id&limit=1`);
    console.log(`${c.code}: docs=${docs.length} (first page), arts total checked...`);
  }

  // Check total articles
  const allArts = await q('legal_articles', 'select=id');
  console.log(`Total articles: ${allArts.length}`);

  // Check Chile key laws
  const clCountry = countries.find(c => c.code === 'CHILE');
  if (clCountry) {
    const keyNums = ['CL-242302', 'CL-207436', 'CL-172986'];
    for (const num of keyNums) {
      const docs = await q('legal_documents', `select=id,title&document_number=eq.${num}&country_id=eq.${clCountry.id}`);
      if (docs.length > 0) {
        const arts = await q('legal_articles', `select=id&document_id=eq.${docs[0].id}`);
        console.log(`${num}: ${docs[0].title?.slice(0,50)} → ${arts.length} articles`);
      } else {
        console.log(`${num}: NOT FOUND`);
      }
    }
  }
})();
