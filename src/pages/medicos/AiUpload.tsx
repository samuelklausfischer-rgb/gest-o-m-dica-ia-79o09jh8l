import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  BrainCircuit,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/services/api'

export default function AiUpload() {
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload')
  const [formData, setFormData] = useState({ nome_completo: '', cpf: '', crm: '', uf_crm: '' })
  const [importId, setImportId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    setStep('processing')
    try {
      const form = new FormData()
      for (let i = 0; i < e.target.files.length; i++) {
        form.append('arquivos_enviados', e.target.files[i])
      }
      const mockExtraction = {
        nome_completo: 'Marcos Vinicius da Costa',
        cpf: '444.555.666-77',
        crm: '88990',
        uf_crm: 'SP',
      }
      form.append('status_revisao', 'Pendente de Revisão')
      form.append('json_extraido', JSON.stringify(mockExtraction))

      const record = await api.ia.create(form)
      setImportId(record.id)

      setTimeout(() => {
        setFormData(mockExtraction)
        setStep('review')
      }, 2000)
    } catch (error) {
      toast({ title: 'Erro', variant: 'destructive', description: 'Falha ao enviar documento.' })
      setStep('upload')
    }
  }

  const handleSave = async () => {
    if (!formData.nome_completo || !formData.cpf || !formData.crm) {
      toast({
        title: 'Atenção',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    try {
      const docData = {
        nome_completo: formData.nome_completo.trim(),
        cpf: formData.cpf.replace(/\D/g, ''),
        crm: formData.crm,
        uf_crm: formData.uf_crm.toUpperCase(),
        especialidade: 'Clínica Médica',
        categoria_medico: 'MEDICO PRN',
        tipo_contratacao: 'SCP',
        contrato_assinado: false,
        origem_cadastro: 'ia',
        status_cadastro: 'Pendente de Revisão',
        ativo: true,
      }

      const medicoRes = await api.medicos.create(docData)
      if (importId) await api.ia.update(importId, { status_revisao: 'Aprovado' })
      await api.auditoria.log(medicoRes.id, 'Criação de cadastro via Extração IA')

      toast({ title: 'Sucesso', description: 'Dados processados e salvos para revisão final.' })
      navigate('/medicos')
    } catch (e: any) {
      const err = e.response?.data
      if (err?.cpf)
        toast({
          title: 'Atenção',
          description: 'CPF já cadastrado no sistema.',
          variant: 'destructive',
        })
      else
        toast({
          title: 'Erro de Comunicação',
          description: 'Falha ao confirmar dados. Tente novamente.',
          variant: 'destructive',
        })
    }
  }

  const InputStyle =
    'bg-black/20 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-muted-foreground/50 transition-all hover:border-white/20'

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-lg text-accent">
            <BrainCircuit className="w-6 h-6" />
          </div>
          Cadastro Assistido por IA
        </h1>
        <p className="text-muted-foreground mt-2 text-sm font-medium">
          Faça upload de documentos para extração automática de dados. Nossa IA processará as
          informações em segundos.
        </p>
      </div>

      {step === 'upload' && (
        <Card className="flex-1 flex items-center justify-center border-dashed border-2 border-white/10 bg-white/[0.02] shadow-none min-h-[450px] transition-all hover:border-primary/50 hover:bg-white/[0.04]">
          <CardContent className="text-center p-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-glow">
              <UploadCloud className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Arraste os documentos aqui</h3>
            <p className="text-muted-foreground mb-8 max-w-sm text-sm">
              Suporta PDF, JPEG, PNG. Os dados serão lidos e estruturados automaticamente pela IA
              Generativa.
            </p>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileDrop}
              accept=".pdf,image/*"
              multiple
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="lg"
              className="px-8 shadow-glow bg-primary hover:bg-primary/90 text-white rounded-full"
            >
              Selecionar Arquivos
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'processing' && (
        <Card className="flex-1 flex items-center justify-center min-h-[450px] glass-card border-none">
          <CardContent className="text-center flex flex-col items-center p-10 relative">
            <div className="absolute inset-0 bg-primary/5 animate-pulse rounded-full filter blur-[100px]"></div>
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-6 relative z-10" />
            <h3 className="text-2xl font-bold mb-2 text-white relative z-10 text-gradient">
              Analisando Documentos...
            </h3>
            <p className="text-muted-foreground relative z-10 font-medium">
              Extraindo informações estruturadas e cruzando dados.
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px] animate-fade-in-up">
          <Card className="flex flex-col overflow-hidden bg-black/40 border-white/10 shadow-inner rounded-xl">
            <div className="p-3 bg-white/5 border-b border-white/5 flex items-center gap-2 text-sm font-medium text-white/80">
              <FileText className="w-4 h-4 text-primary" /> documento_extraido.pdf
            </div>
            <div className="flex-1 p-6 flex justify-center items-center overflow-auto relative">
              <div className="absolute inset-0 bg-[url('https://img.usecurling.com/p/800/800?q=noise')] opacity-5 mix-blend-overlay"></div>
              <img
                src="https://img.usecurling.com/p/400/600?q=document&color=gray"
                alt="Document Preview"
                className="max-w-full shadow-2xl rounded border border-white/10 relative z-10 filter grayscale contrast-125 brightness-90"
              />
            </div>
          </Card>

          <Card className="flex flex-col glass-card">
            <div className="p-5 border-b border-white/5 bg-white/[0.02]">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                <BrainCircuit className="w-5 h-5 text-accent" /> Validação de Dados
              </h3>
              <p className="text-xs text-muted-foreground mt-1 font-medium">
                Revise as informações extraídas antes de salvar o cadastro.
              </p>
            </div>
            <CardContent className="p-6 space-y-6 flex-1">
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="nome" className="text-white/90">
                      Nome Completo
                    </Label>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3" /> Alta Confiança
                    </div>
                  </div>
                  <Input
                    id="nome"
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    className={InputStyle}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cpf" className="text-white/90">
                      CPF
                    </Label>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3" /> Confiança Média (60%)
                    </div>
                  </div>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    className={`border-amber-500/30 bg-amber-500/5 focus-visible:ring-amber-500/50 text-white transition-all hover:border-amber-500/50`}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="crm" className="text-white/90">
                      CRM
                    </Label>
                    <Input
                      id="crm"
                      value={formData.crm}
                      onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                      className={InputStyle}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ufCrm" className="text-white/90">
                      UF CRM
                    </Label>
                    <Input
                      id="ufCrm"
                      value={formData.uf_crm}
                      onChange={(e) => setFormData({ ...formData, uf_crm: e.target.value })}
                      className={InputStyle}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-primary font-bold mb-1">Informações Ausentes</p>
                  <p className="text-xs text-primary/70 font-medium">
                    E-mail, Telefone e Especialidade não foram identificados com precisão no
                    documento.
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="p-5 border-t border-white/5 flex justify-end gap-3 bg-black/20 backdrop-blur-md">
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
                className="bg-transparent border-white/10 hover:bg-white/5 text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-accent to-purple-600 hover:from-accent/90 hover:to-purple-600/90 gap-2 text-white shadow-glow border-none"
              >
                Aprovar Extração <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
