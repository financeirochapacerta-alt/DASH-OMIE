"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <section className="error-state"><div>!</div><h1>Não foi possível carregar esta visão</h1><p>Os dados permanecem protegidos. Tente novamente em instantes.</p><button className="primary-button" onClick={reset}>Tentar novamente</button></section>}
