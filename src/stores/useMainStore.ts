import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { Doctor, Activity, Role, Status } from '@/types'

interface MainStoreState {
  role: Role
  setRole: (role: Role) => void
  doctors: Doctor[]
  activities: Activity[]
  addDoctor: (doctor: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateDoctor: (id: string, data: Partial<Doctor>) => void
  deleteDoctor: (id: string) => void
  logActivity: (medicoId: string, medicoNome: string, acao: string) => void
}

const mockDoctors: Doctor[] = [
  {
    id: '1',
    nome: 'Dra. Ana Silva',
    cpf: '111.222.333-44',
    dataNascimento: '1985-04-12',
    email: 'ana.silva@exemplo.com',
    telefone: '(11) 98888-7777',
    crm: '123456',
    ufCrm: 'SP',
    especialidade: 'Cardiologia',
    rqe: '1234',
    categoria: 'MEDICO PRN',
    tipoContratacao: 'PJ',
    contratoAssinado: true,
    status: 'Ativo',
    pjRazaoSocial: 'Ana Silva Serviços Médicos LTDA',
    pjCnpj: '12.345.678/0001-99',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    nome: 'Dr. Carlos Mendes',
    cpf: '222.333.444-55',
    dataNascimento: '1979-11-23',
    email: 'carlos.mendes@exemplo.com',
    telefone: '(21) 97777-6666',
    crm: '654321',
    ufCrm: 'RJ',
    especialidade: 'Ortopedia',
    categoria: 'MEDICO TELEIMAGEM',
    tipoContratacao: 'SCP',
    contratoAssinado: false,
    status: 'Pendente de Revisão',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    nome: 'Dra. Beatriz Santos',
    cpf: '333.444.555-66',
    dataNascimento: '1990-08-05',
    email: 'beatriz.santos@exemplo.com',
    telefone: '(48) 96666-5555',
    crm: '789012',
    ufCrm: 'SC',
    especialidade: 'Clínica Médica',
    categoria: 'MEDICO PALHOÇA',
    tipoContratacao: 'PJ',
    contratoAssinado: false,
    status: 'Rascunho',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const mockActivities: Activity[] = [
  {
    id: '1',
    medicoId: '1',
    medicoNome: 'Dra. Ana Silva',
    acao: 'Aprovou cadastro',
    usuario: 'Admin',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    medicoId: '2',
    medicoNome: 'Dr. Carlos Mendes',
    acao: 'Criou cadastro via IA',
    usuario: 'Sistema',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
]

const MainStoreContext = createContext<MainStoreState | null>(null)

export const MainStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [role, setRole] = useState<Role>('Administrador')
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors)
  const [activities, setActivities] = useState<Activity[]>(mockActivities)

  const logActivity = useCallback(
    (medicoId: string, medicoNome: string, acao: string) => {
      const newActivity: Activity = {
        id: Math.random().toString(36).substr(2, 9),
        medicoId,
        medicoNome,
        acao,
        usuario: role === 'Administrador' ? 'Admin (Você)' : 'Operacional (Você)',
        timestamp: new Date().toISOString(),
      }
      setActivities((prev) => [newActivity, ...prev])
    },
    [role],
  )

  const addDoctor = useCallback(
    (data: Omit<Doctor, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newDoctor: Doctor = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setDoctors((prev) => [newDoctor, ...prev])
      logActivity(newDoctor.id, newDoctor.nome, `Criou novo médico (${newDoctor.status})`)
    },
    [logActivity],
  )

  const updateDoctor = useCallback(
    (id: string, data: Partial<Doctor>) => {
      setDoctors((prev) =>
        prev.map((doc) => {
          if (doc.id === id) {
            const updated = { ...doc, ...data, updatedAt: new Date().toISOString() }
            if (data.status && data.status !== doc.status) {
              logActivity(id, updated.nome, `Alterou status para ${data.status}`)
            } else {
              logActivity(id, updated.nome, 'Atualizou dados do médico')
            }
            return updated
          }
          return doc
        }),
      )
    },
    [logActivity],
  )

  const deleteDoctor = useCallback(
    (id: string) => {
      const doc = doctors.find((d) => d.id === id)
      if (doc) {
        logActivity(id, doc.nome, 'Excluiu o registro')
        setDoctors((prev) => prev.filter((d) => d.id !== id))
      }
    },
    [doctors, logActivity],
  )

  const value = useMemo(
    () => ({
      role,
      setRole,
      doctors,
      activities,
      addDoctor,
      updateDoctor,
      deleteDoctor,
      logActivity,
    }),
    [role, doctors, activities, addDoctor, updateDoctor, deleteDoctor, logActivity],
  )

  return React.createElement(MainStoreContext.Provider, { value }, children)
}

export default function useMainStore() {
  const context = useContext(MainStoreContext)
  if (!context) throw new Error('useMainStore must be used within MainStoreProvider')
  return context
}
