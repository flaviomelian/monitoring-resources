// types.ts
export interface Metric {
  id: number;
  timestamp: string;
  cpuUsage: number;
  ramUsedGB: number;
  ramTotalGB: number;
  diskUsagePercentage: number;
  ingestDiskBytes: number;
  replicaDiskBytes: number;
}