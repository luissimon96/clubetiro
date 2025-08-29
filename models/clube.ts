// Club management models for hierarchical system

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface Contato {
  telefone: string;
  email: string;
  responsavel: string;
}

export interface Licenca {
  status: 'ativa' | 'suspensa' | 'cancelada' | 'pendente';
  dataVencimento: string;
  valorMensal: number;
  plano: 'basico' | 'intermediario' | 'premium';
}

export interface Clube {
  id: string;
  nome: string;
  cnpj: string;
  cr: string; // Certificado de Registro
  endereco: Endereco;
  contato: Contato;
  licenca: Licenca;
  stripeCustomerId?: string;
  dataCadastro: string;
  dataAtualizacao: string;
  ativo: boolean;
}

export interface ClubeLicenca {
  id: string;
  clubeId: string;
  mes: number;
  ano: number;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  stripePaymentIntentId?: string;
  metodoPagamento?: string;
  observacoes?: string;
  dataCadastro: string;
  dataAtualizacao: string;
  
  // Populated fields
  clube?: Clube;
}

// DTOs for API operations
export interface CreateClubeRequest {
  nome: string;
  cnpj: string;
  cr: string;
  endereco: Endereco;
  contato: Contato;
  licenca: Omit<Licenca, 'status'>; // status will be set to 'pendente' by default
}

export interface UpdateClubeRequest {
  nome?: string;
  cnpj?: string;
  cr?: string;
  endereco?: Endereco;
  contato?: Contato;
  licenca?: Licenca;
  ativo?: boolean;
}

export interface ClubeListFilter {
  ativo?: boolean;
  status?: Licenca['status'];
  plano?: Licenca['plano'];
  search?: string; // Search by name, CNPJ, or CR
  page?: number;
  limit?: number;
}

export interface ClubeStats {
  totalClubes: number;
  clubesAtivos: number;
  clubesSuspensos: number;
  receitaMensalTotal: number;
  licencasVencendoEm30Dias: number;
}

// Validation helpers
export function validateCNPJ(cnpj: string): boolean {
  // Remove non-numeric characters
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  // Check if it has 14 digits
  if (cleanCNPJ.length !== 14) return false;
  
  // Check if all digits are the same (invalid)
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // CNPJ validation algorithm
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  const calculateDigit = (digits: string, weights: number[]): number => {
    const sum = digits.split('').reduce((acc, digit, index) => {
      return acc + parseInt(digit) * weights[index];
    }, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  
  const firstDigit = calculateDigit(cleanCNPJ.substring(0, 12), weights1);
  const secondDigit = calculateDigit(cleanCNPJ.substring(0, 13), weights2);
  
  return (
    parseInt(cleanCNPJ.charAt(12)) === firstDigit &&
    parseInt(cleanCNPJ.charAt(13)) === secondDigit
  );
}

export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export function validateCEP(cep: string): boolean {
  const cleanCEP = cep.replace(/[^\d]/g, '');
  return /^\d{8}$/.test(cleanCEP);
}

export function formatCEP(cep: string): string {
  const cleanCEP = cep.replace(/[^\d]/g, '');
  return cleanCEP.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}