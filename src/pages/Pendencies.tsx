import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileWarning, Clock, FileSignature, ChevronRight } from 'lucide-react'
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

  const PendencyGroup = ({ title, desc, icon: Icon, items, color }: any) => (
    <Card className="shadow-sm border-t-4" style={{ borderTopColor: color }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5" style={{ color }} /> {title}
          <Badge variant="secondary" className="ml-auto">
            {items.length}
          </Badge>
        </CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma pendência nesta categoria.</p>
        ) : (
          <div className="space-y-3">
            {items.map((d: any) => {
              const days = Math.floor(
                (Date.now() - new Date(d.created).getTime()) / (1000 * 3600 * 24),
              )
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{d.nome_completo}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Pendente há {days} dias
                    </span>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/medicos/${d.id}`}>
                      Resolver <ChevronRight className="w-4 h-4 ml-1" />
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Central de Pendências</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie todos os gargalos da operação em um único lugar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PendencyGroup
          title="Pendências Contratuais"
          desc="Médicos aguardando assinatura ou envio de contrato."
          icon={FileSignature}
          items={pendCont}
          color="#3b82f6"
        />
        <PendencyGroup
          title="Pendências Documentais"
          desc="Faltam documentos obrigatórios (CRM, Comprovante, etc)."
          icon={FileWarning}
          items={pendDocs}
          color="#6366f1"
        />
        <PendencyGroup
          title="Revisões de IA Pendentes"
          desc="Cadastros importados via IA aguardando validação humana."
          icon={Clock}
          items={pendRev}
          color="#0ea5e9"
        />
        <PendencyGroup
          title="Rascunhos Abandonados"
          desc="Cadastros manuais iniciados e não finalizados."
          icon={FileWarning}
          items={drafts}
          color="#f59e0b"
        />
      </div>
    </div>
  )
}
