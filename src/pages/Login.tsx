import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Stethoscope, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const { error } = await signIn(email, password)
    setIsLoading(false)

    if (error) {
      let description = 'Ocorreu um erro ao tentar fazer login.'
      const err = error as any

      if (err?.status === 0) {
        description = 'Erro de rede. Verifique sua conexão com a internet.'
      } else if (err?.status === 400 || err?.status === 401) {
        description = 'E-mail ou senha incorretos.'
      } else if (err?.status === 403) {
        description = 'Sua conta requer verificação ou foi suspensa.'
      }

      toast({ title: 'Falha na autenticação', description, variant: 'destructive' })
    } else {
      navigate('/')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-500/20 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] p-8 glass-panel rounded-2xl animate-fade-in-up border-t border-t-white/10">
        <div className="text-center mb-8">
          <div className="mx-auto bg-gradient-to-br from-primary/20 to-primary/5 w-16 h-16 flex items-center justify-center rounded-2xl mb-6 shadow-inner border border-primary/20 ring-1 ring-white/5">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 text-gradient">
            Gestão Médica
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Portal Executivo de Cadastro e IA
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2 relative group">
            <Input
              placeholder="E-mail corporativo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-black/20 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-muted-foreground/50 transition-all group-hover:border-white/20"
            />
          </div>
          <div className="space-y-2 relative group">
            <Input
              placeholder="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 bg-black/20 border-white/10 focus-visible:ring-primary/50 text-white placeholder:text-muted-foreground/50 transition-all group-hover:border-white/20"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-md font-medium mt-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] border border-primary/50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Acessar Sistema'}
          </Button>
        </form>
      </div>
    </div>
  )
}
