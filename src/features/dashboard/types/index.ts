export interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  ticketVariation: number;
}

export interface ChartData {
  name: string;
  value?: number;
  count?: number;
}