import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: isRegister ? "Cadastro" : "Login",
      description: "Funcionalidade conectará ao backend PHP (api/auth.php).",
    });
  };

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-8">
      <div className="w-full max-w-sm rounded-lg border border-border bg-gradient-card p-6 shadow-card">
        <h1 className="font-heading text-2xl font-bold text-center text-foreground mb-6">
          {isRegister ? "Cadastro" : "Entrar"}
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="userid" className="text-muted-foreground">Usuário</Label>
            <Input id="userid" placeholder="Seu userid" className="mt-1 bg-secondary border-border" />
          </div>
          <div>
            <Label htmlFor="password" className="text-muted-foreground">Senha</Label>
            <Input id="password" type="password" placeholder="••••••" className="mt-1 bg-secondary border-border" />
          </div>
          {isRegister && (
            <>
              <div>
                <Label htmlFor="password2" className="text-muted-foreground">Confirmar Senha</Label>
                <Input id="password2" type="password" placeholder="••••••" className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label htmlFor="email" className="text-muted-foreground">E-mail</Label>
                <Input id="email" type="email" placeholder="email@exemplo.com" className="mt-1 bg-secondary border-border" />
              </div>
            </>
          )}
          <Button type="submit" className="w-full bg-gold text-primary-foreground hover:bg-gold-light font-semibold">
            {isRegister ? "Criar Conta" : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isRegister ? "Já tem conta?" : "Não tem conta?"}{" "}
          <button onClick={() => setIsRegister(!isRegister)} className="text-gold hover:text-gold-light font-medium">
            {isRegister ? "Entrar" : "Cadastre-se"}
          </button>
        </p>
      </div>
    </div>
  );
}
