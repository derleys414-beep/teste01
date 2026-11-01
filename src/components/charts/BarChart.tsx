import { useEffect, useRef } from 'react';
import { Chart, formatTooltipValue } from '@/lib/chart';

export function BarChart({
  labels,
  values,
  colors,
  format,
}: {
  labels: string[];
  values: number[];
  colors: string[];
  format: (value: number) => string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const chart = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderRadius: 8, maxBarThickness: 56 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700 },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => formatTooltipValue(ctx.label, ctx.parsed.y ?? 0, format) } },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: '#475569', font: { size: 12 } } },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: '#f1f5f9' },
            ticks: { color: '#64748b', font: { size: 12 }, callback: (value) => format(Number(value)) },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [labels, values, colors, format]);

  return <canvas ref={canvasRef} role="img" aria-label="Gráfico comparativo de lucro por canal" />;
}
