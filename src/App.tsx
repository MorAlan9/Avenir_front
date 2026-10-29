import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import LoginComponent from "./components/login/login";
import Register from "./components/registrer/registrer";
import Home from "./components/home/home";
import PanelAccesibilidad from "./components/accesibilidad/PanelAccesibilidad";

import EmpresaComponent from "./components/empresa/EmpresaComponent";
import RegistroHorarioComponent from "./components/Horarios/RegistroHorariosComponents";

import { AdminCatalogosPage } from "./components/AdminCatalogosPage";

import { GestionAtsComponent } from "./components/ats/GestionAtsComponent";

import GestorPermisosUsuarios from "./components/gestorUsuarios/GestorPermisosUsuarios";

const LandingPageComponent = React.lazy(() => import("./components/landing/LandingPageComponent"));
const JuegoInspector = React.lazy(() => import("./components/juego/JuegoInspector"));
const RankingEnVivo = React.lazy(() => import("./components/juego/RankingEnVivo"));
const DemoPublica = React.lazy(() => import("./components/juego/DemoPublica"));
const Certificado = React.lazy(() => import("./components/juego/Certificado"));
const cargandoJuego = <div style={{ minHeight: "100vh", background: "#06241A" }} />;

// Las pantallas internas exigen sesión: sin token se vuelve al ingreso (hallazgo de la prueba de aceptación HU-03).
const Privada: React.FC<{ children: React.ReactElement }> = ({ children }) =>
  localStorage.getItem("token") ? children : <Navigate to="/login" replace />;

// Zona de contenido principal para las pantallas públicas y las sueltas (el panel /home define su propio <main>).
// display: contents → no cambia el diseño; solo le da al lector de pantalla el "contenido principal" y un destino al enlace "Saltar al contenido".
const Principal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  if (pathname === "/home") return <>{children}</>;
  return <main id="contenido-principal" tabIndex={-1} style={{ display: "contents" }}>{children}</main>;
};

const App: React.FC = () => {
  return (
    <Router>
      <nav aria-label="Atajos de teclado"><a className="av-saltar" href="#contenido-principal">Saltar al contenido</a></nav>
      <Principal>
      <Routes>
        {}
        <Route path="/" element={<React.Suspense fallback={<div style={{ minHeight: "100vh", background: "#06241A" }} />}><LandingPageComponent /></React.Suspense>} />

        {}
        <Route path="/login" element={<LoginComponent />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Privada><Home /></Privada>} />

        {}
        <Route path="/empresas" element={<Privada><EmpresaComponent /></Privada>} />
        <Route path="/horarios" element={<Privada><RegistroHorarioComponent /></Privada>} />

        {}
        <Route path="/admin/catalogos" element={<Privada><AdminCatalogosPage darkMode={true} /></Privada>} />

        {}
        <Route path="/ats" element={<Privada><GestionAtsComponent /></Privada>} />

        {}
        <Route path="/admin/permisos-usuario" element={<Privada><GestorPermisosUsuarios /></Privada>} />

        {}
        <Route path="/demo" element={<React.Suspense fallback={cargandoJuego}><DemoPublica /></React.Suspense>} />
        <Route path="/juego" element={<React.Suspense fallback={cargandoJuego}><JuegoInspector /></React.Suspense>} />
        <Route path="/juego/ranking" element={<React.Suspense fallback={cargandoJuego}><RankingEnVivo /></React.Suspense>} />
        <Route path="/juego/certificado" element={<React.Suspense fallback={cargandoJuego}><Certificado /></React.Suspense>} />

        <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
      </Routes>
      </Principal>
      <PanelAccesibilidad />
    </Router>
  );
};

export default App;
