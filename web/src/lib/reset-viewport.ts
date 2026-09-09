// Utilitário de reset de visual viewport para Safari iOS / PWA.
//
// CAUSA DO BUG:
// O Leaflet usa touch-action:none e transições CSS com transform/scale
// internamente durante zoom e pan. No Safari iOS (e Chrome Android em
// menor grau), após um gesto de pinch-zoom numa área touch-action:none,
// o "visual viewport" do browser pode ficar preso numa escala diferente
// de 1 mesmo com user-scalable=no no <meta viewport>.
//
// Este estado de zoom é global ao WebKit — não está scoped ao componente
// React. Persiste através de navegações client-side (router.push) porque
// o Next.js App Router não faz reload real do browser: desmonta/monta
// componentes React no mesmo contexto WebKit.
//
// O ViewportGuard (em layout.tsx) trata a saída de /map, mas o logout
// pode acontecer a partir de QUALQUER página (o utilizador vai ao mapa,
// volta para /home, depois faz logout em /home). Nesse caso
// wasOnMapRef.current já é false e o guard não actua.
//
// SOLUÇÃO:
// Chamar resetViewport() directamente nos handlers de logout, antes do
// router.push. É síncrono, barato e idempotente — não tem efeito
// nenhum se o viewport já estiver em escala 1.
//
// A modificação é feita in-place no atributo content do <meta viewport>
// existente, sem remover o nó DOM — o Next.js App Router mantém
// referência a esse nó e lançaria "Cannot read properties of null
// (reading 'removeChild')" se o nó fosse removido.

export function resetViewport(): void {
  if (typeof window === 'undefined') return;

  try {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute(
        'content',
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      );
    }
  } catch {
    // Silencioso — falha improvável mas não deve quebrar o logout.
  }

  try {
    window.scrollTo(0, 0);
  } catch {
    // Silencioso.
  }
}