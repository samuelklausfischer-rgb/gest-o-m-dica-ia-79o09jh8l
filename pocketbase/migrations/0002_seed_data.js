migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      app.findAuthRecordByEmail('users', 'samuelklausfischer@hotmail.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('samuelklausfischer@hotmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      app.save(record)
    }

    const admin = app.findAuthRecordByEmail('users', 'samuelklausfischer@hotmail.com')
    const medicos = app.findCollectionByNameOrId('medicos')

    try {
      app.findFirstRecordByData('medicos', 'cpf', '111.222.333-44')
    } catch (_) {
      const record = new Record(medicos)
      record.set('nome_completo', 'Dra. Ana Silva')
      record.set('cpf', '111.222.333-44')
      record.set('crm', '123456')
      record.set('uf_crm', 'SP')
      record.set('especialidade', 'Cardiologia')
      record.set('email', 'ana.silva@exemplo.com')
      record.set('telefone', '(11) 98888-7777')
      record.set('categoria_medico', 'MEDICO PRN')
      record.set('tipo_contratacao', 'PJ')
      record.set('contrato_assinado', true)
      record.set('origem_cadastro', 'manual')
      record.set('status_cadastro', 'Ativo')
      record.set('ativo', true)
      app.save(record)

      const pjCol = app.findCollectionByNameOrId('dados_pj')
      const pj = new Record(pjCol)
      pj.set('medico_id', record.id)
      pj.set('razao_social', 'Ana Silva Serviços Médicos LTDA')
      pj.set('cnpj', '12.345.678/0001-99')
      app.save(pj)

      const contCol = app.findCollectionByNameOrId('contratos_medicos')
      const cont = new Record(contCol)
      cont.set('medico_id', record.id)
      cont.set('modelo_remuneracao', 'Plantão')
      cont.set('valor_acordado', '1500,00')
      app.save(cont)

      const audCol = app.findCollectionByNameOrId('auditoria_medicos')
      const aud = new Record(audCol)
      aud.set('medico_id', record.id)
      aud.set('acao', 'Criação de cadastro manual')
      aud.set('usuario_id', admin.id)
      app.save(aud)
    }
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('medicos', 'cpf', '111.222.333-44')
      app.delete(record)
    } catch (_) {}
  },
)
