import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/bricolage-grotesque/opsz.css'
import '@fontsource-variable/figtree/index.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource/caveat/700.css'
import './index.css'
import './styles/studio.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
