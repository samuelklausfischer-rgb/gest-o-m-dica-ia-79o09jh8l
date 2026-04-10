import { useEffect, useState } from 'react'
import {
  Bell,
  Check,
  Clock,
  AlertTriangle,
  FileText,
  FileSignature,
  BrainCircuit,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/services/api'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'

export function NotificationDropdown() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])

  const loadNotifications = async () => {
    if (!user) return
    try {
      const data = await api.notificacoes.list(user.id)
      setNotifications(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [user])
  useRealtime('notificacoes', () => loadNotifications())

  const unreadCount = notifications.filter((n) => !n.lida).length

  const markAsRead = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    await api.notificacoes.markAsRead(id)
  }

  const markAllAsRead = async () => {
    if (!user) return
    await api.notificacoes.markAllAsRead(user.id)
  }

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'Contrato':
        return <FileSignature className="w-4 h-4 text-blue-500" />
      case 'Documento':
        return <FileText className="w-4 h-4 text-indigo-500" />
      case 'IA':
        return <BrainCircuit className="w-4 h-4 text-purple-500" />
      case 'Duplicidade':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      default:
        return <Bell className="w-4 h-4 text-slate-500" />
    }
  }

  const getPriorityColor = (prioridade: string) => {
    if (prioridade === 'Crítica') return 'bg-red-500'
    if (prioridade === 'Alta') return 'bg-orange-500'
    if (prioridade === 'Média') return 'bg-amber-500'
    return 'bg-blue-500'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative cursor-pointer">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-0 text-xs text-primary"
            >
              <Check className="w-3 h-3 mr-1" /> Marcar todas lidas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                asChild
                className={`flex items-start gap-3 p-3 cursor-pointer ${n.lida ? 'opacity-60' : 'bg-muted/30'}`}
              >
                <Link to={n.link || '#'}>
                  <div className="mt-1">{getIcon(n.tipo)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate">{n.titulo}</p>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(n.prioridade)}`}
                        title={n.prioridade}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.mensagem}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(n.created).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {!n.lida && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => markAsRead(e, n.id)}
                      title="Marcar como lida"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
