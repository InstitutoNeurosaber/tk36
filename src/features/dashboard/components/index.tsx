import React from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { DashboardMetrics } from './DashboardMetrics';
import { DashboardCharts } from './DashboardCharts';
import type { Ticket } from '../../../types/ticket';

interface DashboardProps {
  tickets: Ticket[];
}

export function Dashboard({ tickets }: DashboardProps) {
  const {
    metrics,
    statusData,
    categoryData
  } = useDashboard(tickets);

  return (
    <div className="space-y-8">
      <DashboardMetrics metrics={metrics} />
      <DashboardCharts 
        statusData={statusData}
        categoryData={categoryData}
      />
    </div>
  );
}