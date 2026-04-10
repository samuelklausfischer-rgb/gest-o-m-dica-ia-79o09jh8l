import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  UserPlus,
  BrainCircuit,
  Users,
  FileCheck,
  FileWarning,
  Clock,
  FileSignature,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { api } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'

export default function Index() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [expiringContracts, setExpiringContracts] = useState<any[]>([])
  const [pendingIa, setPendingIa] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)

  const loadData = async () => {
    try {
      const conf = await api.configuracoes.get()
      setConfig(conf)
      const days = conf?.dias_alerta_contrato || 30

      const [docs, acts, expiring, pending] = await Promise.all([
        api.medicos.list(),
        api.auditoria.listRecent(),
        api.contratos.listExpiring(days),
        api.ia.listPendingOld(),
      ])
      setDoctors(docs)
      setActivities(acts.items)
      setExpiringContracts(expiring)
      setPendingIa(pending)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('medicos', () => loadData())
  useRealtime('auditoria_medicos', () => loadData())
  useRealtime('contratos_medicos', () => loadData())

  const stats = {
    total: doctors.filter((d) => d.status_cadastro === 'Ativo' || d.status_cadastro === 'Aprovado')
      .length,
    pendingRevision: doctors.filter((d) => d.status_cadastro === 'Pendente de Revisão').length,
    pendingDocs: doctors.filter(
      (d) =>
        d.status_cadastro === 'Pendente Documental' || d.status_cadastro === 'Pendente Contratual',
    ).length,
    expiring: expiringContracts.length,
    duplicities: 0, // Mocked for now, as real duplicity requires complex backend query
  }

  const categoryData = Object.entries(
    doctors.reduce(
      (acc, curr) => {
        acc[curr.categoria_medico] = (acc[curr.categoria_medico] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }))

  const statusData = Object.entries(
    doctors.reduce(
      (acc, curr) => {
        acc[curr.status_cadastro] = (acc[curr.status_cadastro] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }))

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard Executivo</h1>
          <p className="text-muted-foreground mt-1">Visão geral da operação médica e SLAs.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/medicos/novo">
              <UserPlus className="w-4 h-4" /> Cadastro Manual
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-secondary hover:bg-secondary/90 text-white">
            <Link to="/medicos/ia-upload">
              <BrainCircuit className="w-4 h-4" /> Cadastro via IA
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ativos / Aprovados</CardTitle>
            <FileCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Revisão Pendente</CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRevision}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pendência Doc/Contrato</CardTitle>
            <FileWarning className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingDocs}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Contratos Expirando</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiring}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-slate-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Suspeitas de Duplicidade</CardTitle>
            <Users className="w-4 h-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.duplicities}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Cadastros por Status</CardTitle>
            <CardDescription>Distribuição atual de todos os registros na base</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {statusData.length > 0 ? (
              <ChartContainer config={{}} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} />
                    <RechartsTooltip cursor={{ fill: 'var(--muted)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Sem dados
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Top Prioridades</CardTitle>
            <CardDescription>Ações urgentes do dia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">IA Pendente (&gt; 24h)</span>
                <Badge variant="secondary">{pendingIa.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Contratos Vencendo</span>
                <Badge variant="secondary">{expiringContracts.length}</Badge>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full mt-4 justify-between group">
              <Link to="/pendencias">
                Ir para Pendências{' '}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Atividade Recente da Operação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {activities.map((act) => (
              <div
                key={act.id}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-4"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-primary/10 text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10">
                  <FileSignature className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-lg border bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm">{act.acao}</div>
                  </div>
                  <div className="text-sm font-medium text-primary hover:underline">
                    <Link to={`/medicos/${act.medico_id}`}>
                      {act.expand?.medico_id?.nome_completo || 'Médico'}
                    </Link>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Por {act.expand?.usuario_id?.name || 'Sistema'} em{' '}
                    {new Date(act.created).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">
                Nenhuma atividade registrada.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
