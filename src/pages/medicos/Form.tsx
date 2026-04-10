import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/use-auth'
import { ArrowLeft, Save, CheckCircle, Clock } from 'lucide-react'

const formSchema = z.object({
  nome_completo: z.string().min(3, 'Nome muito curto'),
  cpf: z.string().min(11, 'CPF inválido'),
  email: z.string().email('E-mail inválido').or(z.literal('')),
  telefone: z.string().optional(),
  crm: z.string().min(4, 'CRM inválido'),
  uf_crm: z.string().min(2, 'UF obrigatório'),
  rqe: z.string().optional(),
  especialidade: z.string().min(3, 'Especialidade obrigatória'),
  cnes: z.string().optional(),
  categoria_medico: z.enum([
    'MEDICO PRN',
    'MEDICO PALHOÇA',
    'MEDICO APICE TELE',
    'MEDICO TELEIMAGEM',
  ]),
  tipo_contratacao: z.enum(['SCP', 'PJ']),
  contrato_assinado: z.boolean(),
  data_assinatura: z.string().optional(),
  modelo_remuneracao: z.enum(['Fixo', 'Plantão', 'Hora', 'Produção', 'Outro']).optional(),
  valor_acordado: z.string().optional(),
  pj_razao_social: z.string().optional(),
  pj_cnpj: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function DoctorForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const role = user?.name === 'Admin' ? 'Administrador' : 'Operacional'
  const [activeTab, setActiveTab] = useState('pessoais')

  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoria_medico: 'MEDICO PRN',
      tipo_contratacao: 'SCP',
      contrato_assinado: false,
      email: '',
    },
  })

  useEffect(() => {
    if (isEditing && id) {
      Promise.all([api.medicos.get(id), api.dadosPj.getByMedico(id), api.contratos.getByMedico(id)])
        .then(([doc, pj, cont]) => {
          methods.reset({
            ...doc,
            data_assinatura: cont?.data_assinatura ? cont.data_assinatura.split('T')[0] : '',
            modelo_remuneracao: cont?.modelo_remuneracao || '',
            valor_acordado: cont?.valor_acordado || '',
            pj_cnpj: pj?.cnpj || '',
            pj_razao_social: pj?.razao_social || '',
          } as any)
        })
        .catch(() => {
          toast({ title: 'Erro', description: 'Médico não encontrado', variant: 'destructive' })
          navigate('/medicos')
        })
    }
  }, [id, isEditing, methods, navigate, toast])

  const watchCategoria = methods.watch('categoria_medico')
  const watchTipoContratacao = methods.watch('tipo_contratacao')
  const showContract = watchCategoria === 'MEDICO PRN' || watchCategoria === 'MEDICO PALHOÇA'
  const showPj = watchTipoContratacao === 'PJ'

  const onSave = async (data: FormValues, status: string) => {
    try {
      const docData = {
        nome_completo: data.nome_completo,
        cpf: data.cpf,
        crm: data.crm,
        uf_crm: data.uf_crm,
        rqe: data.rqe,
        especialidade: data.especialidade,
        email: data.email,
        telefone: data.telefone,
        cnes: data.cnes,
        categoria_medico: data.categoria_medico,
        tipo_contratacao: data.tipo_contratacao,
        contrato_assinado: data.contrato_assinado,
        status_cadastro: status,
        ativo: status !== 'Inativo',
        origem_cadastro: 'manual',
      }

      let medId = id
      if (isEditing && id) {
        await api.medicos.update(id, docData)
        await api.auditoria.log(id, `Atualizou cadastro para ${status}`)
      } else {
        const res = await api.medicos.create(docData)
        medId = res.id
        await api.auditoria.log(res.id, 'Criação de cadastro manual')
      }

      if (medId) {
        if (data.tipo_contratacao === 'PJ') {
          const pjData = {
            medico_id: medId,
            cnpj: data.pj_cnpj,
            razao_social: data.pj_razao_social,
          }
          const pj = await api.dadosPj.getByMedico(medId)
          if (pj) await api.dadosPj.update(pj.id, pjData)
          else await api.dadosPj.create(pjData)
        }

        if (showContract) {
          const contData = {
            medico_id: medId,
            data_assinatura: data.data_assinatura
              ? new Date(data.data_assinatura).toISOString()
              : null,
            modelo_remuneracao: data.modelo_remuneracao,
            valor_acordado: data.valor_acordado,
          }
          const cont = await api.contratos.getByMedico(medId)
          if (cont) await api.contratos.update(cont.id, contData)
          else await api.contratos.create(contData)
        }
      }

      toast({ title: 'Sucesso', description: 'Dados salvos com sucesso.' })
      navigate('/medicos')
    } catch (error: any) {
      const err = error.response?.data
      if (err?.cpf)
        toast({ title: 'Atenção', description: 'CPF já cadastrado.', variant: 'destructive' })
      else if (err?.crm)
        toast({ title: 'Atenção', description: 'CRM já cadastrado.', variant: 'destructive' })
      else
        toast({
          title: 'Erro',
          description: 'Verifique os dados informados.',
          variant: 'destructive',
        })
    }
  }

  const handleDraft = () => onSave(methods.getValues(), 'Rascunho')
  const handleReview = () => methods.handleSubmit((data) => onSave(data, 'Pendente de Revisão'))()
  const handleApprove = () => methods.handleSubmit((data) => onSave(data, 'Ativo'))()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/medicos')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            {isEditing ? 'Editar Médico' : 'Novo Cadastro Manual'}
          </h1>
          <p className="text-muted-foreground mt-1">Preencha os dados do profissional.</p>
        </div>
      </div>

      <Card className="shadow-sm border-t-4 border-t-secondary">
        <CardContent className="p-6">
          <FormProvider {...methods}>
            <form className="space-y-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-muted">
                  <TabsTrigger value="pessoais" className="py-2.5 text-xs sm:text-sm">
                    Pessoais
                  </TabsTrigger>
                  <TabsTrigger value="profissionais" className="py-2.5 text-xs sm:text-sm">
                    Profissionais
                  </TabsTrigger>
                  <TabsTrigger value="categoria" className="py-2.5 text-xs sm:text-sm">
                    Categoria
                  </TabsTrigger>
                  <TabsTrigger
                    value="contrato"
                    disabled={!showContract}
                    className="py-2.5 text-xs sm:text-sm"
                  >
                    Contrato
                  </TabsTrigger>
                  <TabsTrigger
                    value="empresa"
                    disabled={!showPj}
                    className="py-2.5 text-xs sm:text-sm"
                  >
                    Empresa PJ
                  </TabsTrigger>
                </TabsList>

                <div className="mt-8">
                  <TabsContent value="pessoais" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={methods.control}
                        name="nome_completo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="João da Silva" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={methods.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF *</FormLabel>
                            <FormControl>
                              <Input placeholder="000.000.000-00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={methods.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="joao@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={methods.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="profissionais" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={methods.control}
                        name="crm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CRM *</FormLabel>
                            <FormControl>
                              <Input placeholder="12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={methods.control}
                        name="uf_crm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UF do CRM *</FormLabel>
                            <FormControl>
                              <Input placeholder="SP" maxLength={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={methods.control}
                        name="rqe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>RQE</FormLabel>
                            <FormControl>
                              <Input placeholder="Opcional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={methods.control}
                        name="especialidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Especialidade Principal *</FormLabel>
                            <FormControl>
                              <Input placeholder="Cardiologia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={methods.control}
                        name="cnes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNES</FormLabel>
                            <FormControl>
                              <Input placeholder="Opcional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="categoria" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={methods.control}
                        name="categoria_medico"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MEDICO PRN">MEDICO PRN</SelectItem>
                                <SelectItem value="MEDICO PALHOÇA">MEDICO PALHOÇA</SelectItem>
                                <SelectItem value="MEDICO APICE TELE">MEDICO APICE TELE</SelectItem>
                                <SelectItem value="MEDICO TELEIMAGEM">MEDICO TELEIMAGEM</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={methods.control}
                        name="tipo_contratacao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Contratação *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="SCP">SCP</SelectItem>
                                <SelectItem value="PJ">PJ</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  {showContract && (
                    <TabsContent value="contrato" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={methods.control}
                          name="contrato_assinado"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20 col-span-1 md:col-span-2">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Contrato Assinado?</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Indica se o médico já assinou fisicamente ou digitalmente.
                                </div>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={methods.control}
                          name="data_assinatura"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Assinatura</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={methods.control}
                          name="modelo_remuneracao"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Modelo de Remuneração</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Fixo">Fixo</SelectItem>
                                  <SelectItem value="Plantão">Plantão</SelectItem>
                                  <SelectItem value="Hora">Hora</SelectItem>
                                  <SelectItem value="Produção">Produção</SelectItem>
                                  <SelectItem value="Outro">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={methods.control}
                          name="valor_acordado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor Acordado (R$)</FormLabel>
                              <FormControl>
                                <Input placeholder="0,00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  )}

                  {showPj && (
                    <TabsContent value="empresa" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={methods.control}
                          name="pj_cnpj"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CNPJ *</FormLabel>
                              <FormControl>
                                <Input placeholder="00.000.000/0000-00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={methods.control}
                          name="pj_razao_social"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Razão Social *</FormLabel>
                              <FormControl>
                                <Input placeholder="Empresa Médica LTDA" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </form>
          </FormProvider>
        </CardContent>
        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t bg-muted/10">
          <Button type="button" variant="outline" onClick={() => navigate('/medicos')}>
            Cancelar
          </Button>
          <Button type="button" variant="secondary" onClick={handleDraft} className="gap-2">
            <Save className="w-4 h-4" /> Salvar Rascunho
          </Button>
          <Button
            type="button"
            className="bg-sky-600 hover:bg-sky-700 text-white gap-2"
            onClick={handleReview}
          >
            <Clock className="w-4 h-4" /> Enviar para Revisão
          </Button>
          {role === 'Administrador' && (
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={handleApprove}
            >
              <CheckCircle className="w-4 h-4" /> Aprovar
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
