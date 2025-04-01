export const clickupStatusReverseMap: Record<string, string> = {
  'ABERTO': 'open',
  'EM ANDAMENTO': 'in_progress',
  'RESOLVIDO': 'resolved',
  'FECHADO': 'closed'
};

export const clickupPriorityReverseMap: Record<number, string> = {
  1: 'critical',
  2: 'high',
  3: 'medium',
  4: 'low'
};