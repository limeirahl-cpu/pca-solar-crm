"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
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
      {/* Painel de marca — troque o ícone abaixo pela imagem do mascote (public/mascote-pca.png)
          quando o arquivo for enviado: <img src="/mascote-pca.png" className="h-64 w-auto" /> */}
      <div className="relative hidden flex-1 flex-col justify-between bg-sidebar px-12 py-12 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-lg text-primary-foreground">
            ☀️
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            PCA<span className="text-primary"> SOLAR</span>
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex size-56 items-center justify-center rounded-full bg-white/5 text-8xl">
            ☀️
          </div>
        </div>

        <div className="max-w-sm">
          <p className="text-2xl font-bold leading-tight">
            Bem-vindo ao sistema da <span className="text-primary">PCA Solar</span>
          </p>
          <p className="mt-2 text-sm text-sidebar-foreground/70">{COMPANY.tagline}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl">
              ☀️
            </div>
            <h1 className="text-lg font-extrabold tracking-tight text-foreground">
              PCA<span className="text-primary"> SOLAR</span>
            </h1>
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
