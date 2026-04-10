import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Download, Eye, Edit, Trash2, Search, Save, Bookmark } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'

export default function DoctorList() {
  const { user } = useAuth()
  const role = user?.name === 'Admin' || user?.name === 'Revisor' ? 'Administrador' : 'Operacional'
  const { toast } = useToast()

  const [doctors, setDoctors] = useState<any[]>([])
  const [docsMap, setDocsMap] = useState<Record<string, any[]>>({})
  const [savedFilters, setSavedFilters] = useState<any[]>([])

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const loadData = async () => {
    try {
      const [docs, allDocs, sf] = await Promise.all([
        api.medicos.list(),
        api.documentos.listAllActive(),
        user ? api.filtros.list(user.id) : Promise.resolve([]),
      ])
      setDoctors(docs)
      setSavedFilters(sf)

      const dMap: Record<string, any[]> = {}
      allDocs.forEach((d) => {
        if (!dMap[d.medico_id]) dMap[d.medico_id] = []
        dMap[d.medico_id].push(d)
      })
      setDocsMap(dMap)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])
  useRealtime('medicos', () => loadData())
  useRealtime('documentos_medicos', () => loadData())

  const getCompleteness = (doc: any) => {
    let score = 0
    if (doc.nome_completo && doc.cpf && doc.email && doc.telefone) score += 25
    else if (doc.nome_completo && doc.cpf) score += 15

    if (doc.crm && doc.uf_crm && doc.especialidade && doc.categoria_medico) score += 25
    else if (doc.crm && doc.uf_crm) score += 15

    const mDocs = docsMap[doc.id] || []
    const validDocs = mDocs.filter((d) => d.status_validacao === 'Validado')
    if (validDocs.length >= 2) score += 25
    else if (mDocs.length > 0) score += 15

    const requiresContract =
      doc.categoria_medico === 'MEDICO PRN' || doc.categoria_medico === 'MEDICO PALHOÇA'
    if (requiresContract) {
      if (doc.contrato_assinado) score += 25
    } else {
      score += 25
    }

    return Math.min(score, 100)
  }

  const getSLA = (doc: any) => {
    if (
      doc.status_cadastro === 'Ativo' ||
      doc.status_cadastro === 'Aprovado' ||
      doc.status_cadastro === 'Inativo'
    )
      return null
    const days = Math.floor((Date.now() - new Date(doc.created).getTime()) / (1000 * 3600 * 24))
    if (days > 15)
      return { label: 'SLA: Atrasado', color: 'bg-red-100 text-red-700 border-red-200' }
    if (days > 7)
      return { label: 'SLA: Atenção', color: 'bg-amber-100 text-amber-700 border-amber-200' }
    return { label: 'SLA: No Prazo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  }

  const checkCriticalAlert = (doc: any) => {
    if (
      (doc.categoria_medico === 'MEDICO PRN' || doc.categoria_medico === 'MEDICO PALHOÇA') &&
      !doc.contrato_assinado
    ) {
      return true
    }
    return false
  }

  const filteredDoctors = doctors.filter((doc) => {
    const s = search.toLowerCase()
    const matchesSearch =
      doc.nome_completo.toLowerCase().includes(s) || doc.crm.includes(s) || doc.cpf.includes(s)
    const matchesStatus = filterStatus === 'all' || doc.status_cadastro === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-emerald-500'
      case 'Aprovado':
        return 'bg-teal-500'
      case 'Inativo':
        return 'bg-slate-500'
      case 'Rejeitado':
        return 'bg-red-500'
      case 'Rascunho':
        return 'bg-amber-500'
      case 'Pendente de Revisão':
        return 'bg-sky-500'
      case 'Pendente Documental':
        return 'bg-indigo-500'
      case 'Pendente Contratual':
        return 'bg-blue-500'
      default:
        return 'bg-primary'
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.medicos.update(id, { ativo: false, status_cadastro: 'Inativo' })
      await api.auditoria.log(id, 'Inativação de cadastro (Soft Delete)')
      toast({ title: 'Médico Inativado' })
    } catch {
      toast({ title: 'Erro ao inativar', variant: 'destructive' })
    }
  }

  const saveCurrentFilter = async () => {
    if (!user) return
    const name = prompt('Nome do filtro:')
    if (!name) return
    try {
      await api.filtros.create({
        user_id: user.id,
        nome: name,
        configuracao_json: { search, status: filterStatus },
      })
      toast({ title: 'Filtro salvo' })
      loadData()
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const applyFilter = (sf: any) => {
    setSearch(sf.configuracao_json?.search || '')
    setFilterStatus(sf.configuracao_json?.status || 'all')
  }

  const handleExport = () => {
    const csvRows = [
      ['Nome', 'CPF', 'CRM', 'UF', 'Categoria', 'Contratacao', 'Status', 'SLA', 'Completude (%)'],
    ]
    filteredDoctors.forEach((d) => {
      const sla = getSLA(d)?.label || 'Concluido'
      csvRows.push([
        `"${d.nome_completo}"`,
        d.cpf,
        d.crm,
        d.uf_crm,
        d.categoria_medico,
        d.tipo_contratacao,
        d.status_cadastro,
        sla,
        getCompleteness(d).toString(),
      ])
    })
    const blob = new Blob([csvRows.map((r) => r.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'medicos.csv'
    a.click()
    toast({ title: 'Exportação iniciada' })
    if (user && filteredDoctors[0]) {
      api.auditoria.log(filteredDoctors[0].id, 'Relatório Exportado (Lista de Médicos)')
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Médicos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie a base de médicos cadastrados e acompanhe SLAs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="w-4 h-4" /> Exportar
          </Button>
          <Button asChild className="gap-2">
            <Link to="/medicos/novo">Novo Cadastro</Link>
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="py-4 px-6 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou CRM..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Pendente de Revisão">Pendente de Revisão</SelectItem>
                <SelectItem value="Pendente Documental">Pendente Documental</SelectItem>
                <SelectItem value="Pendente Contratual">Pendente Contratual</SelectItem>
                <SelectItem value="Rascunho">Rascunho</SelectItem>
                <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={saveCurrentFilter}
                title="Salvar filtro atual"
              >
                <Save className="w-4 h-4 text-muted-foreground" />
              </Button>
              {savedFilters.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Bookmark className="w-4 h-4" /> Filtros Salvos
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Meus Filtros</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {savedFilters.map((sf) => (
                      <DropdownMenuItem key={sf.id} onClick={() => applyFilter(sf)}>
                        {sf.nome}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Nome & Contato</TableHead>
                <TableHead>CRM/UF</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Saúde & SLA</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum médico encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDoctors.map((doc) => {
                  const comp = getCompleteness(doc)
                  const sla = getSLA(doc)
                  const isCritical = checkCriticalAlert(doc)

                  return (
                    <TableRow key={doc.id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary relative">
                            {doc.nome_completo.substring(0, 2).toUpperCase()}
                            {isCritical && (
                              <span
                                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                                title="Alerta Crítico: Falta Contrato"
                              />
                            )}
                          </div>
                          <div className="flex flex-col max-w-[200px] truncate">
                            <span className="truncate">{doc.nome_completo}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {doc.email || doc.telefone || 'Sem contato'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.crm}/{doc.uf_crm}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            {doc.tipo_contratacao}
                          </span>
                          <span className="text-xs border px-2 py-0.5 rounded-md bg-muted/50">
                            {doc.categoria_medico}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2 w-full max-w-[120px]">
                          <div className="flex items-center gap-2">
                            <Progress value={comp} className="h-1.5 flex-1" />
                            <span className="text-[10px] font-medium w-6 text-right">{comp}%</span>
                          </div>
                          {sla && (
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 border ${sla.color}`}
                            >
                              {sla.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(doc.status_cadastro)}>
                          {doc.status_cadastro}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link to={`/medicos/${doc.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> Visualizar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/medicos/editar/${doc.id}`}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </Link>
                            </DropdownMenuItem>
                            {role === 'Administrador' && doc.status_cadastro !== 'Inativo' && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(doc.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Inativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
