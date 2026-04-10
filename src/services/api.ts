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
      pb.collection('documentos_medicos').getFullList({ filter: `medico_id="${medicoId}"` }),
    create: (data: FormData) => pb.collection('documentos_medicos').create(data),
  },
  auditoria: {
    listByMedico: (medicoId: string) =>
      pb
        .collection('auditoria_medicos')
        .getFullList({ filter: `medico_id="${medicoId}"`, sort: '-created', expand: 'usuario_id' }),
    listRecent: () =>
      pb
        .collection('auditoria_medicos')
        .getList(1, 5, { sort: '-created', expand: 'usuario_id,medico_id' }),
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
    create: (data: FormData) => pb.collection('importacoes_ia_medicos').create(data),
    update: (id: string, data: any) => pb.collection('importacoes_ia_medicos').update(id, data),
    get: (id: string) => pb.collection('importacoes_ia_medicos').getOne(id),
  },
}
