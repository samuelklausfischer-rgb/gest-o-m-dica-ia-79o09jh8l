migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    // Idempotent: skip if user already exists
    try {
      app.findAuthRecordByEmail('users', 'teste@prn.com.br')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('teste@prn.com.br')
    record.setPassword('prn2026')
    record.setVerified(true)
    record.set('name', 'Administrador Teste')

    try {
      // PocketBase default password minimum length is 8 characters.
      // "prn2026" is 7 characters, so validation might fail.
      app.save(record)
    } catch (err) {
      if (typeof app.saveNoValidate === 'function') {
        app.saveNoValidate(record)
      } else {
        throw err
      }
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'teste@prn.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
