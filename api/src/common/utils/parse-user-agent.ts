// Parser mínimo e suficiente para o que a página de Segurança precisa
// mostrar (dispositivo + browser). Não usa nenhuma dependência externa
// de parsing de user-agent para não adicionar mais uma lib só para
// isto — cobre os casos comuns (Windows/Mac/Linux/Android/iPhone,
// Chrome/Firefox/Safari/Edge) com regras simples e legíveis.

export interface ParsedUserAgent {
  device: string;
  browser: string;
}

export function parseUserAgent(userAgent: string | undefined): ParsedUserAgent {
  if (!userAgent) {
    return { device: 'Dispositivo desconhecido', browser: 'Browser desconhecido' };
  }

  let device = 'Dispositivo desconhecido';
  if (/windows/i.test(userAgent)) device = 'Windows';
  else if (/iphone/i.test(userAgent)) device = 'iPhone';
  else if (/ipad/i.test(userAgent)) device = 'iPad';
  else if (/android/i.test(userAgent)) device = 'Android';
  else if (/macintosh|mac os/i.test(userAgent)) device = 'Mac';
  else if (/linux/i.test(userAgent)) device = 'Linux';

  let browser = 'Browser desconhecido';
  if (/edg\//i.test(userAgent)) browser = 'Edge';
  else if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) browser = 'Chrome';
  else if (/firefox\//i.test(userAgent)) browser = 'Firefox';
  else if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) browser = 'Safari';

  return { device, browser };
}

export function extractClientIp(request: { headers: Record<string, unknown>; ip?: string }): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return request.ip ?? 'IP desconhecido';
}