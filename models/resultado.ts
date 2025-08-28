export interface Resultado {
  id: string;
  eventoId: string;
  participanteId: string;
  pontuacao: number;
  ranking: number;
  observacoes?: string;
}
