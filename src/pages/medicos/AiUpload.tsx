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
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import useMainStore from '@/stores/useMainStore'

export default function AiUpload() {
  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload')
  const [formData, setFormData] = useState({ nome: '', cpf: '', crm: '', ufCrm: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const navigate = useNavigate()
  const { addDoctor } = useMainStore()

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    startProcessing()
  }

  const startProcessing = () => {
    setStep('processing')
    setTimeout(() => {
      setFormData({
        nome: 'Marcos Vinicius da Costa',
        cpf: '444.555.666-77',
        crm: '88990',
        ufCrm: 'SP',
      })
      setStep('review')
    }, 2500)
  }

  const handleSave = () => {
    addDoctor({
      ...formData,
      dataNascimento: '1980-01-01',
      email: 'ia.generated@exemplo.com',
      telefone: '(00) 00000-0000',
      especialidade: 'Clínica Médica',
      categoria: 'MEDICO PRN',
      tipoContratacao: 'SCP',
      contratoAssinado: false,
      status: 'Pendente de Revisão',
    } as any)
    toast({ title: 'Sucesso', description: 'Dados processados e salvos para revisão.' })
    navigate('/medicos')
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Cadastro Assistido por IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Faça upload de documentos para extração automática de dados.
        </p>
      </div>

      {step === 'upload' && (
        <Card className="flex-1 flex items-center justify-center border-dashed border-2 border-primary/20 bg-muted/10 shadow-none min-h-[400px]">
          <CardContent className="text-center p-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
              <UploadCloud className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Arraste os documentos aqui</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Suporta PDF, JPEG, PNG. Os dados serão lidos automaticamente pela nossa IA.
            </p>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={startProcessing}
              accept=".pdf,image/*"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="lg"
              className="px-8 shadow-sm"
            >
              Selecionar Arquivos
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'processing' && (
        <Card className="flex-1 flex items-center justify-center min-h-[400px]">
          <CardContent className="text-center flex flex-col items-center p-10">
            <Loader2 className="w-16 h-16 text-secondary animate-spin mb-6" />
            <h3 className="text-xl font-semibold mb-2">Analisando Documentos...</h3>
            <p className="text-muted-foreground">
              Extraindo informações estruturadas com IA Generativa.
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'review' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[500px]">
          {/* Document Preview */}
          <Card className="flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-900 border shadow-inner">
            <div className="p-3 bg-card border-b flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4 text-muted-foreground" /> documento_crm.pdf
            </div>
            <div className="flex-1 p-6 flex justify-center items-center overflow-auto">
              <img
                src="https://img.usecurling.com/p/400/600?q=document&color=gray"
                alt="Document Preview"
                className="max-w-full shadow-lg rounded-sm border border-slate-200"
              />
            </div>
          </Card>

          {/* Form Fields */}
          <Card className="flex flex-col shadow-sm">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-secondary" />
                Dados Extraídos
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Revise os dados antes de confirmar.
              </p>
            </div>
            <CardContent className="p-6 space-y-6 flex-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Alta Confiança
                    </div>
                  </div>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cpf">CPF</Label>
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> Baixa Confiança (Revisar)
                    </div>
                  </div>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input
                      id="crm"
                      value={formData.crm}
                      onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ufCrm">UF CRM</Label>
                    <Input
                      id="ufCrm"
                      value={formData.ufCrm}
                      onChange={(e) => setFormData({ ...formData, ufCrm: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <p className="text-sm text-primary font-medium flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4" /> Informações Ausentes
                </p>
                <p className="text-xs text-muted-foreground">
                  E-mail e Telefone não foram identificados no documento.
                </p>
              </div>
            </CardContent>
            <div className="p-4 border-t flex justify-end gap-3 bg-muted/10">
              <Button variant="outline" onClick={() => setStep('upload')}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90 gap-2">
                Confirmar Dados <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
