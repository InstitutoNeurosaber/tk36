// Sugestões de justificativas para cada tipo de alteração de prioridade
export const prioritySuggestions: Record<string, string[]> = {
  // Aumentando para Crítico
  'medium-critical': [
    'Sistema completamente indisponível, afetando todos os usuários',
    'Perda significativa de dados em produção',
    'Falha de segurança crítica identificada',
    'Processo crítico do negócio totalmente parado',
    'Impacto financeiro grave imediato'
  ],
  'high-critical': [
    'Problema escalou para indisponibilidade total do sistema',
    'Identificado risco iminente de perda de dados',
    'Falha de segurança com exploração ativa',
    'Serviço principal totalmente interrompido',
    'Impacto direto na operação da empresa'
  ],
  // Aumentando para Alta
  'low-high': [
    'Múltiplos departamentos afetados simultaneamente',
    'Funcionalidade crítica com falha grave',
    'Grande número de usuários impactados',
    'Erro em processo essencial do negócio',
    'Risco significativo identificado'
  ],
  'medium-high': [
    'Problema afetando mais usuários que o previsto',
    'Identificado impacto maior no processo',
    'Funcionalidade importante comprometida',
    'Erro afetando setor crítico',
    'Necessidade de resolução mais urgente'
  ],
  // Aumentando para Média
  'low-medium': [
    'Impacto maior que o inicialmente avaliado',
    'Mais usuários afetados que o previsto',
    'Processo importante parcialmente comprometido',
    'Necessidade de atenção aumentou',
    'Risco de escalação identificado'
  ],
  // Diminuindo para Baixa
  'critical-low': [
    'Problema contornado com solução alternativa',
    'Impacto real menor que o reportado',
    'Afeta apenas processos não críticos',
    'Poucos usuários impactados',
    'Baixo risco para a operação'
  ],
  'high-low': [
    'Situação normalizada com workaround',
    'Impacto reduzido após análise',
    'Processo não é crítico como avaliado',
    'Número limitado de usuários afetados',
    'Baixa criticidade confirmada'
  ],
  'medium-low': [
    'Problema menos crítico que o estimado',
    'Impacto mínimo nas operações',
    'Alternativa viável disponível',
    'Poucos usuários afetados',
    'Pode ser tratado posteriormente'
  ],
  // Diminuindo para Média
  'critical-medium': [
    'Situação parcialmente contornada',
    'Impacto menor que o inicialmente reportado',
    'Sistema funcionando com limitações',
    'Processo tem alternativas viáveis',
    'Criticidade reavaliada após análise'
  ],
  'high-medium': [
    'Problema não tão crítico quanto avaliado',
    'Impacto moderado após análise',
    'Existem soluções de contorno',
    'Processo afetado tem alternativas',
    'Urgência reduzida após verificação'
  ],
  // Diminuindo para Alta
  'critical-high': [
    'Sistema parcialmente recuperado',
    'Impacto reduzido mas ainda significativo',
    'Principais funções restauradas',
    'Processo crítico parcialmente operacional',
    'Situação mais estável após ações iniciais'
  ]
};

// Palavras-chave para identificar aumento de prioridade
export const increaseKeywords = [
  'crítico',
  'urgente',
  'grave',
  'interrupção',
  'impacto maior',
  'impacto alto',
  'impacto crítico',
  'afetando todos',
  'sistema parado',
  'bloqueado',
  'indisponível',
  'sem acesso',
  'perda de dados',
  'falha total',
  'emergência'
];

// Palavras-chave para identificar redução de prioridade
export const decreaseKeywords = [
  'menor impacto',
  'impacto reduzido',
  'não é crítico',
  'baixa criticidade',
  'pode aguardar',
  'sem urgência',
  'normalizado',
  'estável',
  'contornado',
  'mínimo',
  'resolvido parcialmente',
  'alternativa disponível',
  'poucos usuários',
  'impacto limitado'
];

// Textos de placeholder para cada nível de prioridade (aumento)
export const increasePlaceholders: Record<TicketPriority, string> = {
  critical: "O problema está causando interrupção total dos serviços críticos. Usuários sem acesso ao sistema, impactando diretamente a operação da empresa...",
  high: "O problema está afetando processos críticos e um grande número de usuários. Funcionalidades importantes comprometidas...",
  medium: "O problema apresenta impacto moderado nas operações. Alguns usuários afetados, mas existem alternativas temporárias...",
  low: "O problema requer atenção, mas tem baixo impacto nas operações. Poucos usuários afetados..."
};

// Textos de placeholder para cada nível de prioridade (redução)
export const decreasePlaceholders: Record<TicketPriority, string> = {
  low: "Após análise, verificamos que o impacto é mínimo. O problema afeta poucos usuários e existem alternativas viáveis...",
  medium: "Após reavaliação, o problema não apresenta a criticidade inicialmente estimada. Impacto menor que o previsto...",
  high: "O impacto foi reavaliado e, embora importante, não representa uma interrupção total como considerado inicialmente...",
  critical: "Mesmo sendo um problema sério, não está causando a interrupção total inicialmente reportada..."
};

// Níveis de prioridade ordenados do menor para o maior
export const priorityLevels: TicketPriority[] = ['low', 'medium', 'high', 'critical'];

// Função para obter o nível numérico da prioridade
export const getPriorityLevel = (priority: TicketPriority): number => {
  return priorityLevels.indexOf(priority) + 1;
};

// Função para obter o texto do placeholder baseado na mudança de prioridade
export const getPlaceholderText = (currentPriority: TicketPriority, newPriority: TicketPriority): string => {
  const currentLevel = getPriorityLevel(currentPriority);
  const newLevel = getPriorityLevel(newPriority);

  if (newLevel > currentLevel) {
    return increasePlaceholders[newPriority];
  } else {
    return decreasePlaceholders[newPriority];
  }
};

// Função para obter sugestões de justificativa baseadas na mudança de prioridade
export const getPrioritySuggestions = (currentPriority: TicketPriority, newPriority: TicketPriority): string[] => {
  const key = `${currentPriority}-${newPriority}`;
  return prioritySuggestions[key] || [];
};