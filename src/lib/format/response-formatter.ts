/**
 * Garantiza que la respuesta del LLM llegue ordenada y legible aunque el
 * modelo ignore el formato. No reescribe el contenido, solo reestructura.
 */
export function ensureLegalStructure(content: string): string {
  let text = content.trim();
  if (!text) return text;

  const hasHeading = /^#{1,6}\s/m.test(text);
  const hasList = /(^|\n)\s*(- |\d+\.\s)/m.test(text);

  // 1) Si no hay ningún encabezado y es largo, antepone uno genérico
  if (!hasHeading && text.length > 600) {
    // Intenta extraer una primera frase como resumen y el resto como análisis
    const firstBreak = text.indexOf('\n\n');
    if (firstBreak === -1) {
      // No hay párrafos: trocea por oraciones
      text = '### Resumen\n\n' + splitLongParagraph(text).join('\n\n');
    } else {
      const head = text.slice(0, firstBreak).trim();
      const tail = text.slice(firstBreak).trim();
      text = `### Resumen\n\n${head}\n\n### Análisis\n\n${tail}`;
    }
  }

  // 2) Normaliza listas pegadas: "texto 1. Siguiente" -> "texto\n1. Siguiente" (evita romper encabezados ##)
  text = text.replace(/([^\n#])\s+(\d+\.\s)/g, '$1\n$2');

  // 3) Trocea párrafos muy largos sin listas ni encabezados
  const paragraphs = text.split(/\n\s*\n/);
  const out: string[] = [];
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;
    const isHeading = /^#{1,6}\s/.test(trimmed);
    const isList = /^(- |\d+\.\s)/m.test(trimmed);
    const isTable = trimmed.includes('|');
    if (!isHeading && !isList && !isTable && trimmed.length > 500) {
      out.push(...splitLongParagraph(trimmed));
    } else {
      out.push(trimmed);
    }
  }

  // 4) Si sigue sin listas pero hay enumeraciones con "1)" o "a)", normaliza
  let joined = out.join('\n\n');
  if (!hasList && /(^|\n)\s*\d+\)\s/.test(joined)) {
    joined = joined.replace(/(^|\n)\s*(\d+)\)\s/g, '$1$2. ');
  }

  return joined.trim();
}

function splitLongParagraph(text: string): string[] {
  // Divide por oraciones y reagrupa en bloques de ~280-380 chars
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [text];
  const chunks: string[] = [];
  let buf = '';
  for (const s of sentences) {
    const cand = (buf ? buf + ' ' : '') + s.trim();
    if (cand.length > 380 && buf) {
      chunks.push(buf.trim());
      buf = s.trim();
    } else {
      buf = cand;
    }
  }
  if (buf) chunks.push(buf.trim());
  // Si solo quedó un chunk muy largo, fuerza corte por longitud
  if (chunks.length === 1 && chunks[0].length > 600) {
    const t = chunks[0];
    return [t.slice(0, 550).trim(), t.slice(550).trim()].filter(Boolean);
  }
  return chunks;
}