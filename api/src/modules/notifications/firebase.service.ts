import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn('Firebase não configurado — push notifications desactivadas.');
      return;
    }

    try {
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
          }),
        });
        this.logger.log('Firebase Admin SDK inicializado.');
      } else {
        this.app = admin.apps[0]!;
      }
    } catch (e) {
      this.logger.error('Erro ao inicializar Firebase:', e);
    }
  }

  async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.app) return false;
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: data ?? {},
        webpush: {
          notification: {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            requireInteraction: false,
          },
          fcmOptions: { link: data?.actionUrl ?? '/' },
        },
        android: {
          notification: { title, body, priority: 'high' },
          priority: 'high',
        },
        apns: {
          payload: { aps: { alert: { title, body }, badge: 1, sound: 'default' } },
        },
      });
      return true;
    } catch (e: any) {
      this.logger.error(`Falha ao enviar push para token ${token.slice(0, 20)}...: ${e.message}`);
      return false;
    }
  }

  async sendToMultiple(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ success: number; failure: number }> {
    if (!this.app || tokens.length === 0) return { success: 0, failure: 0 };
    const results = await Promise.allSettled(
      tokens.map(t => this.sendToToken(t, title, body, data))
    );
    const success = results.filter(r => r.status === 'fulfilled' && r.value).length;
    return { success, failure: tokens.length - success };
  }
}