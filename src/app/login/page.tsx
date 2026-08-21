import Image from "next/image";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="auth-state">
      <section className="login-panel" aria-labelledby="login-title">
        <Image className="brand-mark" src="/branding/logo-chapa-certa-fundo-claro.png" alt="Chapa Certa" width={65} height={68} priority />
        <h1 id="login-title" className="login-title">Central de Gestão</h1>
        <p className="status">Acesso restrito à equipe</p>
        <LoginForm />
      </section>
    </main>
  );
}
