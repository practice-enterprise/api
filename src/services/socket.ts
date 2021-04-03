import { Server, Socket } from 'socket.io';
import { getShardId } from '../util';
import { Logger } from '../util/logger';

interface Shard {
  socket: Socket,
  number?: number,
}

enum OpCode {
  reconnect,
  disconnect,
}

export class SocketManager {
  shards: Shard[] = [];
  targetShards: number = 1;

  constructor(public server: Server) {
    Logger.debug('initializing shard manager');
    server.on('connection', socket => {
      Logger.info(`new shard with ID ${socket.id} connected`);
      const shard = { socket };
      this.shards.push(shard);
      this.initializeSocket(shard);
      this.evaluateState();
    });
  }

  private initializeSocket(shard: Shard): void {
    shard.socket.on('disconnecting', (reason) => {
      Logger.warn(`shard with number ${shard.number || '(not assigned)'} is disconnecting due to: ${reason}`);
      const index = this.shards.indexOf(shard);
      if (index > -1) {
        this.shards.splice(index, 1);
      }
      this.evaluateState();
    })
  }

  private evaluateState(): void {
    // TODO: only reassign shards when there are meaningfull changes
    this.targetShards = this.shards.length;
    this.reassignShards();
  }

  private reassignShards(): void {
    Logger.info(`reassigning shards to new target of ${this.targetShards} shards`);
    let index = 0;
    const total = this.shards.length;
    if (total == 0) {
      Logger.warn('No shards available');
    }
    for (const shard of this.shards) {
      shard.socket.emit('system', JSON.stringify({ opcode: OpCode.reconnect, data: { number: index, total } }));
      shard.number = index;
      index++;
    }
  }

  sendForGuild(guild: string, event: string, message: any): void {
    const shard = getShardId(guild, this.targetShards);
    this.shards.find(s => s.number == shard)?.socket.send(event, message);
  }

  sendAll(event: string, message: any): void {
    this.server.emit(event, message);
  }
}