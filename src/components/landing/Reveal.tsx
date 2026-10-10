import React, { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

const reducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const Reveal: React.FC<{ children: ReactNode; className?: string; delay?: number; stagger?: number }> = ({
    children, className = "", delay = 0, stagger = 0
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current!;
        if (reducido()) { el.classList.add("is-in"); return; }
        if (stagger) {
            Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--d", `${delay + i * stagger}s`));
        }
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { el.classList.add("is-in"); io.disconnect(); }
        }, { rootMargin: "0px 0px -10% 0px" });
        io.observe(el);
        return () => io.disconnect();
    }, [delay, stagger]);

    const style = { "--d": `${delay}s` } as CSSProperties;
    return <div ref={ref} style={style} className={`lp-reveal ${stagger ? "lp-reveal-kids" : ""} ${className}`}>{children}</div>;
};

export const TitleReveal: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = "" }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current!;
        if (reducido()) { el.classList.add("is-in"); return; }
        const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { el.classList.add("is-in"); io.disconnect(); }
        }, { rootMargin: "0px 0px -8% 0px" });
        io.observe(el);
        const seguro = window.setTimeout(() => {
            if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
        }, 1200);
        return () => { io.disconnect(); clearTimeout(seguro); };
    }, []);

    return <div ref={ref} className={`lp-title-reveal ${className}`}>{children}</div>;
};
