import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import Index from './pages/Index'
import DoctorList from './pages/medicos/List'
import DoctorForm from './pages/medicos/Form'
import AiUpload from './pages/medicos/AiUpload'
import DoctorDetails from './pages/medicos/Details'
import { MainStoreProvider } from './stores/useMainStore'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <MainStoreProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/medicos" element={<DoctorList />} />
            <Route path="/medicos/novo" element={<DoctorForm />} />
            <Route path="/medicos/editar/:id" element={<DoctorForm />} />
            <Route path="/medicos/ia-upload" element={<AiUpload />} />
            <Route path="/medicos/:id" element={<DoctorDetails />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </MainStoreProvider>
  </BrowserRouter>
)

export default App
