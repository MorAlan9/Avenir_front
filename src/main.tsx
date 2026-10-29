import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './theme.css'
import './styles/accesibilidad.css'
import { aplicar, leer } from './components/accesibilidad/preferencias'
import { API_BASE_URL } from './service/api'

// Preferencias de accesibilidad (tamaño de texto, contraste…): se aplican antes de dibujar para que no parpadee
aplicar(leer())

// El backend gratuito se duerme por inactividad: se lo despierta apenas se abre la web,
// mientras la persona escribe su usuario, en vez de recién al apretar "Ingresar".
fetch(`${API_BASE_URL}/ping`, { cache: 'no-store' }).catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)