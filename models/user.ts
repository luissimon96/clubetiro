export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string; // hash
  tipo: 'admin' | 'comum';
  dataCadastro: string;
  ultimoLogin?: string;
}
