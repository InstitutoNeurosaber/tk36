import { useMemo } from 'react';
import type { Ticket } from '../../../types/ticket';
import type { DashboardMetrics, ChartData } from '../types';

export function useDashboard(tickets: Ticket[]) {
  const metrics = useMemo((): DashboardMetrics => {
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    
    const avgResolutionTime = tickets
      .filter(t => t.status === 'resolved')
      .reduce((acc, t) => {
        const diff = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
        return acc + diff;
      }, 0) / (resolvedTickets || 1);

    // Calcular variação em relação ao período anterior
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentTickets = tickets.filter(t => new Date(t.createdAt) >= sevenDaysAgo).length;
    const previousTickets = tickets.filter(t => 
      new Date(t.createdAt) >= fourteenDaysAgo && 
      new Date(t.createdAt) < sevenDaysAgo
    ).length;

    const ticketVariation = previousTickets ? 
      ((recentTickets - previousTickets) / previousTickets) * 100 : 
      0;

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      avgResolutionTime,
      ticketVariation
    };
  }, [tickets]);

  const statusData = useMemo((): ChartData[] => [
    { name: 'Abertos', value: tickets.filter(t => t.status === 'open').length },
    { name: 'Em Progresso', value: tickets.filter(t => t.status === 'in_progress').length },
    { name: 'Resolvidos', value: tickets.filter(t => t.status === 'resolved').length },
    { name: 'Fechados', value: tickets.filter(t => t.status === 'closed').length }
  ], [tickets]);

  const categoryData = useMemo((): ChartData[] => [
    { name: 'Software', count: tickets.filter(t => t.category === 'software').length },
    { name: 'Hardware', count: tickets.filter(t => t.category === 'hardware').length },
    { name: 'Rede', count: tickets.filter(t => t.category === 'network').length },
    { name: 'Outros', count: tickets.filter(t => t.category === 'other').length }
  ], [tickets]);

  return {
    metrics,
    statusData,
    categoryData
  };
}