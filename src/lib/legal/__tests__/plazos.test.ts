import { describe, it, expect } from 'vitest';
import { calcularPlazo, getFeriados, formatFecha } from '../plazos';

describe('calculadora de plazos (Perú)', () => {
  it('calcula 10 días hábiles desde el día siguiente, excluyendo fines de semana', () => {
    // 1 de junio de 2026 es un lunes; notificado el lunes, empieza martes 2
    const r = calcularPlazo('2026-06-01', 10, 'PERU', 'habiles');
    expect(r.fechaInicio.getDate()).toBe(2);
    // 10 días hábiles desde el 2/6 (martes): 2,3,4,5,8,9,10,11,12,15 → vence lunes 15
    expect(r.fechaVencimiento.getDate()).toBe(15);
    expect(r.fechaVencimiento.getMonth()).toBe(5); // junio
    expect(r.diasCalendario).toBe(14);
  });

  it('días corridos no excluyen fines de semana', () => {
    const r = calcularPlazo('2026-06-01', 10, 'PERU', 'calendario');
    expect(r.fechaInicio.getDate()).toBe(2);
    expect(r.fechaVencimiento.getDate()).toBe(11);
    expect(r.fechaVencimiento.getMonth()).toBe(5);
    expect(r.diasCalendario).toBe(10);
  });

  it('el plazo mínimo de 1 día vence el día hábil siguiente a la notificación si ese día es hábil', () => {
    // Notificado lunes 6/7, comienza martes 7/7 (hábil) → vence el mismo día 7
    const r = calcularPlazo('2026-07-06', 1, 'PERU', 'habiles');
    expect(r.fechaVencimiento.getDate()).toBe(7);
  });

  it('detección de feriados intermedios', () => {
    // 27 de julio de 2026 cae lunes; incluir plazo que cruce el 28/29 de julio (Fiestas Patrias)
    const r = calcularPlazo('2026-07-27', 5, 'PERU', 'habiles');
    const nombres = r.feriadosIntermedios.map(f => f.nombre);
    expect(nombres).toContain('Fiestas Patrias');
    expect(r.feriadosIntermedios.length).toBeGreaterThanOrEqual(1);
  });
});

describe('calculadora de plazos (Chile)', () => {
  it('15 días hábiles desde el día siguiente a la notificación en septiembre', () => {
    // Notificado miércoles 16/9/2026 (día hábil), empieza jueves 17/9.
    // 17, 18(feriado), 21,22,23,24,25,28,29,30, 1(oct)...
    const r = calcularPlazo('2026-09-16', 15, 'CHILE', 'habiles');
    const intermedios = r.feriadosIntermedios.map(f => f.nombre);
    expect(intermedios).toContain('Independencia Nacional');
    expect(r.fechaVencimiento.getTime()).toBeGreaterThan(new Date('2026-09-30').getTime());
  });

  it('feriados chilenos de septiembre presentes', () => {
    const feriados = getFeriados(2026, 'CHILE');
    const nombres = feriados.map(f => f.nombre);
    expect(nombres).toContain('Independencia Nacional');
    expect(nombres).toContain('Glorias del Ejército');
  });
});

describe('formateo de fechas', () => {
  it('formatea con idioma es-PE', () => {
    const s = formatFecha(new Date(2026, 5, 15), 'PERU');
    expect(s).toContain('lunes');
    expect(s).toContain('15');
  });
});