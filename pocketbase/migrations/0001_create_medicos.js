migrate(
  (app) => {
    const medicos = new Collection({
      name: 'medicos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome_completo', type: 'text', required: true },
        { name: 'cpf', type: 'text', required: true },
        { name: 'crm', type: 'text', required: true },
        { name: 'uf_crm', type: 'text', required: true },
        { name: 'rqe', type: 'text' },
        { name: 'especialidade', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'cnes', type: 'text' },
        {
          name: 'categoria_medico',
          type: 'select',
          values: ['MEDICO PRN', 'MEDICO PALHOÇA', 'MEDICO APICE TELE', 'MEDICO TELEIMAGEM'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'tipo_contratacao',
          type: 'select',
          values: ['SCP', 'PJ'],
          maxSelect: 1,
          required: true,
        },
        { name: 'contrato_assinado', type: 'bool' },
        { name: 'observacoes', type: 'text' },
        {
          name: 'origem_cadastro',
          type: 'select',
          values: ['manual', 'ia'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'status_cadastro',
          type: 'select',
          values: ['Rascunho', 'Pendente de Revisão', 'Ativo', 'Inativo'],
          maxSelect: 1,
          required: true,
        },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_medicos_cpf ON medicos (cpf)',
        'CREATE UNIQUE INDEX idx_medicos_crm ON medicos (crm)',
      ],
    })
    app.save(medicos)

    const medicosId = app.findCollectionByNameOrId('medicos').id
    const usersId = app.findCollectionByNameOrId('users').id

    const dadosPj = new Collection({
      name: 'dados_pj',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'medico_id',
          type: 'relation',
          collectionId: medicosId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'razao_social', type: 'text' },
        { name: 'cnpj', type: 'text' },
        { name: 'nome_fantasia', type: 'text' },
        { name: 'responsavel_legal', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(dadosPj)

    const contratos = new Collection({
      name: 'contratos_medicos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'medico_id',
          type: 'relation',
          collectionId: medicosId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'data_assinatura', type: 'date' },
        { name: 'vigencia_inicio', type: 'date' },
        { name: 'vigencia_fim', type: 'date' },
        {
          name: 'modelo_remuneracao',
          type: 'select',
          values: ['Fixo', 'Plantão', 'Hora', 'Produção', 'Outro'],
          maxSelect: 1,
        },
        { name: 'valor_acordado', type: 'text' },
        { name: 'descricao_modelo_outro', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(contratos)

    const documentos = new Collection({
      name: 'documentos_medicos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'medico_id',
          type: 'relation',
          collectionId: medicosId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome_arquivo', type: 'text' },
        { name: 'tipo_arquivo', type: 'text' },
        { name: 'url_arquivo', type: 'file', maxSelect: 1, maxSize: 10485760 },
        { name: 'origem_documento', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(documentos)

    const importacoes = new Collection({
      name: 'importacoes_ia_medicos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'arquivos_enviados', type: 'file', maxSelect: 10, maxSize: 52428800 },
        { name: 'json_extraido', type: 'json' },
        { name: 'confianca_extracao', type: 'json' },
        {
          name: 'status_revisao',
          type: 'select',
          values: ['Pendente de Revisão', 'Aprovado', 'Rejeitado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(importacoes)

    const auditoria = new Collection({
      name: 'auditoria_medicos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'medico_id',
          type: 'relation',
          collectionId: medicosId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'acao', type: 'text', required: true },
        { name: 'campo_alterado', type: 'text' },
        { name: 'valor_anterior', type: 'text' },
        { name: 'valor_novo', type: 'text' },
        { name: 'usuario_id', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(auditoria)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('auditoria_medicos'))
    app.delete(app.findCollectionByNameOrId('importacoes_ia_medicos'))
    app.delete(app.findCollectionByNameOrId('documentos_medicos'))
    app.delete(app.findCollectionByNameOrId('contratos_medicos'))
    app.delete(app.findCollectionByNameOrId('dados_pj'))
    app.delete(app.findCollectionByNameOrId('medicos'))
  },
)
