migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      app.findAuthRecordByEmail('users', 'teste@prn.com.br')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('teste@prn.com.br')
    record.setPassword('Skip@2026')
    record.setVerified(true)
    record.set('name', 'Usuário Teste')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'teste@prn.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
