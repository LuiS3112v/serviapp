import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleIdentity {
  googleId: string;
  email: string;
  fullName: string;
  picture: string | null;
}

// Responsabilidade única: validar um ID token da Google contra os
// servidores da Google e devolver a identidade já verificada. Não
// mexe em sessões, JWT do Mestroo, nem base de dados — isso continua
// a ser tratado por AuthService, exactamente como login()/register()
// já fazem para o fluxo tradicional.
//
// A verificação usa apenas o Client ID (público) — nunca um secret.
// verifyIdToken confirma a assinatura, a audiência (audience) e a
// expiração do token, tudo do lado do servidor.
@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client;
  private readonly clientId: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    this.client = new OAuth2Client(this.clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
    let ticket;
    try {
      ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.clientId,
      });
    } catch {
      throw new UnauthorizedException('Token Google inválido ou expirado.');
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Não foi possível validar a identidade Google.');
    }

    if (!payload.email_verified) {
      throw new UnauthorizedException('O email desta conta Google não está verificado.');
    }

    return {
      googleId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      fullName: payload.name ?? payload.email.split('@')[0],
      picture: payload.picture ?? null,
    };
  }
}