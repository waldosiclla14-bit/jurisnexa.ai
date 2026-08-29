export type StreamLineHandler = (line: string) => void;

export interface StreamAccumulator {
  push(chunk: string): void;
  flush(): void;
}

/**
 * Reconstruye un stream de texto en líneas completas conservando los saltos
 * de línea, incluso cuando un chunk corta a mitad de palabra o de línea.
 *
 * - `push(chunk)`: decodifica y entrega todas las líneas completas vía handler.
 * - `flush()`: entrega el resto pendiente (última línea sin `\n` final) y limpia.
 *
 * Sin `flush()` la última línea parcial se pierde: respuestas truncadas y
 * marcadores de error (`__ERROR__`) que el servidor no termina con `\n`
 * nunca serían procesados.
 */
export function createStreamAccumulator(handleLine: StreamLineHandler): StreamAccumulator {
  let buffer = '';

  return {
    push(chunk: string) {
      buffer += chunk;
      const parts = buffer.split('\n');
      buffer = parts.pop() ?? '';
      for (const line of parts) handleLine(line);
    },
    flush() {
      if (buffer) {
        const tail = buffer;
        buffer = '';
        handleLine(tail);
      }
    },
  };
}