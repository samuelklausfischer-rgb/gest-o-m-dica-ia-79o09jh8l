export type Role = 'Administrador' | 'Operacional'
export type Status = 'Ativo' | 'Inativo' | 'Rascunho' | 'Pendente de Revisão'
export type Category = 'MEDICO PRN' | 'MEDICO PALHOÇA' | 'MEDICO APICE TELE' | 'MEDICO TELEIMAGEM'
export type ContractType = 'SCP' | 'PJ'
export type RemunerationModel = 'Fixo' | 'Plantão' | 'Hora' | 'Produção' | 'Outro'

export interface Doctor {
  id: string
  nome: string
  cpf: string
  dataNascimento: string
  email: string
  telefone: string
  crm: string
  ufCrm: string
  rqe?: string
  especialidade: string
  cnes?: string
  categoria: Category
  tipoContratacao: ContractType
  contratoAssinado: boolean
  dataAssinatura?: string
  vigenciaInicio?: string
  vigenciaFim?: string
  modeloRemuneracao?: RemunerationModel
  valorAcordado?: string
  observacoes?: string
  pjRazaoSocial?: string
  pjCnpj?: string
  pjFantasia?: string
  pjResponsavel?: string
  status: Status
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  medicoId: string
  medicoNome: string
  acao: string
  usuario: string
  timestamp: string
}
