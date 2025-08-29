import type { ClubAdminPermissions, UserType } from './auth';
import type { Clube } from './clube';

export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string; // hash
  tipo: UserType;
  dataCadastro: string;
  ultimoLogin?: string;
  ativo: boolean;
  
  // Club hierarchy fields
  clubeId?: string;
  numeroRegistro?: string;
  permissoes?: ClubAdminPermissions;
  
  // Member-related fields
  associado: boolean;
  telefone?: string;
  dataAssociacao?: string;
  statusAssociacao: 'ativo' | 'inativo' | 'suspenso';
  
  // Populated fields from joins
  clube?: Clube;
}

// System administrator (manages all clubs)
export interface SystemAdmin extends Omit<User, 'tipo' | 'clubeId' | 'numeroRegistro' | 'permissoes' | 'associado' | 'dataAssociacao' | 'statusAssociacao'> {
  tipo: 'system_admin';
}

// Club administrator (manages specific club)
export interface ClubAdmin extends Omit<User, 'tipo'> {
  tipo: 'club_admin';
  clubeId: string;
  permissoes: ClubAdminPermissions;
}

// Club member (regular member of a club)
export interface ClubMember extends Omit<User, 'tipo' | 'permissoes'> {
  tipo: 'club_member';
  clubeId: string;
}

// Event participation interface
export interface EventParticipant {
  id: string;
  eventoId: string;
  userId: string;
  dataInscricao: string;
  status: 'inscrito' | 'presente' | 'ausente' | 'cancelado';
  valorPago?: number;
  dataPagamento?: string;
  observacoes?: string;
  
  // Populated fields from joins
  user?: User;
  evento?: any; // Will reference Evento interface
}

// Marketing analytics interface
export interface ParticipationHistory {
  userId: string;
  user: User;
  totalEventos: number;
  eventosComoNaoAssociado: number;
  eventosComoAssociado: number;
  dataUltimaParticipacao: string;
  frequenciaParticipacao: 'alta' | 'media' | 'baixa';
  potencialConversao: 'alto' | 'medio' | 'baixo';
}
