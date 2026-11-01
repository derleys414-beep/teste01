import { Chart, ArcElement, BarController, BarElement, CategoryScale, DoughnutController, Legend, LinearScale, Tooltip } from 'chart.js';

Chart.register(ArcElement, BarElement, BarController, CategoryScale, DoughnutController, Legend, LinearScale, Tooltip);

export { Chart };

export function formatTooltipValue(label: string, value: number, format: (value: number) => string): string {
  return `${label}: ${format(value)}`;
}
