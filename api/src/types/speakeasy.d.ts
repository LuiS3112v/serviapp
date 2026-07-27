declare module 'speakeasy' {
  export interface GeneratedSecret {
    ascii: string;
    hex: string;
    base32: string;
    otpauth_url?: string;
  }

  export function generateSecret(options?: { name?: string; length?: number }): GeneratedSecret;

  export namespace totp {
    function verify(options: {
      secret: string;
      encoding: 'base32' | 'ascii' | 'hex';
      token: string;
      window?: number;
    }): boolean;
  }
}