cronAdd('check_contratos', '0 0 * * *', () => {
  let dias = 30
  try {
    const config = $app.findFirstRecordByFilter('configuracoes_sistema', "id != ''")
    dias = config.getInt('dias_alerta_contrato') || 30
  } catch (e) {}

  const now = new Date()
  const future = new Date(now.getTime() + dias * 24 * 60 * 60 * 1000)

  const todayStr = now.toISOString().split('T')[0] + ' 00:00:00'
  const futureStr = future.toISOString().split('T')[0] + ' 23:59:59'

  const contratos = $app.findRecordsByFilter(
    'contratos_medicos',
    `vigencia_fim >= "${todayStr}" && vigencia_fim <= "${futureStr}"`,
    '',
    1000,
    0,
  )
  const expiredContratos = $app.findRecordsByFilter(
    'contratos_medicos',
    `vigencia_fim < "${todayStr}"`,
    '',
    1000,
    0,
  )

  const users = $app.findRecordsByFilter('_pb_users_auth_', "id != ''", '', 100, 0)
  const colNotif = $app.findCollectionByNameOrId('notificacoes')

  const processContract = (c, isExpired) => {
    try {
      const medico = $app.findRecordById('medicos', c.getString('medico_id'))
      if (medico.getString('status_cadastro') === 'Inativo') return

      const expDate = new Date(c.getString('vigencia_fim'))
      const diffTime = expDate - now
      const diffDays = Math.ceil(Math.abs(diffTime) / (1000 * 60 * 60 * 24))

      for (let u of users) {
        const todayPrefix = now.toISOString().split('T')[0]
        try {
          $app.findFirstRecordByFilter(
            'notificacoes',
            `user_id="${u.id}" && link="/medicos/${medico.id}" && created >= "${todayPrefix} 00:00:00"`,
          )
          continue
        } catch (e) {}

        const notif = new Record(colNotif)
        notif.set('user_id', u.id)
        notif.set('titulo', isExpired ? 'Contrato Expirado' : 'Contrato Vencendo')
        notif.set(
          'mensagem',
          isExpired
            ? `O contrato do(a) Dr(a) ${medico.getString('nome_completo')} expirou há ${diffDays} dias.`
            : `O contrato do(a) Dr(a) ${medico.getString('nome_completo')} expira em ${diffDays} dias.`,
        )
        notif.set('lida', false)
        notif.set('prioridade', isExpired ? 'Crítica' : diffDays <= 7 ? 'Crítica' : 'Alta')
        notif.set('link', `/medicos/${medico.id}`)
        notif.set('tipo', 'Contrato')
        $app.save(notif)
      }
    } catch (e) {
      console.log(e)
    }
  }

  for (let c of contratos) processContract(c, false)
  for (let c of expiredContratos) processContract(c, true)
})
