import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
    ShieldCheck, ClipboardList, GraduationCap, FileSearch, HardHat, Building2,
    Mail, Phone, MapPin, ArrowRight, CheckCircle2, Timer, Compass, Fuel, FileText,
    Package, Camera, ListChecks, BarChart3
} from "lucide-react";
import logoAvenir from "../../assets/avenir-logo.png";
import { Reveal, TitleReveal } from "./Reveal";
import "./landing.css";

gsap.registerPlugin(ScrollTrigger);

const servicios = [
    {
        icono: <FileSearch size={22} />,
        titulo: "Relevamiento e IPER",
        texto: "Identificación de peligros y evaluación de riesgos (IPER) en cada puesto de trabajo, con matriz de probabilidad e impacto documentada."
    },
    {
        icono: <ClipboardList size={22} />,
        titulo: "Análisis de Trabajo Seguro (ATS)",
        texto: "Procedimientos de trabajo seguro a medida de cada tarea crítica, con pasos, riesgos asociados y medidas de control."
    },
    {
        icono: <GraduationCap size={22} />,
        titulo: "Capacitación en H&S",
        texto: "Formación al personal en uso de EPP, procedimientos de emergencia y cultura de prevención, adaptada a cada industria."
    },
    {
        icono: <ShieldCheck size={22} />,
        titulo: "Auditorías y Cumplimiento",
        texto: "Auditorías periódicas de cumplimiento normativo (Ley 19.587, Res. SRT) y seguimiento de acciones correctivas."
    },
    {
        icono: <HardHat size={22} />,
        titulo: "Gestión de EPP e Insumos",
        texto: "Control de stock, entrega y trazabilidad de elementos de protección personal y equipamiento de seguridad."
    },
    {
        icono: <Building2 size={22} />,
        titulo: "Gestión Documental",
        texto: "Organización centralizada de certificados, pólizas, planes de emergencia y toda la documentación legal vigente."
    }
];

const etapas = [
    {
        etiqueta: "Etapa 1",
        titulo: "Diagnóstico inicial",
        texto: "Visitamos tu empresa y relevamos los riesgos existentes en cada sector y puesto, con registro fotográfico y hallazgos priorizados.",
        chips: ["Visita en sitio", "Relevamiento", "Hallazgos"],
        icono: <FileSearch size={54} strokeWidth={1.4} />
    },
    {
        etiqueta: "Etapa 2",
        titulo: "Plan de acción",
        texto: "Armamos un plan de trabajo priorizado, con plazos y responsables definidos, y la matriz IPER documentada para cada puesto.",
        chips: ["Matriz IPER", "Plazos", "Responsables"],
        icono: <ClipboardList size={54} strokeWidth={1.4} />
    },
    {
        etiqueta: "Etapa 3",
        titulo: "Implementación",
        texto: "Ejecutamos capacitaciones, entregamos EPP y documentamos cada procedimiento, con tareas y checklists asignados al equipo.",
        chips: ["Capacitación", "EPP", "ATS"],
        icono: <HardHat size={54} strokeWidth={1.4} />
    },
    {
        etiqueta: "Etapa 4",
        titulo: "Seguimiento continuo",
        texto: "Auditamos periódicamente y ajustamos el plan según los resultados obtenidos, con vencimientos y alertas a la vista.",
        chips: ["Auditorías", "Vencimientos", "Mejora continua"],
        icono: <ShieldCheck size={54} strokeWidth={1.4} />
    }
];

const plataforma = [
    { icono: <Timer size={20} />, titulo: "Ingreso y egreso", texto: "Fichaje de cada visita con ubicación real validada y horas calculadas solas." },
    { icono: <Compass size={20} />, titulo: "Mapa en vivo", texto: "Dónde está cada técnico en el momento, con seguimiento de viajes a tu empresa." },
    { icono: <Fuel size={20} />, titulo: "Viáticos por km", texto: "Kilómetros y montos calculados automáticamente, listos para aprobar." },
    { icono: <Camera size={20} />, titulo: "Relevamientos", texto: "Hallazgos con fotos y estado, hasta el cierre de cada uno." },
    { icono: <ClipboardList size={20} />, titulo: "IPER y ATS digitales", texto: "Matriz de riesgos y análisis de trabajo seguro, con historial y PDF." },
    { icono: <FileText size={20} />, titulo: "Documentos", texto: "Versiones, vencimientos y alertas de toda la documentación legal." },
    { icono: <Package size={20} />, titulo: "Insumos y EPP", texto: "Stock, entregas a cada empleado y trazabilidad de los elementos." },
    { icono: <ListChecks size={20} />, titulo: "Tareas y checklists", texto: "Asignación de tareas con pasos que se tildan en campo." }
];

const marco = ["Ley 19.587", "Decreto 351/79", "Ley 24.557", "Res. SRT 295/03", "IPER", "ATS", "EPP", "Auditorías", "Capacitación", "Planes de emergencia"];

const FUENTE_ID = "landing-fuentes";

const LandingPageComponent: React.FC = () => {
    const navigate = useNavigate();
    const raiz = useRef<HTMLDivElement>(null);
    const historia = useRef<HTMLElement>(null);
    const progreso = useRef<HTMLDivElement>(null);
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const tituloPrevio = document.title;
        document.title = "Avenir — Consultora de Higiene y Seguridad";
        if (!document.getElementById(FUENTE_ID)) {
            const link = document.createElement("link");
            link.id = FUENTE_ID;
            link.rel = "stylesheet";
            link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap";
            document.head.appendChild(link);
        }
        if ("scrollRestoration" in history) history.scrollRestoration = "manual";
        document.body.classList.remove("dark-mode");
        return () => { document.title = tituloPrevio; };
    }, []);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const lenis = new Lenis({ lerp: 0.1 });
        lenisRef.current = lenis;
        const alScrollear = () => {
            ScrollTrigger.update();
            const max = document.documentElement.scrollHeight - window.innerHeight;
            if (progreso.current && max > 0) progreso.current.style.transform = `scaleX(${Math.min(1, window.scrollY / max)})`;
        };
        lenis.on("scroll", alScrollear);
        const tick = (t: number) => lenis.raf(t * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        return () => { gsap.ticker.remove(tick); lenis.destroy(); lenisRef.current = null; };
    }, []);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const mm = gsap.matchMedia();
        mm.add("(min-width: 900px)", () => {
            const seccion = historia.current;
            if (!seccion) return;
            const etapasEl = gsap.utils.toArray<HTMLElement>(".lp-stage", seccion);
            const capas = gsap.utils.toArray<HTMLElement>(".lp-story-layer", seccion);
            gsap.set(etapasEl.slice(1), { opacity: 0, y: 40 });
            gsap.set(capas.slice(1), { opacity: 0, scale: 0.85 });
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: seccion, start: "top top", end: "+=260%", pin: true,
                    scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true
                }
            });
            etapasEl.forEach((_, i) => {
                if (i === 0) return;
                tl.to(etapasEl[i - 1], { opacity: 0, y: -40, duration: 0.6 }, i * 1.2 - 0.2)
                    .to(etapasEl[i], { opacity: 1, y: 0, duration: 0.6 }, i * 1.2)
                    .to(capas[i - 1], { opacity: 0, scale: 1.12, duration: 0.7 }, i * 1.2 - 0.2)
                    .to(capas[i], { opacity: 1, scale: 1, duration: 0.7 }, i * 1.2 - 0.1);
            });
            tl.to(".lp-ring-fg", { strokeDashoffset: 0, ease: "none", duration: tl.duration() }, 0);
            tl.to(".lp-story-progress", { scaleY: 1, ease: "none", duration: tl.duration() }, 0);
            tl.to({}, { duration: 0.4 });
        });
        const otra = window.setTimeout(() => ScrollTrigger.refresh(), 500);
        return () => { window.clearTimeout(otra); mm.revert(); };
    }, []);

    useEffect(() => {
        const mover = (e: PointerEvent) => {
            const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(".lp-glow");
            if (!el) return;
            const r = el.getBoundingClientRect();
            el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
            el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
        };
        window.addEventListener("pointermove", mover, { passive: true });
        return () => window.removeEventListener("pointermove", mover);
    }, []);

    const irA = (id: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        const destino = document.getElementById(id);
        if (!destino) return;
        if (lenisRef.current) lenisRef.current.scrollTo(destino, { offset: -70 });
        else destino.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="lp-root" ref={raiz}>
            <div className="lp-scrollbar" ref={progreso} aria-hidden />

            <header className="lp-nav-wrap">
                <nav className="lp-nav lp-glass lp-glow">
                    <a href="#inicio" className="lp-brand" onClick={irA("inicio")} aria-label="Avenir, inicio">
                        <img src={logoAvenir} alt="" />
                        <span>Avenir</span>
                    </a>
                    <div className="lp-nav-links">
                        <a href="#servicios" onClick={irA("servicios")}>Servicios</a>
                        <a href="#proceso" onClick={irA("proceso")}>Cómo trabajamos</a>
                        <a href="#plataforma" onClick={irA("plataforma")}>Plataforma</a>
                        <a href="#contacto" onClick={irA("contacto")}>Contacto</a>
                    </div>
                    <button className="lp-btn lp-btn-mint" onClick={() => navigate("/login")}>
                        Ingresar
                    </button>
                </nav>
            </header>

            <section className="lp-hero" id="inicio">
                <div className="lp-atmo" aria-hidden>
                    <i className="lp-blob b1" />
                    <i className="lp-blob b2" />
                    <i className="lp-blob b3" />
                    <i className="lp-grid" />
                </div>
                <div className="lp-hero-inner">
                    <div className="lp-hero-copy">
                        <span className="lp-eyebrow"><ShieldCheck size={14} /> Consultora de Higiene y Seguridad</span>
                        <TitleReveal>
                            <h1>Prevención real para <em>cada puesto</em> de trabajo de tu empresa</h1>
                        </TitleReveal>
                        <p className="lp-lead">
                            Acompañamos a empresas de todos los rubros en el cumplimiento de la normativa de
                            higiene y seguridad laboral: relevamiento de riesgos, capacitaciones, auditorías
                            y gestión documental, con seguimiento cercano y continuo.
                        </p>
                        <div className="lp-actions">
                            <a href="#contacto" onClick={irA("contacto")} className="lp-btn lp-btn-mint lp-btn-lg">
                                Solicitar una consulta <ArrowRight size={16} />
                            </a>
                            <a href="#servicios" onClick={irA("servicios")} className="lp-btn lp-btn-ghost lp-btn-lg">Ver servicios</a>
                        </div>
                    </div>

                    <div className="lp-orbit" aria-hidden>
                        <span className="lp-orbit-ring r1" />
                        <span className="lp-orbit-ring r2" />
                        <div className="lp-orbit-core lp-glass lp-glow">
                            <img src={logoAvenir} alt="" />
                        </div>
                        <span className="lp-chip lp-glass c1"><FileSearch size={14} /> IPER</span>
                        <span className="lp-chip lp-glass c2"><ClipboardList size={14} /> ATS</span>
                        <span className="lp-chip lp-glass c3"><HardHat size={14} /> EPP</span>
                        <span className="lp-chip lp-glass c4"><ShieldCheck size={14} /> Auditorías</span>
                    </div>
                </div>
                <div className="lp-scroll-hint" aria-hidden><span /></div>
            </section>

            <section className="lp-marquee" aria-label="Marco normativo y áreas de trabajo">
                <div className="lp-marquee-track">
                    {[...marco, ...marco].map((m, i) => (
                        <span key={i}>{m}<b>✦</b></span>
                    ))}
                </div>
            </section>

            <section className="lp-section" id="servicios">
                <Reveal className="lp-head">
                    <span className="lp-kicker">Servicios</span>
                    <TitleReveal><h2>Qué <em>hacemos</em></h2></TitleReveal>
                    <p>Un servicio de higiene y seguridad pensado para acompañar toda la operación, no solo para cumplir un trámite.</p>
                </Reveal>
                <Reveal className="lp-servicios-grid" stagger={0.08}>
                    {servicios.map((s) => (
                        <div className="lp-servicio lp-glow" key={s.titulo}>
                            <div className="lp-servicio-icon">{s.icono}</div>
                            <h3>{s.titulo}</h3>
                            <p>{s.texto}</p>
                        </div>
                    ))}
                </Reveal>
            </section>

            <section className="lp-story" id="proceso" ref={historia}>
                <div className="lp-atmo" aria-hidden>
                    <i className="lp-blob b1" />
                    <i className="lp-blob b3" />
                </div>
                <div className="lp-story-rail" aria-hidden><div className="lp-story-progress" /></div>
                <div className="lp-story-head">
                    <span className="lp-kicker lp-kicker-dark">Cómo trabajamos</span>
                    <h2>Un proceso simple, <em>sin frenar tu operación</em></h2>
                </div>
                <div className="lp-story-inner">
                    <div className="lp-story-texts">
                        {etapas.map((e, i) => (
                            <article className="lp-stage" key={e.titulo}>
                                <span className="lp-stage-tag">0{i + 1} — {e.etiqueta}</span>
                                <h3>{e.titulo}</h3>
                                <p>{e.texto}</p>
                                <div className="lp-stage-chips">
                                    {e.chips.map((c) => <span key={c}>{c}</span>)}
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className="lp-story-visual" aria-hidden>
                        <svg viewBox="0 0 220 220" className="lp-ring">
                            <circle cx="110" cy="110" r="96" className="lp-ring-bg" />
                            <circle cx="110" cy="110" r="96" className="lp-ring-fg" />
                        </svg>
                        {etapas.map((e, i) => (
                            <div className="lp-story-layer" key={e.titulo}>
                                <div className="lp-story-icon">{e.icono}</div>
                                <span className="lp-story-num">0{i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="lp-section lp-plataforma" id="plataforma">
                <div className="lp-atmo" aria-hidden>
                    <i className="lp-blob b2" />
                </div>
                <div className="lp-plataforma-inner">
                    <Reveal className="lp-head">
                        <span className="lp-kicker lp-kicker-dark">Plataforma Avenir</span>
                        <TitleReveal><h2>Tu consultora, con un <em>sistema propio</em></h2></TitleReveal>
                        <p>
                            Además del asesoramiento en campo, trabajamos con la plataforma Avenir: todo lo que
                            se hace en tu empresa queda registrado, trazable y a mano. Se instala como app en el celular.
                        </p>
                    </Reveal>
                    <Reveal className="lp-plat-grid" stagger={0.07}>
                        {plataforma.map((p) => (
                            <div className="lp-plat lp-glass lp-glow" key={p.titulo}>
                                <div className="lp-plat-icon">{p.icono}</div>
                                <h3>{p.titulo}</h3>
                                <p>{p.texto}</p>
                            </div>
                        ))}
                    </Reveal>
                    <Reveal className="lp-plat-cta">
                        <BarChart3 size={18} />
                        <span>Estadísticas, historial y documentación en un solo lugar.</span>
                        <button className="lp-btn lp-btn-mint" onClick={() => navigate("/login")}>
                            Ingresar al sistema <ArrowRight size={15} />
                        </button>
                    </Reveal>
                </div>
            </section>

            <section className="lp-section lp-contacto" id="contacto">
                <div className="lp-contacto-grid">
                    <Reveal>
                        <span className="lp-kicker">Contacto</span>
                        <TitleReveal><h2 className="lp-contacto-title">Hablemos de <em>tu empresa</em></h2></TitleReveal>
                        <p className="lp-contacto-lead">Contanos el rubro y el tamaño de tu equipo y armamos una propuesta a medida.</p>

                        <div className="lp-contacto-item">
                            <div className="lp-icon-wrap"><Mail size={18} /></div>
                            <div>
                                <b>Email</b>
                                <span>contacto@avenir-hys.com.ar</span>
                            </div>
                        </div>
                        <div className="lp-contacto-item">
                            <div className="lp-icon-wrap"><Phone size={18} /></div>
                            <div>
                                <b>Teléfono / WhatsApp</b>
                                <span>+54 9 351 000-0000</span>
                            </div>
                        </div>
                        <div className="lp-contacto-item">
                            <div className="lp-icon-wrap"><MapPin size={18} /></div>
                            <div>
                                <b>Zona de cobertura</b>
                                <span>Córdoba Capital y alrededores</span>
                            </div>
                        </div>
                        <p className="lp-nota">
                            * Datos de contacto de ejemplo — reemplazar por los reales de Avenir antes de publicar.
                        </p>
                    </Reveal>

                    <Reveal delay={0.12}>
                        <div className="lp-form lp-glow">
                            <h3>Escribinos directamente</h3>
                            <p>Este botón abre tu cliente de correo con el mensaje ya armado, listo para enviar.</p>
                            <ul>
                                <li><CheckCircle2 size={15} /> Respuesta dentro de las 24-48hs hábiles</li>
                                <li><CheckCircle2 size={15} /> Primera consulta sin cargo</li>
                            </ul>
                            <a
                                href="mailto:contacto@avenir-hys.com.ar?subject=Consulta%20desde%20la%20web&body=Hola%2C%20quiero%20recibir%20informaci%C3%B3n%20sobre%20sus%20servicios%20de%20Higiene%20y%20Seguridad."
                                className="lp-btn lp-btn-solid lp-btn-lg lp-btn-block"
                            >
                                Enviar consulta por email <ArrowRight size={16} />
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>

            <footer className="lp-footer">
                <div className="lp-footer-brand">
                    <img src={logoAvenir} alt="" />
                    <div>
                        <b>Avenir</b>
                        <span>Consultora de Higiene y Seguridad</span>
                    </div>
                </div>
                <nav className="lp-footer-links" aria-label="Pie">
                    <a href="#servicios" onClick={irA("servicios")}>Servicios</a>
                    <a href="#proceso" onClick={irA("proceso")}>Cómo trabajamos</a>
                    <a href="#plataforma" onClick={irA("plataforma")}>Plataforma</a>
                    <a href="/login">Acceso para empleados</a>
                </nav>
                <span className="lp-footer-copy">© {new Date().getFullYear()} Avenir — Consultora de Higiene y Seguridad</span>
            </footer>
        </div>
    );
};

export default LandingPageComponent;
