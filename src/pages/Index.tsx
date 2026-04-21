import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Stethoscope, User, ArrowRight, BrainCircuit, Clock, Zap } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import gsap from "gsap";

export default function Index() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      if (headlineRef.current) {
        gsap.fromTo(
          headlineRef.current,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, delay: 0.1, ease: "power3.out" }
        );
      }

      if (subRef.current) {
        gsap.fromTo(
          subRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power2.out" }
        );
      }

      const pixels = gsap.utils.toArray<HTMLElement>(".health-pixel");
      if (pixels.length) {
        pixels.forEach((el, index) => {
          gsap.to(el, {
            keyframes: [
              { opacity: 0, y: 10, scale: 0.9, duration: 0 },
              { opacity: 1, y: -18, scale: 1.06, duration: 0.45, ease: "power2.out" },
              { opacity: 0, y: -46, scale: 1.02, duration: 0.5, ease: "power2.in" },
            ],
            repeat: -1,
            delay: index * 0.22,
          });
        });
      }

      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current.children,
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            delay: 0.3,
            ease: "power2.out",
            stagger: 0.08,
          }
        );
      }

      const featureCards = gsap.utils.toArray<HTMLElement>(".feature-card");
      if (featureCards.length) {
        gsap.fromTo(
          featureCards,
          { y: 40, opacity: 0, rotateX: 8 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 0.9,
            delay: 0.35,
            ease: "power3.out",
            stagger: 0.12,
          }
        );

        featureCards.forEach((card) => {
          const el = card;
          const onMove = (event: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            const relX = (event.clientX - rect.left) / rect.width - 0.5;
            const relY = (event.clientY - rect.top) / rect.height - 0.5;
            gsap.to(el, {
              rotateY: relX * 20,
              rotateX: -relY * 20,
              translateZ: 26,
              duration: 0.4,
              ease: "power2.out",
              boxShadow: "0 26px 70px rgba(6, 10, 40, 0.55)",
            });
            const glow = el.querySelector<HTMLElement>(".feature-glow");
            if (glow) {
              gsap.to(glow, {
                opacity: 0.25,
                background:
                  "radial-gradient(circle at 20% 0%, rgba(250,250,255,0.85), transparent 55%)",
                duration: 0.4,
                ease: "power2.out",
              });
            }
          };
          const onLeave = () => {
            gsap.to(el, {
              rotateX: 0,
              rotateY: 0,
              translateZ: 0,
              duration: 0.6,
              ease: "power3.out",
              boxShadow: "0 20px 40px rgba(6, 10, 40, 0.35)",
            });
            const glow = el.querySelector<HTMLElement>(".feature-glow");
            if (glow) {
              gsap.to(glow, {
                opacity: 0,
                duration: 0.45,
                ease: "power2.out",
              });
            }
          };
          el.addEventListener("mousemove", onMove);
          el.addEventListener("mouseleave", onLeave);
        });
      }

      const handleMove = (event: MouseEvent) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        const relX = (event.clientX - rect.left - rect.width / 2) / rect.width;
        const relY = (event.clientY - rect.top - rect.height / 2) / rect.height;
        const pixels = gsap.utils.toArray<HTMLElement>(".health-pixel");
        gsap.to(pixels, {
          x: (_, i) => relX * (12 + (i % 5) * 4),
          y: (_, i) => relY * (10 + (i % 7) * 3),
          duration: 0.5,
          ease: "power2.out",
        });
      };

      heroRef.current?.addEventListener("mousemove", handleMove);

      const webLayers = gsap.utils.toArray<HTMLElement>(".global-web-layer");
      let handleWebMove: ((event: MouseEvent) => void) | null = null;
      if (webLayers.length) {
        handleWebMove = (event: MouseEvent) => {
          const relX = event.clientX / window.innerWidth - 0.5;
          const relY = event.clientY / window.innerHeight - 0.5;
          gsap.to(webLayers, {
            x: relX * 40,
            y: relY * 30,
            duration: 0.7,
            ease: "power2.out",
          });
        };
        window.addEventListener("mousemove", handleWebMove);
      }

      return () => {
        heroRef.current?.removeEventListener("mousemove", handleMove);
        if (handleWebMove) {
          window.removeEventListener("mousemove", handleWebMove);
        }
      };
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={heroRef}
      className="relative z-10 min-h-screen bg-[#fdfbf6] font-sans selection:bg-[#f97373]/30 selection:text-[#111322] overflow-hidden"
    >
      <div className="pointer-events-none fixed inset-0 -z-10">
        <svg
          className="global-web-layer absolute inset-0 h-full w-full opacity-45"
          viewBox="0 0 1600 900"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="heroWebGrad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f1ede2" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#c7bfb0" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#heroWebGrad)" strokeWidth="1.1">
            {Array.from({ length: 8 }).map((_, row) =>
              Array.from({ length: 14 }).map((_, col) => {
                const x = 80 + col * 110 + (row % 2 === 0 ? 30 : 0);
                const y = 80 + row * 80;
                const nextX = x + 110;
                const nextY = y + 80;
                return (
                  <g key={`${row}-${col}`}>
                    <circle cx={x} cy={y} r={2.1} fill="#f97373" stroke="none" />
                    {col < 13 && (
                      <line
                        x1={x}
                        y1={y}
                        x2={nextX}
                        y2={y}
                        strokeOpacity="0.7"
                      />
                    )}
                    {row < 7 && (
                      <line
                        x1={x}
                        y1={y}
                        x2={x}
                        y2={nextY}
                        strokeOpacity="0.5"
                      />
                    )}
                    {row < 7 && col < 13 && (
                      <line
                        x1={x}
                        y1={y}
                        x2={nextX}
                        y2={nextY}
                        strokeOpacity="0.4"
                      />
                    )}
                  </g>
                );
              })
            )}
          </g>
        </svg>
      </div>

      <Navbar />

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] via-[#fdfbf6] to-[#f1ede2]" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-[3rem] bg-[#4c5591]/8 blur-[120px]" />
        <div className="absolute bottom-[-35%] right-[-20%] h-[520px] w-[780px] rounded-[3.5rem] bg-[#f97373]/10 blur-[140px]" />
      </div>

      <section className="relative pt-24 pb-20 lg:pt-28 lg:pb-24">
        <div className="mx-auto flex max-w-7xl flex-col-reverse gap-12 px-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center">
          <div className="relative flex-[1.2] flex justify-start">
            <div className="relative w-80 sm:w-[34rem] lg:w-[50rem] -ml-10 sm:-ml-16 lg:-ml-28">
              <img
                src="/dino.png"
                alt="Vitalyn mascot"
                className="w-full h-auto drop-shadow-2xl"
              />
              <div className="pointer-events-none absolute inset-0">
                <svg
                  className="health-pixel absolute right-[48px] top-[46%] w-9"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <rect x="6" y="2" width="4" height="4" fill="#3a3e61" />
                  <rect x="6" y="6" width="4" height="4" fill="#3a3e61" />
                  <rect x="6" y="10" width="4" height="4" fill="#3a3e61" />
                  <rect x="2" y="6" width="4" height="4" fill="#3a3e61" />
                  <rect x="10" y="6" width="4" height="4" fill="#3a3e61" />
                </svg>
                <svg
                  className="health-pixel absolute right-[88px] top-[40%] w-10"
                  viewBox="0 0 20 16"
                  aria-hidden="true"
                >
                  <rect x="2" y="7" width="4" height="2" fill="#3a3e61" />
                  <rect x="6" y="6" width="2" height="4" fill="#3a3e61" />
                  <rect x="8" y="4" width="2" height="6" fill="#3a3e61" />
                  <rect x="10" y="6" width="2" height="4" fill="#3a3e61" />
                  <rect x="12" y="7" width="4" height="2" fill="#3a3e61" />
                </svg>
                <svg
                  className="health-pixel absolute right-[120px] top-[34%] w-8"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="4" height="4" fill="#f97373" />
                  <rect x="9" y="5" width="4" height="4" fill="#f97373" />
                  <rect x="5" y="7" width="6" height="4" fill="#f97373" />
                  <rect x="5" y="11" width="2" height="2" fill="#f97373" />
                  <rect x="9" y="11" width="2" height="2" fill="#f97373" />
                </svg>
                <svg
                  className="health-pixel absolute right-[72px] top-[56%] w-7"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <rect x="6" y="2" width="4" height="4" fill="#3a3e61" />
                  <rect x="6" y="6" width="4" height="4" fill="#3a3e61" />
                  <rect x="6" y="10" width="4" height="4" fill="#3a3e61" />
                  <rect x="2" y="6" width="4" height="4" fill="#3a3e61" />
                  <rect x="10" y="6" width="4" height="4" fill="#3a3e61" />
                </svg>
                <svg
                  className="health-pixel absolute right-[110px] top-[52%] w-8"
                  viewBox="0 0 20 16"
                  aria-hidden="true"
                >
                  <rect x="2" y="7" width="4" height="2" fill="#3a3e61" />
                  <rect x="6" y="6" width="2" height="4" fill="#3a3e61" />
                  <rect x="8" y="4" width="2" height="6" fill="#3a3e61" />
                  <rect x="10" y="6" width="2" height="4" fill="#3a3e61" />
                  <rect x="12" y="7" width="4" height="2" fill="#3a3e61" />
                </svg>
                <svg
                  className="health-pixel absolute right-[52px] top-[36%] w-7"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="4" height="4" fill="#f97373" />
                  <rect x="9" y="5" width="4" height="4" fill="#f97373" />
                  <rect x="5" y="7" width="6" height="4" fill="#f97373" />
                  <rect x="5" y="11" width="2" height="2" fill="#f97373" />
                  <rect x="9" y="11" width="2" height="2" fill="#f97373" />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative z-10 max-w-xl text-left flex-1">
            <h1
              ref={headlineRef}
              className="font-hero-vitalyn mt-6 max-w-xl text-6xl sm:text-7xl lg:text-[4.6rem] leading-[1.02] font-extrabold tracking-tight text-[#111322]"
            >
              <span className="block text-[#3a3e61]/80 text-xl sm:text-2xl tracking-[0.28em] uppercase">
                Vitalyn
              </span>
              <span className="mt-3 block">
                Post‑op
                <span className="block text-4xl sm:text-5xl lg:text-[3.5rem] text-[#111322]">
                  Multimodal Risk Radar
                </span>
              </span>
              <span className="mt-3 block text-xl sm:text-2xl text-[#4b4f70]">
                Catches deterioration hours before the ward sees it.
              </span>
            </h1>

            <p
              ref={subRef}
              className="mt-6 max-w-md text-sm sm:text-base leading-relaxed text-[#4b4f70]"
            >
              Vitalyn watches vitals, face and voice to surface the next risk
              before it surfaces in the ward. Built for clinicians, not dashboards.
            </p>

            <div
              ref={ctaRef}
              className="mt-10 flex flex-col items-start gap-4 sm:flex-row"
            >
              <Link to="/login">
                <Button className="h-12 px-8 text-sm sm:text-base bg-gradient-to-r from-[#f1ede2] to-[#e0d9c9] hover:from-[#ffffff] hover:to-[#f1ede2] text-[#3a3e61] font-semibold shadow-lg shadow-[#3a3e61]/25 rounded-full">
                  <User className="mr-2 h-5 w-5" />
                  Enter live demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/patient">
                <Button
                  variant="outline"
                  className="h-12 px-6 text-sm sm:text-base rounded-full border-[2px] border-[#111322] bg-[#3a3e61] text-[#f1ede2] hover:bg-[#2e324f]"
                >
                  <Stethoscope className="mr-2 h-5 w-5" />
                  View patient-side screen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#111322] sm:text-4xl">
              Features built around clinicians
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#4b4f70]">
              A comprehensive system that transforms raw data into lifesaving insights.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 perspective-[1600px]">
            {[
              {
                title: "Multimodal Fusion",
                desc: "Combines wearable vitals, facial micro-expressions, and voice stress analysis for 360° patient monitoring.",
                icon: Activity,
                color: "text-[#3a3e61]",
                bg: "bg-[#f1ede2]/80",
              },
              {
                title: "Predictive TTR Engine",
                desc: "Proprietary Time-to-Risk algorithms forecast deterioration hours before clinical symptoms appear.",
                icon: Clock,
                color: "text-[#3a3e61]",
                bg: "bg-[#f1ede2]/80",
              },
              {
                title: "Smart Queue Optimization",
                desc: "Dynamic hospital resource allocation based on medical urgency rather than first-come-first-serve.",
                icon: Zap,
                color: "text-[#3a3e61]",
                bg: "bg-[#f1ede2]/80",
              },
            ].map((feature) => (
              <Card
                key={feature.title}
                className="feature-card relative bg-[#fdfbf6] border-[2px] border-[#111322] rounded-xl shadow-[4px_4px_0_0_#111322] transition-all duration-500 hover:-translate-y-2"
                style={{ transformStyle: "preserve-3d", transformOrigin: "center center" }}
              >
                <CardHeader className="relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 opacity-0 feature-glow" />
                  <div className={`w-11 h-11 rounded-md flex items-center justify-center mb-4 border-[2px] border-[#111322] shadow-[3px_3px_0_0_#111322] ${feature.bg} ${feature.color}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-[#3a3e61]">{feature.title}</CardTitle>
                  <CardDescription className="text-[#3a3e61]/80 mt-2">
                    {feature.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 sm:py-24 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#111322] sm:text-4xl">
              Benefits for patients and hospitals
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#4b4f70]">
              What changes day to day when Vitalyn runs alongside routine care.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 perspective-[1600px]">
            {[
              {
                title: "Fewer surprises",
                desc: "Deterioration is flagged earlier and more consistently, so high-risk post-op patients are seen sooner.",
              },
              {
                title: "Fairer queues",
                desc: "OPD and follow-up scheduling can reflect medical urgency instead of only appointment order.",
              },
              {
                title: "Less burnout",
                desc: "Teams see a prioritized view of patients instead of hunting through scattered records and lists.",
              },
            ].map((benefit) => (
              <Card
                key={benefit.title}
                className="feature-card relative bg-[#ffffff] border-[2px] border-[#111322] rounded-xl shadow-[4px_4px_0_0_#111322] transition-all duration-500 hover:-translate-y-2"
                style={{ transformStyle: "preserve-3d", transformOrigin: "center center" }}
              >
                <CardHeader className="relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 opacity-0 feature-glow" />
                  <CardTitle className="text-[#111322]">{benefit.title}</CardTitle>
                  <CardDescription className="text-[#4b4f70] mt-2">
                    {benefit.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-r from-[#3a3e61] via-[#4a4f74] to-[#f1ede2] px-6 py-16 shadow-2xl sm:px-16 lg:flex lg:gap-x-20 lg:px-24">
          <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-8 lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-[#f1ede2] sm:text-4xl">
              Ready to transform healthcare?
              <br />
              Start using Vitalyn today.
            </h2>
            <p className="mt-6 text-lg leading-8 text-[#f1ede2]/80">
              Join the network of forward-thinking hospitals and empower your patients with the future of recovery monitoring.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
              <Link to="/login">
                <Button size="lg" className="bg-gradient-to-r from-[#f1ede2] to-[#e0d9c9] hover:from-[#ffffff] hover:to-[#f1ede2] text-[#3a3e61]">
                  Get Started
                </Button>
              </Link>
              <Link to="/patient">
                <Button size="lg" variant="outline" className="border-[#f1ede2]/70 bg-transparent text-[#f1ede2] hover:bg-[#f1ede2]/10 hover:text-[#3a3e61] backdrop-blur-sm">
                  View Patient Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 bg-gradient-to-r from-[#3a3e61] via-[#4a4f74] to-[#3a3e61] border-t border-[#f1ede2]/20 text-[#f1ede2]/80 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4 max-w-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f1ede2]/25 bg-[#161827]/60 px-3 py-1 text-xs tracking-wide">
              <BrainCircuit className="h-4 w-4 text-[#f1ede2]" />
              <span className="uppercase text-[0.7rem] text-[#f1ede2]/80 tracking-[0.18em]">
                Multimodal Care Engine
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#f1ede2]">Vitalyn</span>
            </div>
            <p className="text-sm text-[#f1ede2]/75">
              Real-time post-op risk radar that watches vitals, face and voice to keep
              clinicians a step ahead of deterioration.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-3">
            <div className="space-y-3">
              <h3 className="font-semibold text-[#f1ede2] text-xs tracking-[0.18em] uppercase">
                Product
              </h3>
              <button className="text-left text-[#f1ede2]/75 hover:text-white transition-colors">
                Post-op Monitoring
              </button>
              <button className="text-left text-[#f1ede2]/75 hover:text-white transition-colors">
                Patient App
              </button>
              <button className="text-left text-[#f1ede2]/75 hover:text-white transition-colors">
                Clinician Console
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-[#f1ede2] text-xs tracking-[0.18em] uppercase">
                Technology
              </h3>
              <button className="text-left text-[#f1ede2]/75 hover:text-white transition-colors">
                Multimodal AI
              </button>
              <button className="text-left text-[#f1ede2]/75 hover:text-white transition-colors">
                Time-to-Risk Engine
              </button>
              <button className="text-left text-[#f1ede2]/75 hover:text-white transition-colors">
                EHR Integration
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-[#f1ede2] text-xs tracking-[0.18em] uppercase">
                For Hospitals
              </h3>
              <button className="text-left text-[#f1ede2]/75 hover:text-white transition-colors">
                ICU Step-down
              </button>
              <button className="text-left text-[#f1ede2]/75 hover:text-white transition-colors">
                Surgical Wards
              </button>
              <button className="text-left text-[#f1ede2]/75 hover:text-white transition-colors">
                Recovery at Home
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-[#f1ede2]/20 pt-4">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center justify-between gap-3 text-xs text-[#f1ede2]/60 md:flex-row">
            <p>&copy; 2024 Vitalyn. Built for healthcare innovation.</p>
            <div className="flex gap-4">
              <span className="hover:text-[#f1ede2]/90 cursor-pointer transition-colors">
                Privacy
              </span>
              <span className="hover:text-[#f1ede2]/90 cursor-pointer transition-colors">
                Terms
              </span>
              <span className="hover:text-[#f1ede2]/90 cursor-pointer transition-colors">
                Contact
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
