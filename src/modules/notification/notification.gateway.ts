import { Inject, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import jwtConfig from '../../config/jwt.config';

/**
 * WebSocket gateway untuk notifikasi real-time. Detail internal modul
 * Notification — modul lain tetap cukup pakai NotificationContract.
 * Klien connect dengan JWT (auth.token); di-join ke room `user:<id>`.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);
      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: this.jwtCfg.accessSecret,
      });
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  /** Kirim event 'notification' ke room user tertentu. */
  sendToUser(userId: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit('notification', payload);
  }
}
