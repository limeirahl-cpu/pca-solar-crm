"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { COMPANY, COMPANY_ADDRESS_FULL } from "@/lib/company";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("Email ou senha inválidos.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-sidebar px-12 py-12 text-sidebar-foreground lg:flex">
        <div className="relative h-10 w-10">
          <Image src="/logo-pca.png" alt="PCA Solar" fill sizes="40px" className="object-contain object-left" />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="relative h-80 w-[213px] drop-shadow-2xl">
            <Image
              src="/mascote-pca.png"
              alt="Mascote PCA Solar"
              fill
              sizes="213px"
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="max-w-sm">
          <p className="text-2xl font-display font-bold leading-tight">
            Bem-vindo ao sistema da <span className="text-primary">PCA Solar</span>
          </p>
          <p className="mt-2 text-sm text-sidebar-foreground/70">{COMPANY.tagline}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center lg:hidden">
            <div className="relative mx-auto h-14 w-14">
              <Image src="/logo-pca.png" alt="PCA Solar" fill sizes="56px" className="object-contain" />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-foreground">Acessar o sistema</h2>
          <p className="mb-6 text-sm text-muted">Use seu e-mail e senha de acesso.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@pcasolar.com.br"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted">
            {COMPANY.phone} · {COMPANY.email}
            <br />
            {COMPANY_ADDRESS_FULL}
          </p>
        </div>
      </div>
    </div>
  );
}
