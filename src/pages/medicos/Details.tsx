import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Edit,
  FileText,
  Download,
  CheckCircle,
  Ban,
  UploadCloud,
  XCircle,
  Clock,
} from 'lucide-react'
import { api } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { maskCpf, maskCnpj, maskPhone } from '@/utils/masks'
import { useToast } from '@/hooks/use-toast'

export default function DoctorDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.name === 'Admin' || user?.name === 'Revisor' ? 'Administrador' : 'Operacional'
  const { toast } = useToast()

  const [doctor, setDoctor] = useState<any>(null)
  const [pj, setPj] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    if (!id) return
    try {
      const [d, p, c, doxs, acts] = await Promise.all([
        api.medicos.get(id),
        api.dadosPj.getByMedico(id),
        api.contratos.getByMedico(id),
        api.documentos.listByMedico(id),
        api.auditoria.listByMedico(id),
      ])
      setDoctor(d)
      setPj(p)
      setContract(c)
      setDocs(doxs)
      setActivities(acts)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])
  useRealtime('medicos', () => loadData())
  useRealtime('auditoria_medicos', () => loadData())
  useRealtime('documentos_medicos', () => loadData())

  if (!doctor) return <div className="p-8 text-center">Carregando médico...</div>

  const handleApprove = async () => {
    await api.medicos.update(doctor.id, { status_cadastro: 'Aprovado' })
    await api.auditoria.log(doctor.id, 'Aprovação de Cadastro')
    toast({ title: 'Cadastro Aprovado' })
  }

  const handleInactivate = async () => {
    await api.medicos.update(doctor.id, { status_cadastro: 'Inativo', ativo: false })
    await api.auditoria.log(doctor.id, 'Inativação de Cadastro')
    toast({ title: 'Cadastro Inativado' })
  }

  const handleReject = async () => {
    await api.medicos.update(doctor.id, { status_cadastro: 'Rejeitado' })
    await api.auditoria.log(doctor.id, 'Rejeição de Cadastro')
    toast({ title: 'Cadastro Rejeitado' })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    try {
      const form = new FormData()
      form.append('arquivos_enviados', e.target.files[0]) // mock
      form.append('medico_id', doctor.id)
      form.append('nome_arquivo', e.target.files[0].name)
      form.append('categoria_documento', 'Outro')
      form.append('status_validacao', 'Pendente')
      form.append('ativo', 'true')
      form.append('url_arquivo', e.target.files[0])

      await api.documentos.create(form)
      await api.auditoria.log(doctor.id, `Novo documento anexado: ${e.target.files[0].name}`)
      toast({ title: 'Documento Anexado' })
    } catch {
      toast({ title: 'Erro ao anexar documento', variant: 'destructive' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-emerald-500'
      case 'Aprovado':
        return 'bg-teal-500'
      case 'Inativo':
        return 'bg-slate-500'
      case 'Rejeitado':
        return 'bg-red-500'
      case 'Rascunho':
        return 'bg-amber-500'
      case 'Pendente de Revisão':
        return 'bg-sky-500'
      case 'Pendente Documental':
        return 'bg-indigo-500'
      case 'Pendente Contratual':
        return 'bg-blue-500'
      default:
        return 'bg-primary'
    }
  }

  const getDocStatusColor = (status: string) => {
    switch (status) {
      case 'Validado':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'Pendente':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'Inválido':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'Vencido':
        return 'text-slate-600 bg-slate-50 border-slate-200'
      default:
        return ''
    }
  }

  const activeDocs = docs.filter((d) => d.ativo !== false)
  const historyDocs = docs.filter((d) => d.ativo === false)

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-muted-foreground font-medium uppercase">{label}</span>
      <span className="text-sm font-medium">{value || '-'}</span>
    </div>
  )

  let completeness = 0
  if (doctor.nome_completo && doctor.cpf && doctor.email && doctor.telefone) completeness += 25
  else if (doctor.nome_completo && doctor.cpf) completeness += 15
  if (doctor.crm && doctor.uf_crm && doctor.especialidade && doctor.categoria_medico)
    completeness += 25
  else if (doctor.crm && doctor.uf_crm) completeness += 15
  if (activeDocs.filter((d) => d.status_validacao === 'Validado').length >= 2) completeness += 25
  else if (activeDocs.length > 0) completeness += 15
  if (doctor.categoria_medico === 'MEDICO PRN' || doctor.categoria_medico === 'MEDICO PALHOÇA') {
    if (doctor.contrato_assinado) completeness += 25
  } else completeness += 25

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/medicos')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {doctor.nome_completo.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                {doctor.nome_completo}
                <Badge className={getStatusColor(doctor.status_cadastro)}>
                  {doctor.status_cadastro}
                </Badge>
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                CRM: {doctor.crm}/{doctor.uf_crm}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {role === 'Administrador' &&
            ['Pendente de Revisão', 'Pendente Documental'].includes(doctor.status_cadastro) && (
              <>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  onClick={handleApprove}
                >
                  <CheckCircle className="w-4 h-4" /> Aprovar
                </Button>
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10 gap-2"
                  onClick={handleReject}
                >
                  <XCircle className="w-4 h-4" /> Rejeitar
                </Button>
              </>
            )}
          {role === 'Administrador' && doctor.status_cadastro !== 'Inativo' && (
            <Button variant="outline" className="text-slate-600 gap-2" onClick={handleInactivate}>
              <Ban className="w-4 h-4" /> Inativar
            </Button>
          )}
          <Button asChild variant="outline" className="gap-2">
            <Link to={`/medicos/editar/${doctor.id}`}>
              <Edit className="w-4 h-4" /> Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Dados Pessoais e Profissionais</CardTitle>
              <div className="flex items-center gap-3 w-40">
                <span className="text-xs font-semibold whitespace-nowrap">
                  Saúde: {Math.min(completeness, 100)}%
                </span>
                <Progress value={completeness} className="h-2" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InfoRow label="CPF" value={maskCpf(doctor.cpf || '')} />
                <InfoRow label="E-mail" value={doctor.email} />
                <InfoRow
                  label="Telefone"
                  value={doctor.telefone ? maskPhone(doctor.telefone) : ''}
                />
                <InfoRow label="Especialidade" value={doctor.especialidade} />
                <InfoRow label="RQE" value={doctor.rqe} />
                <InfoRow label="Categoria" value={doctor.categoria_medico} />
                <InfoRow label="Contratação" value={doctor.tipo_contratacao} />
              </div>
            </CardContent>
          </Card>

          {(doctor.tipo_contratacao === 'PJ' ||
            ['MEDICO PRN', 'MEDICO PALHOÇA'].includes(doctor.categoria_medico)) && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-lg">Dados Contratuais / Empresa</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {doctor.tipo_contratacao === 'PJ' && (
                    <>
                      <InfoRow label="CNPJ" value={pj?.cnpj ? maskCnpj(pj.cnpj) : ''} />
                      <InfoRow label="Razão Social" value={pj?.razao_social} />
                    </>
                  )}
                  {['MEDICO PRN', 'MEDICO PALHOÇA'].includes(doctor.categoria_medico) && (
                    <>
                      <InfoRow
                        label="Contrato Assinado"
                        value={doctor.contrato_assinado ? 'Sim' : 'Não'}
                      />
                      <InfoRow
                        label="Data Assinatura"
                        value={
                          contract?.data_assinatura
                            ? new Date(contract.data_assinatura).toLocaleDateString()
                            : ''
                        }
                      />
                      <InfoRow label="Modelo Remuneração" value={contract?.modelo_remuneracao} />
                      <InfoRow label="Valor Acordado" value={contract?.valor_acordado} />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Gestão de Documentos</CardTitle>
                <CardDescription>Documentos ativos do profissional</CardDescription>
              </div>
              <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-4 h-4" /> Enviar Novo
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeDocs.length === 0 ? (
                  <div className="col-span-full text-sm text-muted-foreground py-4 text-center">
                    Nenhum documento ativo.
                  </div>
                ) : (
                  activeDocs.map((d) => (
                    <div
                      key={d.id}
                      className="border rounded-lg p-4 flex flex-row items-center gap-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <FileText className="text-primary w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={d.nome_arquivo}>
                          {d.nome_arquivo || 'Documento'}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-muted rounded">
                            {d.categoria_documento || 'Outro'}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getDocStatusColor(d.status_validacao)}`}
                          >
                            {d.status_validacao || 'Pendente'}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a
                          href={api.documentos.getFileUrl?.(d) || '#'}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {historyDocs.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h4 className="text-sm font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Histórico de Documentos (Inativos)
                  </h4>
                  <div className="space-y-2">
                    {historyDocs.map((d) => (
                      <div
                        key={d.id}
                        className="flex justify-between items-center text-sm border-b pb-2 opacity-60"
                      >
                        <span className="truncate">{d.nome_arquivo}</span>
                        <span className="text-xs">
                          {new Date(d.updated).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="shadow-sm h-full max-h-[800px] flex flex-col">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Audit Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 overflow-auto">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-secondary text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
                      <div className="font-semibold text-sm leading-tight text-primary/90">
                        {act.acao}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Por {act.expand?.usuario_id?.name || 'Sistema'}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1.5 border-t pt-1.5">
                        {new Date(act.created).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    Sem histórico registrado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
