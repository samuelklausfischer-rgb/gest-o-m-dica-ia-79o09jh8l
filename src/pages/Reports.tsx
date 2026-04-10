import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, BarChart3, Users, Loader2, Activity } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'

export default function Reports() {
  const { user } = useAuth()
  const role =
    user?.name === 'Admin' ? 'Admin' : user?.name === 'Revisor' ? 'Revisor' : 'Operacional'
  const { toast } = useToast()
  const [audits, setAudits] = useState<any[]>([])
  const [isExporting, setIsExporting] = useState(false)

  const loadData = async () => {
    try {
      const data = await api.auditoria.listAll()
      setAudits(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const generateProductivity = () => {
    const userStats: Record<
      string,
      { name: string; created: number; approved: number; others: number }
    > = {}

    audits.forEach((a) => {
      const uId = a.usuario_id || 'system'
      const uName = a.expand?.usuario_id?.name || 'Sistema Automático'

      if (!userStats[uId]) userStats[uId] = { name: uName, created: 0, approved: 0, others: 0 }

      if (a.acao.toLowerCase().includes('criação')) userStats[uId].created++
      else if (a.acao.toLowerCase().includes('aprovação')) userStats[uId].approved++
      else userStats[uId].others++
    })

    return Object.values(userStats)
  }

  const prodData = generateProductivity()

  if (role !== 'Admin') return <Navigate to="/" />

  const exportProductivity = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      await api.auditoria.log('', 'Exportação', 'Relatório de Produtividade', '', '')
      const csvRows = [['Usuario', 'Cadastros Criados', 'Cadastros Aprovados', 'Outras Acoes']]
      prodData.forEach((d) =>
        csvRows.push([
          `"${d.name}"`,
          d.created.toString(),
          d.approved.toString(),
          d.others.toString(),
        ]),
      )
      const blob = new Blob([csvRows.map((r) => r.join(',')).join('\n')], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'produtividade.csv'
      a.click()
      toast({ title: 'Exportação concluída' })
    } catch (e) {
      toast({ title: 'Erro na exportação', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary border border-primary/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          Relatórios Operacionais
        </h1>
        <p className="text-muted-foreground mt-2 text-sm font-medium">
          Gere visões gerenciais da produtividade da equipe e status da base.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
          <CardHeader className="border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Users className="w-5 h-5 text-primary" /> Relatório de Produtividade
            </CardTitle>
            <CardDescription className="text-white/60 font-medium">
              Volume de ações realizadas por usuário no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {prodData.map((d, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 border border-white/5 rounded-xl bg-black/20 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/20">
                      {d.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm text-white">{d.name}</span>
                  </div>
                  <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider">
                    <span
                      className="flex flex-col items-center bg-white/5 px-3 py-1.5 rounded border border-white/5"
                      title="Criados"
                    >
                      <span className="text-white/50 mb-0.5">Criados</span>
                      <span className="text-primary text-sm">{d.created}</span>
                    </span>
                    <span
                      className="flex flex-col items-center bg-white/5 px-3 py-1.5 rounded border border-white/5"
                      title="Aprovados"
                    >
                      <span className="text-white/50 mb-0.5">Aprov.</span>
                      <span className="text-emerald-400 text-sm">{d.approved}</span>
                    </span>
                    <span
                      className="flex flex-col items-center bg-white/5 px-3 py-1.5 rounded border border-white/5"
                      title="Outros"
                    >
                      <span className="text-white/50 mb-0.5">Outros</span>
                      <span className="text-white/80 text-sm">{d.others}</span>
                    </span>
                  </div>
                </div>
              ))}
              {prodData.length === 0 && (
                <div className="text-sm text-muted-foreground py-8 text-center flex flex-col items-center gap-2">
                  <Activity className="w-6 h-6 text-white/20" />
                  Nenhum dado de produtividade encontrado.
                </div>
              )}
            </div>
            <Button
              className="w-full mt-6 gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10"
              onClick={exportProductivity}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Processando Exportação...' : 'Baixar Relatório (CSV)'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
