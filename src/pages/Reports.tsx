import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, BarChart3, Users, Loader2 } from 'lucide-react'
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Relatórios Operacionais</h1>
        <p className="text-muted-foreground mt-1">
          Gere visões gerenciais da produtividade e status da base.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Relatório de Produtividade
            </CardTitle>
            <CardDescription>Ações realizadas por usuário no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prodData.map((d, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 border rounded bg-muted/10"
                >
                  <span className="font-medium text-sm">{d.name}</span>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span title="Criados">
                      C: <strong className="text-foreground">{d.created}</strong>
                    </span>
                    <span title="Aprovados">
                      A: <strong className="text-foreground">{d.approved}</strong>
                    </span>
                    <span title="Outros">
                      O: <strong className="text-foreground">{d.others}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4 gap-2"
              onClick={exportProductivity}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exportando...' : 'Baixar Excel (CSV)'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
