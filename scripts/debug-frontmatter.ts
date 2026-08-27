import * as fs from 'fs';
import * as path from 'path';

const file = path.join(process.env.TEMP || '', 'legalize-cl', 'cl', 'CL-1000965.md');
const content = fs.readFileSync(file, 'utf-8');

const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
if (!match) {
  console.log('NO MATCH');
  console.log('First 200 chars:', JSON.stringify(content.substring(0, 200)));
  process.exit(1);
}

console.log('FRONTMATTER MATCHED');
const lines = match[1].split('\n');
for (const line of lines) {
  const m = line.match(/^([^:]+):\s*"?(.+?)"?\s*$/);
  if (m) {
    console.log(`  ${m[1].trim()} = ${m[2].trim().substring(0, 60)}`);
  } else {
    console.log(`  UNMATCHED: ${line.substring(0, 60)}`);
  }
}

console.log('\nBody preview:', match[2].substring(0, 100));

// Now test with a file from the sorted list
const clDir = path.join(process.env.TEMP || '', 'legalize-cl', 'cl');
const files = fs.readdirSync(clDir).filter(f => f.endsWith('.md'));

// Check a few files to see if frontmatter parses
let matched = 0;
let unmatched = 0;
for (let i = 0; i < Math.min(20, files.length); i++) {
  const c = fs.readFileSync(path.join(clDir, files[i]), 'utf-8');
  const fm = c.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (fm) matched++;
  else unmatched++;
}
console.log(`\nFrontmatter parse: ${matched} matched, ${unmatched} unmatched out of 20`);
