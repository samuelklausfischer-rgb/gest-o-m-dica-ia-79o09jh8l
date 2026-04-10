import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  Stethoscope,
  LayoutDashboard,
  Users,
  UserPlus,
  Settings,
  LogOut,
  BrainCircuit,
  FileWarning,
  BarChart3,
} from 'lucide-react'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { NotificationDropdown } from './NotificationDropdown'

export default function Layout() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const role =
    user?.name === 'Admin' ? 'Admin' : user?.name === 'Revisor' ? 'Revisor' : 'Operacional'

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    if (paths.length === 0) return <BreadcrumbPage>Dashboard</BreadcrumbPage>

    return (
      <>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {paths.map((path, idx) => {
          const isLast = idx === paths.length - 1
          const label = path.charAt(0).toUpperCase() + path.slice(1)
          return (
            <BreadcrumbItem key={path}>
              {isLast ? (
                <BreadcrumbPage>{label}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild>
                    <Link to={`/${paths.slice(0, idx + 1).join('/')}`}>{label}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              )}
            </BreadcrumbItem>
          )
        })}
      </>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-sidebar-border shadow-sm">
          <SidebarHeader className="p-4 flex flex-row items-center gap-3">
            <div className="bg-primary-foreground/10 p-2 rounded-lg text-primary-foreground">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg tracking-tight text-primary-foreground">
              Gestão Médica
            </span>
          </SidebarHeader>
          <SidebarContent className="px-2 py-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/'}>
                  <Link to="/">
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/medicos'}>
                  <Link to="/medicos">
                    <Users />
                    <span>Médicos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/medicos/novo'}>
                  <Link to="/medicos/novo">
                    <UserPlus />
                    <span>Novo Cadastro</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/medicos/ia-upload'}>
                  <Link to="/medicos/ia-upload">
                    <BrainCircuit />
                    <span>Cadastro IA</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/pendencias'}>
                  <Link to="/pendencias">
                    <FileWarning />
                    <span>Central de Pendências</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {role === 'Admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/relatorios'}>
                    <Link to="/relatorios">
                      <BarChart3 />
                      <span>Relatórios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {role === 'Admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/configuracoes'}>
                    <Link to="/configuracoes">
                      <Settings />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <SidebarMenuButton
              onClick={signOut}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair do sistema</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 flex-shrink-0 border-b bg-card flex items-center justify-between px-6 z-10 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-6 w-px bg-border hidden md:block" />
              <Breadcrumb className="hidden md:flex">
                <BreadcrumbList>{getBreadcrumbs()}</BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block w-64">
                <Input
                  placeholder="Buscar médico por nome, CRM..."
                  className="h-9 pl-4 pr-10 bg-muted/50 border-none rounded-full"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <NotificationDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="flex items-center gap-2 hover:bg-muted p-1 pr-3 rounded-full transition-colors cursor-pointer border border-transparent hover:border-border">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1" />
                      <AvatarFallback>US</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start text-sm">
                      <span className="font-semibold leading-none">{user?.name || 'Usuário'}</span>
                      <span className="text-xs text-muted-foreground leading-none mt-1">
                        {role}
                      </span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex-1 overflow-auto bg-muted/30 p-4 md:p-6 lg:p-8 animate-fade-in-up">
            <Outlet />
          </div>

          <footer className="py-3 px-6 text-center text-xs text-muted-foreground border-t bg-card shrink-0">
            &copy; {new Date().getFullYear()} Gestão Médica IA v0.0.2. Todos os direitos reservados.
          </footer>
        </main>
      </div>
    </SidebarProvider>
  )
}
