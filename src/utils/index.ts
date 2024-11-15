
export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const todayDateString = new Date().toISOString().split('T')[0];



// Helper Method: Calculate Standard Deviation
export function calculateStandardDeviation(data: number[]): number {
  if (data.length === 0) return 0;
  const mean = data.reduce((sum, value) => sum + Number(value), 0) / data.length;
  const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}
