import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  UserPlus,
  BrainCircuit,
  Users,
  FileCheck,
  FileWarning,
  Clock,
  FileSignature,
} from 'lucide-react'
import { Pie, PieChart, Cell, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { api } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'

export default function Index() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])

  const loadData = async () => {
    try {
      const [docs, acts] = await Promise.all([api.medicos.list(), api.auditoria.listRecent()])
      setDoctors(docs)
      setActivities(acts.items)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('medicos', () => loadData())
  useRealtime('auditoria_medicos', () => loadData())

  const stats = {
    total: doctors.length,
    signed: doctors.filter((d) => d.contrato_assinado).length,
    unsigned: doctors.filter((d) => !d.contrato_assinado).length,
    pj: doctors.filter((d) => d.tipo_contratacao === 'PJ').length,
    scp: doctors.filter((d) => d.tipo_contratacao === 'SCP').length,
    pending: doctors.filter((d) => d.status_cadastro === 'Pendente de Revisão').length,
    drafts: doctors.filter((d) => d.status_cadastro === 'Rascunho').length,
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

  const chartConfig = { value: { label: 'Médicos' } }
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral da sua operação médica.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Cadastrados</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Contratos Assinados</CardTitle>
            <FileCheck className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.signed}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-destructive">Sem Contrato</CardTitle>
            <FileWarning className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.unsigned}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-accent text-accent-foreground">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Revisões Pendentes</CardTitle>
            <Clock className="w-4 h-4 opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs opacity-80 mt-1">Aguardando aprovação de IA</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Médicos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {categoryData.length > 0 ? (
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      strokeWidth={5}
                      paddingAngle={5}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-center text-muted-foreground py-10">Nenhum dado disponível</div>
            )}
            <div className="flex justify-center gap-4 flex-wrap mt-4">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas atualizações no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activities.map((act) => (
                <div key={act.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <FileSignature className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {act.acao} -{' '}
                      <span className="text-primary">
                        {act.expand?.medico_id?.nome_completo || 'Médico'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Por {act.expand?.usuario_id?.name || 'Sistema'} em{' '}
                      {new Date(act.created).toLocaleString('pt-BR')}
                    </p>
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
    </div>
  )
}
