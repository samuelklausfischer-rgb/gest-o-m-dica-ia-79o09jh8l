import pb from '@/lib/pocketbase/client'

export const api = {
  medicos: {
    list: () => pb.collection('medicos').getFullList({ sort: '-created' }),
    get: (id: string) => pb.collection('medicos').getOne(id),
    create: (data: any) => pb.collection('medicos').create(data),
    update: (id: string, data: any) => pb.collection('medicos').update(id, data),
  },
  dadosPj: {
    getByMedico: async (medicoId: string) => {
      try {
        return await pb.collection('dados_pj').getFirstListItem(`medico_id="${medicoId}"`)
      } catch {
        return null
      }
    },
    create: (data: any) => pb.collection('dados_pj').create(data),
    update: (id: string, data: any) => pb.collection('dados_pj').update(id, data),
  },
  contratos: {
    listAll: () => pb.collection('contratos_medicos').getFullList({ expand: 'medico_id' }),
    listExpiring: (days: number) => {
      const future = new Date()
      future.setDate(future.getDate() + days)
      return pb.collection('contratos_medicos').getFullList({
        filter: `vigencia_fim >= "${new Date().toISOString().split('T')[0]} 00:00:00" && vigencia_fim <= "${future.toISOString().split('T')[0]} 23:59:59"`,
        expand: 'medico_id',
      })
    },
    getByMedico: async (medicoId: string) => {
      try {
        return await pb.collection('contratos_medicos').getFirstListItem(`medico_id="${medicoId}"`)
      } catch {
        return null
      }
    },
    create: (data: any) => pb.collection('contratos_medicos').create(data),
    update: (id: string, data: any) => pb.collection('contratos_medicos').update(id, data),
  },
  documentos: {
    listByMedico: (medicoId: string) =>
      pb
        .collection('documentos_medicos')
        .getFullList({ filter: `medico_id="${medicoId}"`, sort: '-created' }),
    listAllActive: () => pb.collection('documentos_medicos').getFullList({ filter: `ativo=true` }),
    create: (data: FormData) => pb.collection('documentos_medicos').create(data),
    update: (id: string, data: any) => pb.collection('documentos_medicos').update(id, data),
    getFileUrl: (record: any) => pb.files.getURL(record, record.url_arquivo),
  },
  auditoria: {
    listAll: () =>
      pb
        .collection('auditoria_medicos')
        .getFullList({ sort: '-created', expand: 'usuario_id,medico_id' }),
    listByMedico: (medicoId: string) =>
      pb
        .collection('auditoria_medicos')
        .getFullList({ filter: `medico_id="${medicoId}"`, sort: '-created', expand: 'usuario_id' }),
    listRecent: () =>
      pb
        .collection('auditoria_medicos')
        .getList(1, 10, { sort: '-created', expand: 'usuario_id,medico_id' }),
    log: (
      medico_id: string,
      acao: string,
      campo_alterado?: string,
      valor_anterior?: string,
      valor_novo?: string,
    ) => {
      return pb
        .collection('auditoria_medicos')
        .create({
          medico_id,
          acao,
          campo_alterado,
          valor_anterior,
          valor_novo,
          usuario_id: pb.authStore.record?.id,
        })
        .catch(console.error)
    },
  },
  ia: {
    list: () => pb.collection('importacoes_ia_medicos').getFullList({ sort: '-created' }),
    listPendingOld: () => {
      const past = new Date()
      past.setHours(past.getHours() - 24)
      return pb.collection('importacoes_ia_medicos').getFullList({
        filter: `status_revisao = "Pendente de Revisão" && created <= "${past.toISOString()}"`,
      })
    },
    create: (data: FormData) => pb.collection('importacoes_ia_medicos').create(data),
    update: (id: string, data: any) => pb.collection('importacoes_ia_medicos').update(id, data),
    get: (id: string) => pb.collection('importacoes_ia_medicos').getOne(id),
  },
  notificacoes: {
    list: (userId: string) =>
      pb
        .collection('notificacoes')
        .getFullList({ filter: `user_id="${userId}"`, sort: '-created' }),
    markAsRead: (id: string) => pb.collection('notificacoes').update(id, { lida: true }),
    markAllAsRead: async (userId: string) => {
      const unread = await pb
        .collection('notificacoes')
        .getFullList({ filter: `user_id="${userId}" && lida=false` })
      return Promise.all(
        unread.map((n) => pb.collection('notificacoes').update(n.id, { lida: true })),
      )
    },
  },
  filtros: {
    list: (userId: string) =>
      pb
        .collection('filtros_salvos')
        .getFullList({ filter: `user_id="${userId}"`, sort: '-created' }),
    create: (data: any) => pb.collection('filtros_salvos').create(data),
    delete: (id: string) => pb.collection('filtros_salvos').delete(id),
  },
  configuracoes: {
    get: async () => {
      try {
        return await pb.collection('configuracoes_sistema').getFirstListItem("id!=''")
      } catch {
        return null
      }
    },
    update: (id: string, data: any) => pb.collection('configuracoes_sistema').update(id, data),
  },
}
