import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import useMainStore from '@/stores/useMainStore'
import { useToast } from '@/hooks/use-toast'

export default function DoctorList() {
  const { doctors, deleteDoctor, role } = useMainStore()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.nome.toLowerCase().includes(search.toLowerCase()) ||
      doc.crm.includes(search) ||
      doc.cpf.includes(search)
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus
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

  const handleExport = () => {
    toast({ title: 'Exportação iniciada', description: 'O download do CSV começará em instantes.' })
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
                          {doc.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span>{doc.nome}</span>
                          <span className="text-xs text-muted-foreground">{doc.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.crm}/{doc.ufCrm}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs border px-2 py-1 rounded-md bg-muted/50">
                        {doc.categoria}
                      </span>
                    </TableCell>
                    <TableCell>
                      {doc.contratoAssinado ? (
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
                      <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
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
                          {role === 'Administrador' && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteDoctor(doc.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Excluir
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
