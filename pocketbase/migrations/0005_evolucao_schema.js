migrate(
  (app) => {
    const medicos = app.findCollectionByNameOrId('medicos')
    medicos.fields.add(
      new SelectField({
        name: 'status_cadastro',
        values: [
          'Rascunho',
          'Pendente de Revisão',
          'Pendente Documental',
          'Pendente Contratual',
          'Aprovado',
          'Ativo',
          'Inativo',
          'Rejeitado',
        ],
        required: true,
      }),
    )
    app.save(medicos)

    const docs = app.findCollectionByNameOrId('documentos_medicos')
    docs.fields.add(
      new SelectField({
        name: 'status_validacao',
        values: ['Validado', 'Pendente', 'Inválido', 'Vencido'],
        required: false,
      }),
    )
    docs.fields.add(
      new SelectField({
        name: 'categoria_documento',
        values: ['Pessoal', 'CRM', 'RQE', 'Contrato', 'Comprovante', 'PJ', 'Outro'],
        required: false,
      }),
    )
    docs.fields.add(
      new BoolField({
        name: 'ativo',
      }),
    )
    app.save(docs)

    app.db().newQuery('UPDATE documentos_medicos SET ativo = 1').execute()
    app
      .db()
      .newQuery(
        "UPDATE documentos_medicos SET status_validacao = 'Pendente' WHERE status_validacao IS NULL OR status_validacao = ''",
      )
      .execute()
    app
      .db()
      .newQuery(
        "UPDATE documentos_medicos SET categoria_documento = 'Outro' WHERE categoria_documento IS NULL OR categoria_documento = ''",
      )
      .execute()
  },
  (app) => {
    const docs = app.findCollectionByNameOrId('documentos_medicos')
    docs.fields.removeByName('status_validacao')
    docs.fields.removeByName('categoria_documento')
    docs.fields.removeByName('ativo')
    app.save(docs)

    const medicos = app.findCollectionByNameOrId('medicos')
    medicos.fields.add(
      new SelectField({
        name: 'status_cadastro',
        values: ['Rascunho', 'Pendente de Revisão', 'Ativo', 'Inativo'],
        required: true,
      }),
    )
    app.save(medicos)
  },
)
