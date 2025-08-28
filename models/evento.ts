export interface Evento {
  id: string;
  nome: string;
  data: string;
  local: string;
  descricao: string;
  status: 'aberto' | 'encerrado' | 'cancelado';
  participantes: string[];
  resultados: string[];
  criadoPor: string;
}
