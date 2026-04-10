migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('contratos_medicos')
    col.fields.add(new BoolField({ name: 'ativo' }))
    app.save(col)
    app.db().newQuery('UPDATE contratos_medicos SET ativo = 1').execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('contratos_medicos')
    col.fields.removeByName('ativo')
    app.save(col)
  },
)
