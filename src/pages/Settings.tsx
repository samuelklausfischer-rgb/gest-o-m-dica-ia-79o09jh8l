import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings as SettingsIcon, Save } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'

export default function Settings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const role =
    user?.name === 'Admin' ? 'Admin' : user?.name === 'Revisor' ? 'Revisor' : 'Operacional'

  const [configId, setConfigId] = useState('')
  const [days, setDays] = useState(30)

  const loadData = async () => {
    try {
      const conf = await api.configuracoes.get()
      if (conf) {
        setConfigId(conf.id)
        setDays(conf.dias_alerta_contrato)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (role !== 'Admin') return <Navigate to="/" />

  const handleSave = async () => {
    if (!configId) return
    try {
      await api.configuracoes.update(configId, { dias_alerta_contrato: days })
      toast({ title: 'Configurações atualizadas' })
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Configurações do Sistema</h1>
        <p className="text-muted-foreground mt-1">Ajuste parâmetros globais de alertas e SLA.</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" /> Alertas e Prazos
          </CardTitle>
          <CardDescription>
            Defina quando o sistema deve avisar sobre pendências contratuais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Dias de antecedência para Alerta de Vencimento de Contrato</Label>
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-32"
              min={1}
            />
            <p className="text-xs text-muted-foreground">
              O sistema criará notificações quando um contrato chegar a este limite de dias para
              vencer.
            </p>
          </div>

          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" /> Salvar Alterações
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
