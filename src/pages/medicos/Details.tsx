import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  Loader2,
  Activity,
} from 'lucide-react'
import { api } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { maskCpf, maskCnpj, maskPhone, partiallyMaskCpf } from '@/utils/masks'
import { useToast } from '@/hooks/use-toast'

export default function DoctorDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const role =
    user?.name === 'Admin' ? 'Admin' : user?.name === 'Revisor' ? 'Revisor' : 'Operacional'
  const { toast } = useToast()

  const [doctor, setDoctor] = useState<any>(null)
  const [pj, setPj] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: 'approve' | 'reject' | 'inactivate' | null
  }>({ isOpen: false, action: null })
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    if (!id) return
    try {
      const [d, p, c, doxs, acts, cfg] = await Promise.all([
        api.medicos.get(id),
        api.dadosPj.getByMedico(id),
        api.contratos.getByMedico(id),
        api.documentos.listByMedico(id),
        api.auditoria.listByMedico(id),
        api.configuracoes.get(),
      ])
      setDoctor(d)
      setPj(p)
      setContract(c)
      setDocs(doxs)
      setActivities(acts)
      setConfig(cfg)
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

  if (!doctor)
    return (
      <div className="p-8 text-center flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )

  const activeDocs = docs.filter((d) => d.ativo !== false)
  const historyDocs = docs.filter((d) => d.ativo === false)

  const validateWorkflow = () => {
    if (!config?.documentos_obrigatorios) return true
    const required = config.documentos_obrigatorios[doctor.categoria_medico] || []
    const validDocs = activeDocs
      .filter((d) => d.status_validacao === 'Validado')
      .map((d) => d.categoria_documento)
    const missing = required.filter((r: string) => !validDocs.includes(r))

    if (doctor.categoria_medico === 'MEDICO PRN' || doctor.categoria_medico === 'MEDICO PALHOÇA') {
      if (!doctor.contrato_assinado) {
        toast({
          title: 'Aprovação Bloqueada',
          description: 'Não é possível aprovar PRN/Palhoça sem contrato assinado.',
          variant: 'destructive',
        })
        return false
      }
    }

    if (missing.length > 0) {
      toast({
        title: 'Documentação Pendente',
        description: `Faltam documentos validados: ${missing.join(', ')}`,
        variant: 'destructive',
      })
      return false
    }
    return true
  }

  const handleConfirmAction = async () => {
    if (!confirmDialog.action || isProcessing) return
    if (confirmDialog.action === 'approve' && !validateWorkflow()) {
      setConfirmDialog({ isOpen: false, action: null })
      return
    }

    setIsProcessing(true)
    try {
      if (confirmDialog.action === 'inactivate') {
        await api.medicos.update(doctor.id, { status_cadastro: 'Inativo', ativo: false })
        await api.auditoria.log(doctor.id, 'Inativação de Cadastro')
        toast({ title: 'Cadastro Inativado' })
      } else if (confirmDialog.action === 'reject') {
        await api.medicos.update(doctor.id, { status_cadastro: 'Rejeitado' })
        await api.auditoria.log(doctor.id, 'Rejeição de Cadastro')
        toast({ title: 'Cadastro Rejeitado' })
      } else if (confirmDialog.action === 'approve') {
        await api.medicos.update(doctor.id, { status_cadastro: 'Aprovado' })
        await api.auditoria.log(doctor.id, 'Aprovação de Cadastro')
        toast({ title: 'Cadastro Aprovado' })
      }
    } catch {
      toast({ title: 'Erro ao processar ação', variant: 'destructive' })
    } finally {
      setIsProcessing(false)
      setConfirmDialog({ isOpen: false, action: null })
    }
  }

  const uploadDocument = async (file: File) => {
    try {
      const form = new FormData()
      form.append('arquivos_enviados', file)
      form.append('medico_id', doctor.id)
      form.append('nome_arquivo', file.name)
      form.append('categoria_documento', 'Outro')
      form.append('status_validacao', 'Pendente')
      form.append('ativo', 'true')
      form.append('url_arquivo', file)

      await api.documentos.create(form)
      await api.auditoria.log(doctor.id, `Novo documento anexado: ${file.name}`)
      toast({ title: 'Documento Anexado' })
      setUploadFile(null)
    } catch {
      toast({
        title: 'Falha na conexão',
        description: 'Não foi possível enviar o documento.',
        variant: 'destructive',
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    setUploadFile(file)
    uploadDocument(file)
  }

  const getStatusBadge = (status: string) => {
    let style = ''
    switch (status) {
      case 'Ativo':
        style = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        break
      case 'Aprovado':
        style = 'bg-teal-500/20 text-teal-400 border-teal-500/30'
        break
      case 'Inativo':
      case 'Rejeitado':
        style = 'bg-red-500/20 text-red-400 border-red-500/30'
        break
      case 'Rascunho':
        style = 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        break
      case 'Pendente de Revisão':
      case 'Pendente Documental':
      case 'Pendente Contratual':
        style = 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        break
      default:
        style = 'bg-primary/20 text-primary border-primary/30'
    }
    return <span className={`premium-badge ${style}`}>{status}</span>
  }

  const getDocStatusColor = (status: string) => {
    switch (status) {
      case 'Validado':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'Pendente':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'Inválido':
        return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'Vencido':
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
      default:
        return 'text-white/70 bg-white/5 border-white/10'
    }
  }

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex flex-col space-y-1 bg-white/5 p-3 rounded-lg border border-white/5">
      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
        {label}
      </span>
      <span className="text-sm font-semibold text-white">{value || '-'}</span>
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, action: null })}
      >
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmDialog.action === 'approve' ? 'Aprovar Cadastro' : 'Confirmar Ação'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Tem certeza que deseja{' '}
              {confirmDialog.action === 'reject'
                ? 'rejeitar'
                : confirmDialog.action === 'approve'
                  ? 'aprovar'
                  : 'inativar'}{' '}
              este cadastro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isProcessing}
              className="bg-transparent border-white/10 text-white hover:bg-white/5"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={isProcessing}
              className={
                confirmDialog.action === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-destructive hover:bg-destructive/90 text-white'
              }
            >
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/medicos')}
            className="hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-2xl font-bold text-primary border border-primary/30 shadow-glow">
              {doctor.nome_completo.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                {doctor.nome_completo}
                {getStatusBadge(doctor.status_cadastro)}
              </h1>
              <p className="text-muted-foreground text-sm mt-1 font-medium">
                CRM: {doctor.crm}/{doctor.uf_crm} • {doctor.especialidade}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(role === 'Admin' || role === 'Revisor') &&
            ['Pendente de Revisão', 'Pendente Documental'].includes(doctor.status_cadastro) && (
              <>
                <Button
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] border-none"
                  onClick={() => setConfirmDialog({ isOpen: true, action: 'approve' })}
                >
                  <CheckCircle className="w-4 h-4" /> Aprovar
                </Button>
                <Button
                  variant="outline"
                  className="text-red-400 border-red-500/30 hover:bg-red-500/10 gap-2 bg-black/20"
                  onClick={() => setConfirmDialog({ isOpen: true, action: 'reject' })}
                >
                  <XCircle className="w-4 h-4" /> Rejeitar
                </Button>
              </>
            )}
          {role === 'Admin' && doctor.status_cadastro !== 'Inativo' && (
            <Button
              variant="outline"
              className="text-white/60 border-white/10 hover:bg-white/5 gap-2 bg-transparent"
              onClick={() => setConfirmDialog({ isOpen: true, action: 'inactivate' })}
            >
              <Ban className="w-4 h-4" /> Inativar
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white"
          >
            <Link to={`/medicos/editar/${doctor.id}`}>
              <Edit className="w-4 h-4" /> Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">Dados Cadastrais</CardTitle>
              <div className="flex items-center gap-3 w-48 bg-black/40 p-2 rounded-lg border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-16">
                  Saúde: <span className="text-white">{Math.min(completeness, 100)}%</span>
                </span>
                <Progress
                  value={completeness}
                  className="h-1.5 bg-white/10"
                  indicatorClassName="bg-primary"
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <InfoRow
                  label="CPF"
                  value={
                    role === 'Operacional'
                      ? partiallyMaskCpf(doctor.cpf || '')
                      : maskCpf(doctor.cpf || '')
                  }
                />
                <InfoRow
                  label="E-mail"
                  value={
                    role === 'Operacional'
                      ? doctor.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3')
                      : doctor.email
                  }
                />
                <InfoRow
                  label="Telefone"
                  value={
                    doctor.telefone
                      ? role === 'Operacional'
                        ? maskPhone(doctor.telefone).replace(/(\d{4})$/, '****')
                        : maskPhone(doctor.telefone)
                      : ''
                  }
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
            <Card className="glass-card">
              <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
                <CardTitle className="text-lg text-white">Contrato e Pessoa Jurídica</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {doctor.tipo_contratacao === 'PJ' && (
                    <>
                      <InfoRow
                        label="CNPJ"
                        value={
                          pj?.cnpj
                            ? role === 'Operacional'
                              ? '**.***.***/****-**'
                              : maskCnpj(pj.cnpj)
                            : ''
                        }
                      />
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

          <Card className="glass-card">
            <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02] flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg text-white">Documentos Digitais</CardTitle>
                <CardDescription>Repositório seguro de arquivos</CardDescription>
              </div>
              <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} />
              <Button
                size="sm"
                variant="outline"
                className="gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-4 h-4" /> Anexar Novo
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeDocs.length === 0 ? (
                  <div className="col-span-full text-sm text-muted-foreground py-6 text-center bg-black/20 rounded-lg border border-dashed border-white/10">
                    Nenhum documento anexado.
                  </div>
                ) : (
                  activeDocs.map((d) => (
                    <div
                      key={d.id}
                      className="border border-white/10 bg-black/20 rounded-xl p-4 flex flex-row items-center gap-4 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 border border-primary/20">
                        <FileText className="text-primary w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold text-white truncate"
                          title={d.nome_arquivo}
                        >
                          {d.nome_arquivo || 'Documento'}
                        </p>
                        <div className="flex gap-2 mt-1.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/10 text-white/80 rounded uppercase tracking-wider">
                            {d.categoria_documento || 'Outro'}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getDocStatusColor(d.status_validacao)}`}
                          >
                            {d.status_validacao || 'Pendente'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-white/10 text-white"
                        asChild
                      >
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
                <div className="mt-8 pt-6 border-t border-white/5">
                  <h4 className="text-xs font-bold mb-4 text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                    <Clock className="w-4 h-4" /> Histórico Inativo
                  </h4>
                  <div className="space-y-2">
                    {historyDocs.map((d) => (
                      <div
                        key={d.id}
                        className="flex justify-between items-center text-sm p-2 rounded hover:bg-white/5 opacity-60 transition-colors"
                      >
                        <span className="truncate text-white">{d.nome_arquivo}</span>
                        <span className="text-xs text-muted-foreground">
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
          <Card className="glass-card h-full max-h-[800px] flex flex-col">
            <CardHeader className="pb-4 border-b border-white/5 bg-white/[0.02]">
              <CardTitle className="text-lg flex items-center gap-2 text-white">
                <Activity className="w-5 h-5 text-primary" /> Log de Auditoria
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 overflow-auto">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-[2px] before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-glow z-10 ring-4 ring-background">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3.5 rounded-xl border border-white/5 bg-white/[0.03] shadow-sm hover:border-white/10 transition-colors">
                      <div className="font-semibold text-sm leading-tight text-white mb-1">
                        {act.acao}
                      </div>
                      {(act.valor_anterior || act.valor_novo) && (
                        <div className="text-xs mt-2 bg-black/40 p-2 rounded-lg border border-white/5">
                          {act.valor_anterior && (
                            <div
                              className="text-red-400 line-through truncate mb-0.5"
                              title={act.valor_anterior}
                            >
                              {act.valor_anterior}
                            </div>
                          )}
                          {act.valor_novo && (
                            <div
                              className="text-emerald-400 truncate font-medium"
                              title={act.valor_novo}
                            >
                              {act.valor_novo}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          Por {act.expand?.usuario_id?.name || 'Sistema'}
                        </div>
                        <div className="text-[10px] text-white/50">
                          {new Date(act.created).toLocaleString('pt-BR')}
                        </div>
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
