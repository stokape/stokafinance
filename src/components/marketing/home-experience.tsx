"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  LineChart,
  Pause,
  Play,
  ShieldCheck,
  Target,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import styles from "@/app/home.module.css";
import { buildSalesWhatsAppUrl, SALES_EMAIL } from "@/lib/config/sales";

const horizons = {
  hoy: {
    label: "Hoy",
    value: "S/ 3,840",
    note: "disponible entre tus cuentas",
    path: "M0,73 C42,71 55,54 91,58 C129,63 151,29 193,38 C235,47 257,18 304,25 C350,32 374,13 420,17",
  },
  dias: {
    label: "30 días",
    value: "S/ 2,710",
    note: "después de gastos programados",
    path: "M0,61 C41,52 60,65 94,49 C130,31 157,54 197,38 C233,24 258,51 302,30 C344,9 380,30 420,13",
  },
  meses: {
    label: "12 meses",
    value: "S/ 8,460",
    note: "si mantienes este ritmo",
    path: "M0,78 C40,69 65,72 99,57 C133,43 161,49 197,34 C235,18 268,31 306,17 C348,2 379,15 420,4",
  },
} as const;

type Horizon = keyof typeof horizons;

const features = [
  {
    icon: Wallet,
    title: "Todo tu dinero, en contexto",
    copy: "Cuentas, movimientos, facturas y suscripciones se leen como una sola historia, no como saldos aislados.",
  },
  {
    icon: LineChart,
    title: "Mira antes de decidir",
    copy: "Proyecta tu flujo de caja y detecta con tiempo los días en los que tu saldo puede quedar corto.",
  },
  {
    icon: Target,
    title: "Convierte planes en aportes",
    copy: "Define metas y deja que STOKA calcule el ritmo necesario para alcanzarlas sin perder de vista tu mes.",
  },
  {
    icon: CreditCard,
    title: "Deudas bajo control",
    copy: "Sigue tarjetas y préstamos con fechas, pagos y saldos que explican cuánto debes y qué viene después.",
  },
];

const included = [
  "Cuentas y movimientos ilimitados",
  "Presupuestos y categorías personalizadas",
  "Tarjetas, préstamos y suscripciones",
  "Metas y patrimonio neto",
  "Pronóstico de flujo de caja",
  "Reportes y exportación de datos",
];

const faqs = [
  {
    question: "¿Hay un plan gratuito?",
    answer: "No. STOKA es un producto de pago desde el primer día. Ambos planes incluyen la experiencia completa, sin funciones esenciales separadas por niveles.",
  },
  {
    question: "¿El plan anual tiene menos funciones?",
    answer: "No. Mensual y anual incluyen exactamente lo mismo. Solo cambia la frecuencia de cobro y el ahorro del plan anual.",
  },
  {
    question: "¿Cómo pago y activo mi cuenta?",
    answer: "Elige un plan y escríbenos por WhatsApp. Te enviaremos los datos para pagar por Yape o transferencia. Cuando confirmemos el pago, recibirás la invitación para crear tu acceso.",
  },
  {
    question: "¿Puedo exportar mi información?",
    answer: "Sí. Puedes exportar tus datos desde la configuración de tu cuenta.",
  },
  {
    question: "¿Qué pasa si ya tengo una cuenta?",
    answer: "Usa el acceso de clientes. Entrarás al mismo panel financiero que ya conoces.",
  },
];

export function HomeExperience({ isAuthenticated }: { isAuthenticated: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [horizon, setHorizon] = useState<Horizon>("dias");
  const [pointer, setPointer] = useState({ x: 50, y: 45 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      video.pause();
    }
  }, []);

  const toggleVideo = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const trackPointer = (event: PointerEvent<HTMLElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  };

  const accountHref = isAuthenticated ? "/dashboard" : "/login";
  const accountLabel = isAuthenticated ? "Ir a mi panel" : "Ya tengo una cuenta";
  const annualWhatsAppUrl = buildSalesWhatsAppUrl("annual");
  const monthlyWhatsAppUrl = buildSalesWhatsAppUrl("monthly");
  const activeHorizon = horizons[horizon];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="STOKA Finance, inicio">
          {/* eslint-disable-next-line @next/next/no-img-element -- wordmark oficial de marca */}
          <img src="/brand/stoka_finance_oscuro.jpg" alt="STOKA Finance" />
        </Link>
        <nav className={styles.nav} aria-label="Navegación principal">
          <a href="#producto">Producto</a>
          <a href="#precios">Precios</a>
          <a href="#preguntas">Preguntas</a>
        </nav>
        <Link className={styles.accountLink} href={accountHref}>
          {accountLabel}
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </header>

      <section
        className={styles.hero}
        onPointerMove={trackPointer}
        style={{ "--pointer-x": `${pointer.x}%`, "--pointer-y": `${pointer.y}%` } as CSSProperties}
      >
        <video
          ref={videoRef}
          className={styles.heroVideo}
          autoPlay
          loop
          muted
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          poster="/brand/logo_fondo_oscuro.jpg"
          aria-hidden="true"
        >
          <source src="/media/stoka-hero.mp4" type="video/mp4" />
        </video>
        <div className={styles.videoShade} />
        <div className={styles.pointerLight} aria-hidden="true" />

        <div className={styles.heroContent}>
          <h1>
            Tu dinero no necesita más pestañas.
            <span> Necesita dirección.</span>
          </h1>
          <p>
            Entiende dónde estás, anticipa lo que viene y decide con cuentas, presupuestos, deudas y metas trabajando juntas.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#precios">
              Elegir mi plan
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <Link className={styles.secondaryAction} href={accountHref}>
              {accountLabel}
            </Link>
          </div>
          <p className={styles.heroFinePrint}>Sin plan gratuito · Desde S/16.58 al mes con pago anual</p>
        </div>

        <div className={styles.forecastPanel} aria-label="Vista interactiva de proyección financiera">
          <div className={styles.panelTopline}>
            <span>Tu horizonte</span>
            <span className={styles.liveSignal}><i /> Proyección activa</span>
          </div>
          <div className={styles.horizonTabs} role="group" aria-label="Cambiar horizonte de proyección">
            {(Object.entries(horizons) as [Horizon, (typeof horizons)[Horizon]][]).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => setHorizon(key)}
                className={horizon === key ? styles.activeTab : undefined}
                aria-pressed={horizon === key}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.forecastValue}>
            <strong>{activeHorizon.value}</strong>
            <span>{activeHorizon.note}</span>
          </div>
          <svg className={styles.forecastChart} viewBox="0 0 420 90" role="img" aria-label={`Curva estimada para ${activeHorizon.label}`}>
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#21e6cf" stopOpacity=".34" />
                <stop offset="1" stopColor="#21e6cf" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className={styles.chartArea} d={`${activeHorizon.path} L420,90 L0,90 Z`} />
            <path className={styles.chartLine} d={activeHorizon.path} />
          </svg>
          <div className={styles.panelFoot}>
            <span>Incluye próximos pagos y aportes a metas</span>
            <span>Datos ilustrativos</span>
          </div>
        </div>

        <button className={styles.videoControl} type="button" onClick={toggleVideo} aria-label={isPlaying ? "Pausar video de fondo" : "Reproducir video de fondo"}>
          {isPlaying ? <Pause aria-hidden="true" size={15} /> : <Play aria-hidden="true" size={15} />}
          {isPlaying ? "Pausar ambiente" : "Reproducir ambiente"}
        </button>
        <a className={styles.scrollCue} href="#producto">
          Descubrir STOKA
          <ChevronDown aria-hidden="true" size={17} />
        </a>
      </section>

      <section className={styles.promise} aria-label="Propuesta de valor">
        <p>Una cuenta. Toda tu vida financiera.</p>
        <div>
          <span>Presente</span><i />
          <span>Próximos pagos</span><i />
          <span>Decisiones futuras</span>
        </div>
      </section>

      <section className={styles.product} id="producto">
        <div className={styles.sectionIntro}>
          <h2>De registrar gastos a entender el movimiento completo.</h2>
          <p>STOKA conecta lo que ya pasó con lo que estás planeando. Cada dato ocupa un lugar y cada pantalla responde una pregunta concreta.</p>
        </div>

        <div className={styles.featureRail}>
          {features.map(({ icon: Icon, title, copy }) => (
            <article key={title} className={styles.featureItem}>
              <Icon aria-hidden="true" size={24} strokeWidth={1.6} />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.commandSurface}>
          <div className={styles.commandHeader}>
            <div>
              <span className={styles.windowDot} /><span className={styles.windowDot} /><span className={styles.windowDot} />
            </div>
            <span>Resumen financiero</span>
            <span>Septiembre</span>
          </div>
          <div className={styles.commandGrid}>
            <div className={styles.mainReading}>
              <span>Disponible seguro</span>
              <strong>S/ 1,284</strong>
              <p>Después de cubrir compromisos y aportes previstos.</p>
              <div className={styles.miniChart} aria-hidden="true">
                {[35, 47, 43, 61, 58, 76, 72, 88, 82, 96].map((height, index) => (
                  <i key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <div className={styles.signalList}>
              <div><Bell size={18} /><span><strong>2 pagos</strong> esta semana</span><b>S/ 286</b></div>
              <div><Target size={18} /><span>Meta “Reserva” <strong>en ritmo</strong></span><b>68%</b></div>
              <div><ShieldCheck size={18} /><span>Presupuesto <strong>estable</strong></span><b>+ S/ 94</b></div>
            </div>
          </div>
          <p className={styles.illustrationLabel}>Vista ilustrativa basada en funciones disponibles</p>
        </div>
      </section>

      <section className={styles.method}>
        <div className={styles.methodCopy}>
          <h2>Tu situación cambia. Tu plan también debería hacerlo.</h2>
          <p>STOKA recalcula la lectura cuando registras un movimiento, ajustas un presupuesto o aportas a una meta. No necesitas reconstruir tu plan cada semana.</p>
          <a href="#precios">Ver planes <ArrowRight aria-hidden="true" size={17} /></a>
        </div>
        <ol className={styles.steps}>
          <li><span>1</span><div><strong>Registra</strong><p>Reúne cuentas, gastos, ingresos y compromisos recurrentes.</p></div></li>
          <li><span>2</span><div><strong>Anticipa</strong><p>Observa el efecto de lo que viene antes de que llegue la fecha.</p></div></li>
          <li><span>3</span><div><strong>Decide</strong><p>Avanza con un número útil: cuánto puedes usar sin desordenar el resto.</p></div></li>
        </ol>
      </section>

      <section className={styles.pricing} id="precios">
        <div className={styles.pricingIntro}>
          <h2>Elige cómo pagar. Recibe STOKA completo.</h2>
          <p>No dividimos el control financiero en funciones básicas y premium. Ambos planes incluyen toda la experiencia.</p>
        </div>
        <div className={styles.priceLayout}>
          <article className={styles.pricePrimary}>
            <div className={styles.priceHeader}>
              <div>
                <h3>Anual</h3>
                <p>La decisión más eficiente</p>
              </div>
              <span>Ahorras S/99.80</span>
            </div>
            <div className={styles.priceAmount}>
              <strong>S/199</strong>
              <span>por cuenta / año</span>
            </div>
            <p className={styles.equivalent}>Equivale a S/16.58 al mes</p>
            <a className={styles.priceCta} href={annualWhatsAppUrl} target="_blank" rel="noreferrer">
              Contratar plan anual
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <p className={styles.paymentNote}>Pago único anual por Yape o transferencia. Activación después de confirmar el pago.</p>
          </article>

          <article className={styles.priceSecondary}>
            <div>
              <h3>Mensual</h3>
              <p>La misma experiencia, mes a mes</p>
            </div>
            <div className={styles.priceAmount}>
              <strong>S/24.90</strong>
              <span>por cuenta / mes</span>
            </div>
            <a className={styles.secondaryCta} href={monthlyWhatsAppUrl} target="_blank" rel="noreferrer">
              Contratar plan mensual
              <ArrowRight aria-hidden="true" size={18} />
            </a>
            <p className={styles.paymentNote}>Renovación mensual por Yape o transferencia.</p>
          </article>

          <div className={styles.included}>
            <h3>Todo incluido</h3>
            <ul>
              {included.map((item) => <li key={item}><Check aria-hidden="true" size={17} />{item}</li>)}
            </ul>
            <p>No existe una versión gratuita. Cada cuenta activa requiere un plan vigente.</p>
          </div>
        </div>
      </section>

      <section className={styles.faq} id="preguntas">
        <div>
          <h2>Antes de empezar.</h2>
          <p>Respuestas claras para una decisión simple.</p>
        </div>
        <div className={styles.faqList}>
          {faqs.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary>{item.question}<ChevronDown aria-hidden="true" size={19} /></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <h2>Que tu próxima decisión empiece con claridad.</h2>
          <p>Elige tu plan, confirma el pago y recibe tu acceso personal.</p>
        </div>
        <a className={styles.primaryAction} href={annualWhatsAppUrl} target="_blank" rel="noreferrer">Hablar por WhatsApp <ArrowRight aria-hidden="true" size={18} /></a>
      </section>

      <footer className={styles.footer}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element -- wordmark oficial de marca */}
          <img src="/brand/stoka_finance_oscuro.jpg" alt="STOKA Finance" />
          <p>Control financiero personal.</p>
        </div>
        <div className={styles.footerLinks}>
          <a href="#producto">Producto</a>
          <a href="#precios">Precios</a>
          <a href={`mailto:${SALES_EMAIL}`}>Contacto</a>
          <Link href={accountHref}>{accountLabel}</Link>
        </div>
        <p>© {new Date().getFullYear()} STOKA Finance</p>
      </footer>
    </main>
  );
}
