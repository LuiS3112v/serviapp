"use client";

import { useEffect } from "react";

// O Render no plano gratuito adormece o serviço após ~15 minutos sem
// pedidos. Quando isso acontece, o primeiro pedido real (login, criar
// serviço, etc.) pode demorar 5–15 segundos só para acordar o servidor
// — o utilizador sente o botão como "morto" ou muito lento, mesmo que
// o frontend esteja a funcionar normalmente.
//
// Este componente pinga o endpoint raiz do backend (GET /) a cada
// 4 minutos enquanto a app está aberta no browser/PWA, mantendo o
// servidor acordado sem custo. 4 minutos é deliberado: suficientemente
// frequente para nunca deixar o Render adormecer (limite: ~15 min),
// mas não tão frequente a ponto de gastar o limite de horas gratuitas
// do plano (750h/mês — 1 pedido/4min = ~11.000 pedidos/mês, cada um
// em <50ms de CPU, bem dentro do limite).
//
// O ping usa fetch com keepalive:false e ignora a resposta — se o
// backend estiver down, falha silenciosamente sem afectar nada.
// Se a tab for fechada ou o utilizador sair, o interval é limpo.

const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutos

async function pingBackend(): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return;

  // Pinga o endpoint raiz (GET /) — existe em app.controller.ts e
  // não requer autenticação. Usamos a base do URL sem o sufixo /api
  // porque o controller raiz está em /, não em /api.
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");

  try {
    await fetch(baseUrl, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5000), // desiste se demorar mais de 5s
    });
  } catch {
    // falha silenciosa — o objectivo é manter o servidor acordado,
    // não obter uma resposta; se o ping falhar, o próximo tentará.
  }
}

export function KeepAlive() {
  useEffect(() => {
    // Pinga imediatamente ao montar (ao abrir a app), para acordar o
    // servidor logo que o utilizador abre a página — antes de qualquer
    // acção que precise de backend.
    pingBackend();

    const interval = setInterval(pingBackend, PING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  return null;
}