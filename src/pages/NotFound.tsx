import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Stethoscope, Home } from 'lucide-react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('Erro 404: Usuário tentou acessar uma rota inexistente:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="text-center flex flex-col items-center max-w-md">
        <div className="bg-primary/10 p-6 rounded-full mb-6 text-primary">
          <Stethoscope className="w-16 h-16" />
        </div>
        <h1 className="text-6xl font-bold text-primary mb-4 tracking-tight">404</h1>
        <h2 className="text-2xl font-semibold mb-2 text-foreground">Página não encontrada</h2>
        <p className="text-muted-foreground mb-8 text-center">
          Desculpe, não conseguimos encontrar a página que você estava procurando. Ela pode ter sido
          movida ou não existir.
        </p>
        <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
          <Link to="/">
            <Home className="w-4 h-4" />
            Voltar para o Início
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default NotFound
