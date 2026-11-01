import { useEffect, useRef } from 'react';
import { Chart, formatTooltipValue } from '@/lib/chart';

export function DoughnutChart({
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
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderColor: '#ffffff', borderWidth: 3, hoverOffset: 6 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        animation: { duration: 700 },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => formatTooltipValue(ctx.label, ctx.parsed, format) } },
        },
      },
    });
    return () => chart.destroy();
  }, [labels, values, colors, format]);

  return <canvas ref={canvasRef} role="img" aria-label="Gráfico de distribuição do lucro por canal" />;
}
