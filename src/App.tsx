import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

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

// Las pantallas internas exigen sesión: sin token se vuelve al ingreso (hallazgo de la prueba de aceptación HU-03).
const Privada: React.FC<{ children: React.ReactElement }> = ({ children }) =>
  localStorage.getItem("token") ? children : <Navigate to="/login" replace />;

const App: React.FC = () => {
  return (
    <Router>
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
        <Route path="/juego" element={<React.Suspense fallback={cargandoJuego}><JuegoInspector /></React.Suspense>} />
        <Route path="/juego/ranking" element={<React.Suspense fallback={cargandoJuego}><RankingEnVivo /></React.Suspense>} />
        <Route path="/juego/certificado" element={<React.Suspense fallback={cargandoJuego}><Certificado /></React.Suspense>} />

        <Route path="*" element={<h1>404 - Página no encontrada</h1>} />
      </Routes>
    </Router>
  );
};

export default App;
