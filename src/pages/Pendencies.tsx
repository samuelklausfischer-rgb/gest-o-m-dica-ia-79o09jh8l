import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileWarning,
  Clock,
  FileSignature,
  ChevronRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { api } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'

export default function Pendencies() {
  const [doctors, setDoctors] = useState<any[]>([])

  const loadData = async () => {
    try {
      const docs = await api.medicos.list()
      setDoctors(docs)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('medicos', () => loadData())

  const pendDocs = doctors.filter((d) => d.status_cadastro === 'Pendente Documental')
  const pendCont = doctors.filter((d) => d.status_cadastro === 'Pendente Contratual')
  const pendRev = doctors.filter((d) => d.status_cadastro === 'Pendente de Revisão')
  const drafts = doctors.filter((d) => d.status_cadastro === 'Rascunho')

  const PendencyGroup = ({ title, desc, icon: Icon, items, gradient, glowColor }: any) => (
    <Card
      className={`glass-card overflow-hidden relative group border-t-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_40px_${glowColor}] transition-shadow duration-500`}
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`}></div>
      <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
        <CardTitle className="flex items-center gap-3 text-lg text-white">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 group-hover:bg-white/10 transition-colors">
            <Icon className="w-5 h-5 text-white/90" />
          </div>
          {title}
          <Badge className="ml-auto bg-white/10 hover:bg-white/20 text-white border-none font-bold">
            {items.length}
          </Badge>
        </CardTitle>
        <CardDescription className="text-white/60 font-medium">{desc}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 bg-black/20">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center flex flex-col items-center gap-2">
            <Sparkles className="w-6 h-6 text-white/20" />
            Nenhuma pendência nesta categoria.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((d: any) => {
              const days = Math.floor(
                (Date.now() - new Date(d.created).getTime()) / (1000 * 3600 * 24),
              )
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all hover:border-white/10 group/item"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-sm text-white group-hover/item:text-primary transition-colors">
                      {d.nome_completo}
                    </span>
                    <span className="text-[11px] font-medium text-white/50 flex items-center gap-1.5 uppercase tracking-wider">
                      <Clock className="w-3 h-3" /> Pendente há{' '}
                      <span className="text-white">{days} dias</span>
                    </span>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="bg-white/5 hover:bg-primary/20 hover:text-primary text-white border border-white/10 hover:border-primary/30 transition-all rounded-lg px-3"
                  >
                    <Link to={`/medicos/${d.id}`}>
                      Resolver{' '}
                      <ChevronRight className="w-4 h-4 ml-1 opacity-50 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                    </Link>
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          Central de Pendências
        </h1>
        <p className="text-muted-foreground mt-2 text-sm font-medium">
          Gerencie todos os gargalos e inconsistências da operação em um único lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PendencyGroup
          title="Pendências Contratuais"
          desc="Médicos aguardando assinatura ou envio de contrato."
          icon={FileSignature}
          items={pendCont}
          gradient="from-blue-500 to-indigo-500"
          glowColor="rgba(59,130,246,0.15)"
        />
        <PendencyGroup
          title="Pendências Documentais"
          desc="Faltam documentos obrigatórios validados."
          icon={FileWarning}
          items={pendDocs}
          gradient="from-indigo-500 to-purple-500"
          glowColor="rgba(99,102,241,0.15)"
        />
        <PendencyGroup
          title="Revisões de IA Pendentes"
          desc="Cadastros importados via IA aguardando validação humana."
          icon={Clock}
          items={pendRev}
          gradient="from-sky-400 to-blue-500"
          glowColor="rgba(14,165,233,0.15)"
        />
        <PendencyGroup
          title="Rascunhos Abandonados"
          desc="Cadastros manuais iniciados e não finalizados."
          icon={FileWarning}
          items={drafts}
          gradient="from-amber-400 to-orange-500"
          glowColor="rgba(245,158,11,0.15)"
        />
      </div>
    </div>
  )
}
