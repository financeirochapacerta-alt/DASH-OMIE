import Image from "next/image";
import Link from "next/link";
export default function NotFound(){return <main className="auth-state"><section className="login-panel"><Image className="brand-mark" src="/branding/logo-chapa-certa-fundo-claro.png" alt="Chapa Certa" width={65} height={68} /><p className="eyebrow">ACESSO INDISPONÍVEL</p><h1>Página não encontrada</h1><p>O conteúdo não existe ou não está disponível para seu perfil.</p><Link className="primary-button inline-button" href="/">Voltar à visão geral</Link></section></main>}
