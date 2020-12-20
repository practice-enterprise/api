import { Subscription, timer } from 'rxjs';
import { Logger } from '../util/logger';
import { v4 as uuidv4 } from 'uuid';
import { getEpoch } from '../util';
export type Shard = { shard: number, health: number, lastHeartbeat: number, state: 'pending' | 'running' | 'bad' };

const MAX_HEALTH = 3;

export class ShardMesh {
  targetShards: number;
  shards: Record<string, Shard>;

  constructor() {
    this.targetShards = Number.parseInt(process.env.TARGET_SHARDS || '1') || 1;
    this.shards = {};
    this.healthValidator();
    Logger.info('initialized mesh');
  }

  healthValidator(): void {
    timer(0, 15000).subscribe(() => {
      for (const shardId in this.shards) {
        const shard = this.shards[shardId];
        if (shard.state == 'bad') {
          this.remove(shardId);
          continue;
        }

        if (shard.lastHeartbeat < getEpoch() - 15) {
          shard.health -= 1;
          Logger.warn(`Did not receive heartbeat from shard(${shard.shard}:${shardId}), health: ${shard.health}`);

          if (shard.health <= 0) {
            Logger.crit(`shard(${shard.shard}:${shardId}) health reached zero, marking as bad`);
            shard.state = 'bad';
          }
        }
      }
    });
  }

  register(): { id: string, shard: number } | undefined {
    const shard = this.missingShards()[0];
    if (shard != null) {
      const id = uuidv4();
      Logger.info(`Registered new shard(${shard}) with id ${id}`);
      this.shards[id] = { shard, health: MAX_HEALTH, lastHeartbeat: getEpoch(), state: 'pending' };
      return { id, shard: this.shards[id].shard };
    }

    return undefined;
  }

  remove(id: string): void {
    Logger.info(`removing shard with id ${id} from mesh`);
    delete this.shards[id];
  }

  missingShards(): number[] {
    return [...Array(this.targetShards).keys()]
      .filter((i) => Object.keys(this.shards)
        .map((id) => this.shards[id].shard)
        .indexOf(i) === -1
      );
  }

  heartbeat(id: string): 204 | 426 | 404 {
    const shard = this.shards[id];
    if (shard) {
      if (shard.state == 'pending') {
        shard.state = 'running';
      } else if (shard.state == 'bad') {
        // notify client that connection was marked as bad and remove connection
        this.remove(id);
        return 426;
      }

      shard.lastHeartbeat = getEpoch();
      shard.health = Math.min(shard.health + 1, MAX_HEALTH);
      return 204;
    }

    // notify client that connection was not found
    // likely due to prolonged connection loss
    return 404;
  }
}

export function initMesh(): void {
  Mesh = new ShardMesh();
}

export let Mesh: ShardMesh;
