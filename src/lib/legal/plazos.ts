export type PaisPlazos = 'PERU' | 'CHILE';
export type ModoComputo = 'habiles' | 'calendario';

export interface Feriado {
  fecha: Date;
  nombre: string;
}

export interface CalculoPlazo {
  fechaNotificacion: Date;
  fechaInicio: Date;
  fechaVencimiento: Date;
  plazo: number;
  pais: PaisPlazos;
  modo: ModoComputo;
  diasCalendario: number;
  feriadosIntermedios: Feriado[];
  feriadosTotales: Feriado[];
}

function computeEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(value: Date | string): Date {
  if (typeof value !== 'string') return startOfDay(value);
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return startOfDay(new Date(value));
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function getFeriados(year: number, pais: PaisPlazos): Feriado[] {
  const feriados: { day: number; month: number; name: string; yearOffset?: number }[] = [];

  if (pais === 'PERU') {
    feriados.push(
      { day: 1, month: 0, name: 'Año Nuevo' },
      { day: 1, month: 4, name: 'Día del Trabajo' },
      { day: 7, month: 5, name: 'Día de la Bandera' },
      { day: 23, month: 6, name: 'Día de la Fuerza Aérea' },
      { day: 28, month: 6, name: 'Fiestas Patrias' },
      { day: 29, month: 6, name: 'Fiestas Patrias' },
      { day: 30, month: 7, name: 'Santa Rosa de Lima' },
      { day: 8, month: 9, name: 'Combate de Angamos' },
      { day: 1, month: 10, name: 'Día de Todos los Santos' },
      { day: 8, month: 11, name: 'Inmaculada Concepción' },
      { day: 25, month: 11, name: 'Navidad' }
    );
    const easter = computeEasterSunday(year);
    feriados.push(
      { day: easter.getDate() - 2, month: easter.getMonth(), name: 'Jueves Santo' },
      { day: easter.getDate() - 1, month: easter.getMonth(), name: 'Viernes Santo' }
    );
  } else {
    feriados.push(
      { day: 1, month: 0, name: 'Año Nuevo' },
      { day: 1, month: 4, name: 'Día del Trabajo' },
      { day: 21, month: 4, name: 'Día de las Glorias Navales' },
      { day: 29, month: 5, name: 'San Pedro y San Pablo' },
      { day: 16, month: 6, name: 'Virgen del Carmen' },
      { day: 15, month: 7, name: 'Asunción de la Virgen' },
      { day: 18, month: 8, name: 'Independencia Nacional' },
      { day: 19, month: 8, name: 'Glorias del Ejército' },
      { day: 1, month: 10, name: 'Día de Todos los Santos' },
      { day: 8, month: 11, name: 'Inmaculada Concepción' },
      { day: 25, month: 11, name: 'Navidad' }
    );
    const easter = computeEasterSunday(year);
    feriados.push(
      { day: easter.getDate() - 3, month: easter.getMonth(), name: 'Jueves Santo' },
      { day: easter.getDate() - 2, month: easter.getMonth(), name: 'Viernes Santo' }
    );
  }

  return feriados.map(f => ({
    fecha: new Date(year, f.month, f.day),
    nombre: f.name,
  }));
}

function esDiaHabil(date: Date, pais: PaisPlazos, feriadosAnio: Feriado[]): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  return !feriadosAnio.some(f => sameDay(f.fecha, date));
}

export function calcularPlazo(
  fechaNotificacion: Date | string,
  plazoDias: number,
  pais: PaisPlazos,
  modo: ModoComputo = 'habiles'
): CalculoPlazo {
  const base = parseLocalDate(fechaNotificacion);
  const inicio = addDays(base, 1);
  const feriados = getFeriados(base.getFullYear(), pais)
    .concat(getFeriados(base.getFullYear() + 1, pais))
    .filter(f => f.fecha.getTime() >= inicio.getTime());

  let vencimiento: Date;
  let feriadosIntermedios: Feriado[] = [];

  if (modo === 'calendario') {
    vencimiento = addDays(inicio, plazoDias - 1);
  } else {
    let current = inicio;
    let contados = 0;
    const intermedios: Feriado[] = [];
    while (contados < plazoDias) {
      if (esDiaHabil(current, pais, feriados)) {
        contados++;
        if (contados === plazoDias) break;
      } else {
        const fer = feriados.find(f => sameDay(f.fecha, current) && !sameDay(f.fecha, inicio));
        if (fer && !intermedios.some(i => sameDay(i.fecha, fer.fecha))) {
          intermedios.push(fer);
        }
      }
      current = addDays(current, 1);
    }
    vencimiento = current;
    feriadosIntermedios = intermedios;
  }

  const diasCalendario = Math.round((vencimiento.getTime() - inicio.getTime()) / 86400000) + 1;

  return {
    fechaNotificacion: base,
    fechaInicio: inicio,
    fechaVencimiento: vencimiento,
    plazo: plazoDias,
    pais,
    modo,
    diasCalendario,
    feriadosIntermedios,
    feriadosTotales: feriados,
  };
}

export function formatFecha(date: Date, pais: PaisPlazos = 'PERU'): string {
  return date.toLocaleDateString(pais === 'CHILE' ? 'es-CL' : 'es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function fechaISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}