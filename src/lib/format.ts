const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const decimal2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('pt-BR');

export function parseDecimal(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function parseRequiredDecimal(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function formatBRL(value: number): string {
  return brl.format(value);
}

export function formatSignedBRL(value: number): string {
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${brl.format(Math.abs(value))}`;
}

export function formatPct(value: number): string {
  return `${pct1.format(value)}%`;
}

export function formatSignedPct(value: number): string {
  return `${value > 0 ? '+' : ''}${pct1.format(value)}%`;
}

export function formatSignedPoints(value: number): string {
  return `${value > 0 ? '+' : ''}${pct1.format(value)} pts`;
}

export function formatInt(value: number): string {
  return integer.format(value);
}

export function formatDecimal(value: number): string {
  return decimal2.format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}
