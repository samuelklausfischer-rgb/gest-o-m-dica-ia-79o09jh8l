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
    if (paths.length === 0) return <BreadcrumbPage className="text-white">Dashboard</BreadcrumbPage>

    return (
      <>
        <BreadcrumbItem>
          <BreadcrumbLink asChild className="hover:text-primary">
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
                <BreadcrumbPage className="text-white">{label}</BreadcrumbPage>
              ) : (
                <>
                  <BreadcrumbLink asChild className="hover:text-primary">
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
      <div className="flex min-h-screen w-full bg-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[800px] h-[500px] bg-primary/10 rounded-full mix-blend-screen filter blur-[120px] opacity-30 pointer-events-none z-0"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none z-0"></div>

        <Sidebar className="border-r border-white/5 bg-sidebar/80 backdrop-blur-xl z-20 shadow-xl">
          <SidebarHeader className="p-5 flex flex-row items-center gap-3">
            <div className="bg-gradient-to-br from-primary/30 to-primary/10 p-2 rounded-xl text-primary border border-primary/20 shadow-inner">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Gestão Médica</span>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4">
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/'}
                  className="rounded-lg hover:bg-white/5 data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors"
                >
                  <Link to="/">
                    <LayoutDashboard />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/medicos'}
                  className="rounded-lg hover:bg-white/5 data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors"
                >
                  <Link to="/medicos">
                    <Users />
                    <span className="font-medium">Médicos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/medicos/novo'}
                  className="rounded-lg hover:bg-white/5 data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors"
                >
                  <Link to="/medicos/novo">
                    <UserPlus />
                    <span className="font-medium">Novo Cadastro</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/medicos/ia-upload'}
                  className="rounded-lg hover:bg-white/5 data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors"
                >
                  <Link to="/medicos/ia-upload">
                    <BrainCircuit />
                    <span className="font-medium">Cadastro IA</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === '/pendencias'}
                  className="rounded-lg hover:bg-white/5 data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors"
                >
                  <Link to="/pendencias">
                    <FileWarning />
                    <span className="font-medium">Central de Pendências</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {role === 'Admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/relatorios'}
                    className="rounded-lg hover:bg-white/5 data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors"
                  >
                    <Link to="/relatorios">
                      <BarChart3 />
                      <span className="font-medium">Relatórios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {role === 'Admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === '/configuracoes'}
                    className="rounded-lg hover:bg-white/5 data-[active=true]:bg-primary/20 data-[active=true]:text-primary transition-colors"
                  >
                    <Link to="/configuracoes">
                      <Settings />
                      <span className="font-medium">Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-white/5">
            <SidebarMenuButton
              onClick={signOut}
              className="text-muted-foreground hover:text-white hover:bg-white/5 cursor-pointer rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sair do sistema</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen overflow-hidden z-10">
          <header className="h-16 flex-shrink-0 border-b border-white/5 bg-card/60 backdrop-blur-md flex items-center justify-between px-6 z-20 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-white/10" />
              <div className="h-6 w-px bg-white/10 hidden md:block" />
              <Breadcrumb className="hidden md:flex">
                <BreadcrumbList>{getBreadcrumbs()}</BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block w-64 group">
                <Input
                  placeholder="Buscar médico..."
                  className="h-9 pl-10 bg-black/40 border-white/10 rounded-full focus-visible:ring-primary/50 transition-all group-hover:bg-black/60"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <NotificationDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="flex items-center gap-3 hover:bg-white/5 p-1.5 pr-4 rounded-full transition-colors cursor-pointer border border-transparent hover:border-white/10">
                    <Avatar className="h-8 w-8 ring-1 ring-white/20">
                      <AvatarImage src="https://img.usecurling.com/ppl/thumbnail?gender=female&seed=1" />
                      <AvatarFallback className="bg-primary/20 text-primary">US</AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start text-sm">
                      <span className="font-semibold leading-none text-white">
                        {user?.name || 'Usuário'}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium leading-none mt-1 uppercase tracking-wider">
                        {role}
                      </span>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-card/90 backdrop-blur-xl border-white/10"
                >
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
