import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import LoginComponent from "./components/login/login";
import Register from "./components/registrer/registrer";
import Home from "./components/home/home";

import EmpresaComponent from "./components/empresa/EmpresaComponent";
import RegistroHorarioComponent from "./components/Horarios/RegistroHorariosComponents";

import { AdminCatalogosPage } from "./components/AdminCatalogosPage";

import { GestionAtsComponent } from "./components/ats/GestionAtsComponent";

import GestorPermisosUsuarios from "./components/gestorUsuarios/GestorPermisosUsuarios";

const LandingPageComponent = React.lazy(() => import("./components/landing/LandingPageComponent"));
const JuegoInspector = React.lazy(() => import("./components/juego/JuegoInspector"));
const RankingEnVivo = React.lazy(() => import("./components/juego/RankingEnVivo"));
const Certificado = React.lazy(() => import("./components/juego/Certificado"));
const cargandoJuego = <div style={{ minHeight: "100vh", background: "#06241A" }} />;

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {}
        <Route path="/" element={<React.Suspense fallback={<div style={{ minHeight: "100vh", background: "#06241A" }} />}><LandingPageComponent /></React.Suspense>} />

        {}
        <Route path="/login" element={<LoginComponent />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />

        {}
        <Route path="/empresas" element={<EmpresaComponent />} />
        <Route path="/horarios" element={<RegistroHorarioComponent />} />

        {}
        <Route path="/admin/catalogos" element={<AdminCatalogosPage darkMode={true} />} />

        {}
        <Route path="/ats" element={<GestionAtsComponent />} />

        {}
        <Route path="/admin/permisos-usuario" element={<GestorPermisosUsuarios />} />

        {}
        <Route path="/juego" element={<React.Suspense fallback={cargandoJuego}><JuegoInspector /></React.Suspense>} />
        <Route path="/juego/ranking" element={<React.Suspense fallback={cargandoJuego}><RankingEnVivo /></React.Suspense>} />
        <Route path="/juego/certificado" element={<React.Suspense fallback={cargandoJuego}><Certificado /></React.Suspense>} />

        <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
      </Routes>
    </Router>
  );
};

export default App;
