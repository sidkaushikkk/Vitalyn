import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { API_BASE } from "@/hooks/useApiQuery";
import gsap from "gsap";

type Role = "patient" | "doctor";

export default function Login() {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLDivElement | null>(null);

  const [role, setRole] = useState<Role>("patient");
  const [email, setEmail] = useState("patient123@gmail.com");
  const [password, setPassword] = useState("patient123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!pageRef.current || !cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        pageRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" }
      );

      gsap.fromTo(
        cardRef.current,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.15 }
      );

      if (toggleRef.current) {
        gsap.fromTo(
          toggleRef.current,
          { x: -16, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.3 }
        );
      }
    }, pageRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    if (nextRole === "patient") {
      setEmail("patient123@gmail.com");
      setPassword("patient123");
    } else {
      setEmail("doctor123@gmail.com");
      setPassword("doctor123");
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Unable to log in");
        setLoading(false);
        return;
      }

      const user = {
        email: data.email,
        role: data.role as Role,
      };

      try {
        window.localStorage.setItem("vitalynUser", JSON.stringify(user));
      } catch {
      }

      if (user.role === "patient") {
        navigate("/patient");
      } else {
        navigate("/opd-queue");
      }
    } catch (err) {
      setError("Network error while contacting Vitalyn API");
      setLoading(false);
    }
  };

  return (
    <div
      ref={pageRef}
      className="relative z-10 min-h-screen flex flex-col bg-[#fdfbf6] text-[#111322]"
    >
      <Navbar />
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <Card
          ref={cardRef}
          className="w-full max-w-md bg-[#ffffff] border-[#e1d8c7] shadow-xl sm:rounded-3xl"
        >
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#111322]">Sign in to Vitalyn</CardTitle>
            <CardDescription className="text-[#4b4f70]">
              Use the demo accounts to experience the patient and doctor journeys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={toggleRef}
              className="mb-6 flex rounded-full bg-[#f1ede2] p-1"
            >
              <button
                type="button"
                onClick={() => handleRoleChange("patient")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  role === "patient"
                    ? "bg-[#3a3e61] text-[#f1ede2]"
                    : "text-[#3a3e61]/80 hover:text-[#111322]"
                }`}
              >
                Patient
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("doctor")}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  role === "doctor"
                    ? "bg-[#3a3e61] text-[#f1ede2]"
                    : "text-[#3a3e61]/80 hover:text-[#111322]"
                }`}
              >
                Doctor
              </button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#111322]">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#fdfbf6] border-[#e1d8c7] text-[#111322] placeholder:text-[#9a9fb3]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#111322]">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#fdfbf6] border-[#e1d8c7] text-[#111322] placeholder:text-[#9a9fb3]"
                />
              </div>
              {error && (
                <div className="rounded-md border border-rose-300/60 bg-rose-500/15 px-3 py-2 text-sm text-rose-50">
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-[#111322] hover:bg-[#1f2238] text-[#fdfbf6] font-semibold"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <p className="mt-2 text-xs text-[#4b4f70]">
                Demo credentials: patient123@gmail.com / patient123 or doctor123@gmail.com / doctor123
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
