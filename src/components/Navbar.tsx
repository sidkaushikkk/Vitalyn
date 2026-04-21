import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrainCircuit } from "lucide-react";
import gsap from "gsap";

export function Navbar() {
  const navRef = useRef<HTMLElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const linksRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!navRef.current) return;

    const ctx = gsap.context(() => {
      if (navRef.current) {
        gsap.fromTo(
          navRef.current,
          { y: -40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        );
      }

      if (logoRef.current) {
        gsap.fromTo(
          logoRef.current,
          { x: -24, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.7, delay: 0.2, ease: "power3.out" }
        );
      }

      if (linksRef.current) {
        gsap.fromTo(
          linksRef.current.children,
          { y: 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            delay: 0.3,
            ease: "power2.out",
            stagger: 0.05,
          }
        );
      }

      if (actionsRef.current) {
        gsap.fromTo(
          actionsRef.current.children,
          { y: 10, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            delay: 0.35,
            ease: "power2.out",
            stagger: 0.08,
          }
        );
      }
    }, navRef);

    return () => ctx.revert();
  }, []);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 w-full z-50 bg-[#fdfbf6]/95 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div
            ref={logoRef}
            className="inline-flex items-stretch border-[2px] border-[#111322] bg-[#111322] shadow-[4px_4px_0_0_#111322]"
          >
            <div className="flex h-20 w-20 items-center justify-center bg-[#ffffff] border-r-[2px] border-[#111322] overflow-hidden">
              <img
                src="/vitalyn.png"
                alt="Vitalyn logo"
                className="h-20 w-20 object-contain transform scale-150"
              />
            </div>
            <div className="flex items-center bg-[#3a3e61] px-6">
              <span className="text-xs sm:text-sm font-black uppercase tracking-[0.32em] text-[#fdfbf6]">
                Vitalyn
              </span>
            </div>
          </div>

          <div
            ref={linksRef}
            className="hidden md:flex items-center gap-6 text-xs font-medium tracking-wide"
          >
            <Link
              to="/"
              className="text-[#3a3e61]/80 hover:text-[#111322] transition-colors uppercase tracking-[0.18em]"
            >
              Overview
            </Link>
            <Link
              to="/post-op"
              className="text-[#3a3e61]/80 hover:text-[#111322] transition-colors uppercase tracking-[0.18em]"
            >
              Post-op
            </Link>
            <Link
              to="/opd-queue"
              className="text-[#3a3e61]/80 hover:text-[#111322] transition-colors uppercase tracking-[0.18em]"
            >
              CareQueue
            </Link>
            <Link
              to="/alerts"
              className="text-[#3a3e61]/80 hover:text-[#111322] transition-colors uppercase tracking-[0.18em]"
            >
              Alerts
            </Link>
            <Link
              to="/reports"
              className="text-[#3a3e61]/80 hover:text-[#111322] transition-colors uppercase tracking-[0.18em]"
            >
              Reports
            </Link>
          </div>

          <div ref={actionsRef} className="flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="ghost"
                className="hidden sm:inline-flex text-[#111322] bg-[#fdfbf6] border-[2px] border-[#111322] rounded-none px-4 py-2 shadow-[3px_3px_0_0_#111322] hover:bg-[#f1ede2] hover:text-[#111322]"
              >
                Sign in
              </Button>
            </Link>
            <Link to="/login">
              <Button className="bg-[#f97373] hover:bg-[#ff8a8a] text-[#111322] border-[2px] border-[#111322] rounded-none px-5 py-2 text-sm font-semibold shadow-[3px_3px_0_0_#111322]">
                Launch Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
