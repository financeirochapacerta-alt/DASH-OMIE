import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="auth-state">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-placeholder" aria-hidden="true">CC</div>
        <p className="eyebrow">CHAPA CERTA</p>
        <h1 id="login-title" className="login-title">Central de Gestão</h1>
        <p className="status">Acesso restrito à equipe</p>
        <LoginForm />
      </section>
    </main>
  );
}
