migrate(
  (app) => {
    const notificacoes = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_' },
        { name: 'titulo', type: 'text', required: true },
        { name: 'mensagem', type: 'text', required: true },
        { name: 'lida', type: 'bool' },
        { name: 'prioridade', type: 'select', values: ['Baixa', 'Média', 'Alta', 'Crítica'] },
        { name: 'link', type: 'text' },
        {
          name: 'tipo',
          type: 'select',
          values: ['Sistema', 'Documento', 'Contrato', 'IA', 'Duplicidade'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_notificacoes_user ON notificacoes (user_id)'],
    })
    app.save(notificacoes)

    const filtros = new Collection({
      name: 'filtros_salvos',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        { name: 'user_id', type: 'relation', required: true, collectionId: '_pb_users_auth_' },
        { name: 'nome', type: 'text', required: true },
        { name: 'configuracao_json', type: 'json', required: true },
        { name: 'favorito', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(filtros)

    const config = new Collection({
      name: 'configuracoes_sistema',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'dias_alerta_contrato', type: 'number', required: true },
        { name: 'documentos_obrigatorios', type: 'json', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(config)

    const confRecord = new Record(config)
    confRecord.set('dias_alerta_contrato', 30)
    confRecord.set('documentos_obrigatorios', {
      'MEDICO PRN': ['CRM', 'Comprovante', 'Contrato'],
      'MEDICO PALHOÇA': ['CRM', 'Comprovante', 'Contrato'],
      'MEDICO APICE TELE': ['CRM', 'Comprovante'],
      'MEDICO TELEIMAGEM': ['CRM', 'Comprovante'],
    })
    app.save(confRecord)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('notificacoes'))
    app.delete(app.findCollectionByNameOrId('filtros_salvos'))
    app.delete(app.findCollectionByNameOrId('configuracoes_sistema'))
  },
)
