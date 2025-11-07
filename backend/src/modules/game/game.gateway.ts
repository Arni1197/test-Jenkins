import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { GameService } from './game.service';
  
  @WebSocketGateway({ cors: true })
  export class GameGateway {
    @WebSocketServer()
    server: Server;
  
    constructor(private readonly gameService: GameService) {}
  
    @SubscribeMessage('build')
    async handleBuild(
      @MessageBody() data: { userId: string; type: string },
      @ConnectedSocket() client: Socket,
    ) {
      try {
        const building = await this.gameService.buildBuilding(data.userId, data.type);
        client.emit('buildSuccess', building);
      } catch (err) {
        client.emit('buildError', err.message);
      }
    }
  
    @SubscribeMessage('attack')
    async handleAttack(
      @MessageBody() data: { attackerId: string; defenderId: string; damage: number },
      @ConnectedSocket() client: Socket,
    ) {
      try {
        const battle = await this.gameService.attackUser(data.attackerId, data.defenderId, data.damage);
        client.emit('attackSuccess', battle);
      } catch (err) {
        client.emit('attackError', err.message);
      }
    }
  }