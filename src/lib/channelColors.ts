const CHANNEL_COLORS = ['#3730a3', '#38bdf8', '#14b8a6', '#f59e0b', '#f43f5e', '#64748b'];

export function nextChannelColor(existingCount: number): string {
  return CHANNEL_COLORS[existingCount % CHANNEL_COLORS.length];
}
