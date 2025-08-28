export interface Mensalidade {
  id: string;
  participanteId: string;
  tipoPlano: 'mensal' | 'trimestral' | 'semestral' | 'anual';
  valor: number;
  dataInicio: string;
  dataFim: string;
  status: 'ativa' | 'inativa';
}
