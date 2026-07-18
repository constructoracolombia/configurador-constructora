// Convierte un entero (pesos COP) a texto en español para contratos
// Ej: 24_600_000 → "VEINTICUATRO MILLONES SEISCIENTOS MIL PESOS M/CTE ($ 24.600.000)"

const ONES: string[] = [
  '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS',
  'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
  'VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO',
  'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
];
const TENS: string[] = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const HUNDREDS: string[] = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function grupo(n: number): string {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  if (n < 30) return ONES[n]!;
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(HUNDREDS[h]!);
  if (rem > 0) {
    if (rem < 30) parts.push(ONES[rem]!);
    else {
      const t = Math.floor(rem / 10);
      const u = rem % 10;
      parts.push(TENS[t]! + (u > 0 ? ' Y ' + ONES[u]! : ''));
    }
  }
  return parts.join(' ');
}

export function numeroALetras(n: number): string {
  n = Math.round(n);
  if (n === 0) return 'CERO PESOS M/CTE ($ 0)';
  const mill = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1_000);
  const unid = n % 1_000;
  const parts: string[] = [];
  if (mill === 1) parts.push('UN MILLÓN');
  else if (mill > 0) parts.push(grupo(mill) + ' MILLONES');
  if (miles === 1) parts.push('MIL');
  else if (miles > 0) parts.push(grupo(miles) + ' MIL');
  if (unid > 0) parts.push(grupo(unid));
  return `${parts.join(' ')} PESOS M/CTE ($ ${n.toLocaleString('es-CO')})`;
}
