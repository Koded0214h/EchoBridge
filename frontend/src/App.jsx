import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import { AppShell } from './components/AppShell.jsx'
import './App.css'

const SplashPage = lazy(() =>
  import('./pages/SplashPage.jsx').then((m) => ({ default: m.SplashPage })),
)
const HomePage = lazy(() =>
  import('./pages/HomePage.jsx').then((m) => ({ default: m.HomePage })),
)
const ResourcesPage = lazy(() =>
  import('./pages/ResourcesPage.jsx').then((m) => ({ default: m.ResourcesPage })),
)
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage.jsx').then((m) => ({ default: m.SettingsPage })),
)
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage.jsx').then((m) => ({ default: m.NotFoundPage })),
)

function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<SplashPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}

export default App
