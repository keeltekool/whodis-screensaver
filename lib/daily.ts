export const DAILY_LAUNCH_DATE = "2026-04-12";

export function getDayNumber(dateStr: string): number {
  const launch = new Date(DAILY_LAUNCH_DATE);
  const target = new Date(dateStr);
  const diff = Math.floor((target.getTime() - launch.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export function getTodayDateStr(): string {
  return new Date().toISOString().split("T")[0];
}
