import { useParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Edit, FileText, Download, CheckCircle, Ban } from 'lucide-react'
import useMainStore from '@/stores/useMainStore'

export default function DoctorDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { doctors, activities, role, updateDoctor } = useMainStore()

  const doctor = doctors.find((d) => d.id === id)
  const doctorActivities = activities.filter((a) => a.medicoId === id)

  if (!doctor) {
    return <div className="p-8 text-center">Médico não encontrado.</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-emerald-500 hover:bg-emerald-600'
      case 'Inativo':
        return 'bg-slate-500 hover:bg-slate-600'
      case 'Rascunho':
        return 'bg-amber-500 hover:bg-amber-600'
      case 'Pendente de Revisão':
        return 'bg-sky-500 hover:bg-sky-600'
      default:
        return 'bg-primary'
    }
  }

  const InfoRow = ({ label, value }: { label: string; value?: string }) => (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-muted-foreground font-medium uppercase">{label}</span>
      <span className="text-sm font-medium">{value || '-'}</span>
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/medicos')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {doctor.nome.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                {doctor.nome}
                <Badge className={getStatusColor(doctor.status)}>{doctor.status}</Badge>
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                CRM: {doctor.crm}/{doctor.ufCrm}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {role === 'Administrador' && doctor.status === 'Pendente de Revisão' && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={() => updateDoctor(doctor.id, { status: 'Ativo' })}
            >
              <CheckCircle className="w-4 h-4" /> Aprovar Cadastro
            </Button>
          )}
          {role === 'Administrador' && doctor.status !== 'Inativo' && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive gap-2"
              onClick={() => updateDoctor(doctor.id, { status: 'Inativo' })}
            >
              <Ban className="w-4 h-4" /> Inativar
            </Button>
          )}
          <Button asChild variant="outline" className="gap-2">
            <Link to={`/medicos/editar/${doctor.id}`}>
              <Edit className="w-4 h-4" /> Editar Dados
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-lg">Dados Pessoais e Profissionais</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <InfoRow label="CPF" value={doctor.cpf} />
                <InfoRow label="Data de Nascimento" value={doctor.dataNascimento} />
                <InfoRow label="E-mail" value={doctor.email} />
                <InfoRow label="Telefone" value={doctor.telefone} />
                <InfoRow label="Especialidade" value={doctor.especialidade} />
                <InfoRow label="RQE" value={doctor.rqe} />
                <InfoRow label="Categoria" value={doctor.categoria} />
                <InfoRow label="Contratação" value={doctor.tipoContratacao} />
              </div>
            </CardContent>
          </Card>

          {(doctor.tipoContratacao === 'PJ' ||
            doctor.categoria === 'MEDICO PRN' ||
            doctor.categoria === 'MEDICO PALHOÇA') && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-lg">Dados Contratuais / Empresa</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  {doctor.tipoContratacao === 'PJ' && (
                    <>
                      <InfoRow label="CNPJ" value={doctor.pjCnpj} />
                      <InfoRow label="Razão Social" value={doctor.pjRazaoSocial} />
                    </>
                  )}
                  {(doctor.categoria === 'MEDICO PRN' || doctor.categoria === 'MEDICO PALHOÇA') && (
                    <>
                      <InfoRow
                        label="Contrato Assinado"
                        value={doctor.contratoAssinado ? 'Sim' : 'Não'}
                      />
                      <InfoRow label="Data Assinatura" value={doctor.dataAssinatura} />
                      <InfoRow label="Modelo Remuneração" value={doctor.modeloRemuneracao} />
                      <InfoRow label="Valor Acordado" value={doctor.valorAcordado} />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-lg">Galeria de Documentos</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="text-primary w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">CRM_Documento.pdf</p>
                    <p className="text-xs text-muted-foreground mt-1">Enviado via IA</p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full mt-2 gap-2 text-xs">
                    <Download className="w-3 h-3" /> Baixar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card className="shadow-sm h-full max-h-[800px] flex flex-col">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-lg">Histórico (Audit Trail)</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 overflow-auto">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {doctorActivities.map((act, i) => (
                  <div
                    key={act.id}
                    className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-secondary text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border bg-card shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-sm">{act.acao}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">Por {act.usuario}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(act.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
                {doctorActivities.length === 0 && (
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
