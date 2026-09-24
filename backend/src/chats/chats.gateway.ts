import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatsService } from './chats.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatsGateway');

  constructor(
    private jwtService: JwtService,
    private chatsService: ChatsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      this.logger.log(`Cliente ligado: ${client.userId}`);
    } catch {
      this.logger.warn('Ligação rejeitada: token inválido.');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Cliente desligado: ${client.userId}`);
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ) {
    client.join(data.chatId);
    return { event: 'joinedChat', chatId: data.chatId };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { chatId: string; content: string; type?: 'TEXTO' | 'IMAGEM' | 'LOCALIZACAO' | 'LINK' },
  ) {
    if (!client.userId) return;

    const message = await this.chatsService.sendMessage(
      data.chatId,
      client.userId,
      data.content,
      data.type ?? 'TEXTO',
    );

    this.server.to(data.chatId).emit('newMessage', message);

    return message;
  }
}