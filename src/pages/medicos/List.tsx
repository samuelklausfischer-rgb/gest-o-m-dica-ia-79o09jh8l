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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Download, Eye, Edit, Trash2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/services/api'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'

export default function DoctorList() {
  const { user } = useAuth()
  const role = user?.name === 'Admin' ? 'Administrador' : 'Operacional'
  const { toast } = useToast()
  const [doctors, setDoctors] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const loadData = async () => {
    try {
      const docs = await api.medicos.list()
      setDoctors(docs)
    } catch (e) {}
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('medicos', () => loadData())

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
        return 'bg-emerald-500 hover:bg-emerald-600'
      case 'Inativo':
        return 'bg-slate-500 hover:bg-slate-600'
      case 'Rascunho':
        return 'bg-amber-500 hover:bg-amber-600'
      case 'Pendente de Revisão':
        return 'bg-sky-500 hover:bg-sky-600'
      default:
        return 'bg-primary hover:bg-primary'
    }
  }

  const handleDelete = async (id: string, name: string) => {
    try {
      await api.medicos.update(id, { ativo: false, status_cadastro: 'Inativo' })
      await api.auditoria.log(id, 'Inativação de cadastro (Soft Delete)')
      toast({ title: 'Médico Inativado' })
    } catch {
      toast({ title: 'Erro ao inativar', variant: 'destructive' })
    }
  }

  const handleExport = () => {
    const csvRows = [['Nome', 'CPF', 'CRM', 'UF', 'Categoria', 'Contratacao', 'Status', 'Origem']]
    filteredDoctors.forEach((d) => {
      csvRows.push([
        d.nome_completo,
        d.cpf,
        d.crm,
        d.uf_crm,
        d.categoria_medico,
        d.tipo_contratacao,
        d.status_cadastro,
        d.origem_cadastro,
      ])
    })
    const blob = new Blob([csvRows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'medicos.csv'
    a.click()
    toast({ title: 'Exportação iniciada' })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Médicos</h1>
          <p className="text-muted-foreground mt-1">Gerencie a base de médicos cadastrados.</p>
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
            <div className="w-full sm:w-auto flex-1"></div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Pendente de Revisão">Pendente de Revisão</SelectItem>
                <SelectItem value="Rascunho">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Nome</TableHead>
                <TableHead>CRM</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Contrato</TableHead>
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
                filteredDoctors.map((doc) => (
                  <TableRow key={doc.id} className="group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {doc.nome_completo.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span>{doc.nome_completo}</span>
                          <span className="text-xs text-muted-foreground">
                            {doc.email || 'Sem e-mail'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.crm}/{doc.uf_crm}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs border px-2 py-1 rounded-md bg-muted/50">
                        {doc.categoria_medico}
                      </span>
                    </TableCell>
                    <TableCell>
                      {doc.contrato_assinado ? (
                        <Badge
                          variant="outline"
                          className="text-emerald-600 border-emerald-200 bg-emerald-50"
                        >
                          Assinado
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-200 bg-amber-50"
                        >
                          Pendente
                        </Badge>
                      )}
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
                              onClick={() => handleDelete(doc.id, doc.nome_completo)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Inativar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
