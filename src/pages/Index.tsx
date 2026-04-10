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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
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
    duplicities: 0,
  }

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
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Visão geral da operação médica e monitoramento de SLAs.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="gap-2 bg-black/20 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <Link to="/medicos/novo">
              <UserPlus className="w-4 h-4" /> Cadastro Manual
            </Link>
          </Button>
          <Button
            asChild
            className="gap-2 bg-gradient-to-r from-accent to-purple-600 hover:from-accent/90 hover:to-purple-600/90 text-white shadow-glow border-none"
          >
            <Link to="/medicos/ia-upload">
              <BrainCircuit className="w-4 h-4" /> Cadastro via IA
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="glass-card overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/80 group-hover:bg-emerald-400 transition-colors"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos / Aprovados
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/80 group-hover:bg-amber-400 transition-colors"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revisão Pendente
            </CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.pendingRevision}</div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/80 group-hover:bg-indigo-400 transition-colors"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendente Doc/Contrato
            </CardTitle>
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <FileWarning className="w-4 h-4 text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.pendingDocs}</div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/80 group-hover:bg-red-400 transition-colors"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contratos Expirando
            </CardTitle>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.expiring}</div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-500/80 group-hover:bg-slate-400 transition-colors"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Duplicidades
            </CardTitle>
            <div className="p-2 bg-slate-500/10 rounded-lg">
              <Users className="w-4 h-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.duplicities}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 glass-card flex flex-col">
          <CardHeader>
            <CardTitle className="text-white">Cadastros por Status</CardTitle>
            <CardDescription>Distribuição atual de todos os registros na base</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {statusData.length > 0 ? (
              <ChartContainer config={{}} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      stroke="#888"
                    />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#888" />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                    />
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

        <Card className="col-span-1 glass-card">
          <CardHeader>
            <CardTitle className="text-white">Top Prioridades</CardTitle>
            <CardDescription>Ações urgentes exigidas pelo sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
                  <span className="text-sm font-medium text-white">IA Pendente (&gt; 24h)</span>
                </div>
                <Badge className="bg-accent/20 text-accent hover:bg-accent/30 border-none">
                  {pendingIa.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-white">Contratos Vencendo</span>
                </div>
                <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-none">
                  {expiringContracts.length}
                </Badge>
              </div>
            </div>

            <Button
              asChild
              variant="outline"
              className="w-full mt-6 justify-between group bg-transparent border-white/10 hover:bg-white/5"
            >
              <Link to="/pendencias">
                Ir para Pendências{' '}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform text-primary" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-white">Atividade Recente da Operação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
            {activities.map((act) => (
              <div
                key={act.id}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-4"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/30 bg-black/60 backdrop-blur-sm text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_15px_rgba(var(--primary),0.3)] z-10">
                  <FileSignature className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm shadow-sm hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm text-white">{act.acao}</div>
                  </div>
                  <div className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    <Link to={`/medicos/${act.medico_id}`}>
                      {act.expand?.medico_id?.nome_completo || 'Médico'}
                    </Link>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 font-medium">
                    Por {act.expand?.usuario_id?.name || 'Sistema'} em{' '}
                    <span className="text-white/70">
                      {new Date(act.created).toLocaleString('pt-BR')}
                    </span>
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
