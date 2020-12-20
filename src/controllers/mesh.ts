import { Router } from 'express';
import { Mesh } from '../services/mesh';

export class MeshController {
  static router(): Router {
    return Router({ caseSensitive: true })
      .get('/', (req, res, next) => {
        const shard = Mesh.register();
        if (shard) {
          res.send({ shardCount: Mesh.targetShards, ...shard});
        } else {
          res.sendStatus(204);
        }
        next();
      })
      .get('/status', (req, res, next) => {
        const shards: any[] = [];
        for (const id in Mesh.shards) {
          shards.push({ id, ...Mesh.shards[id]});
        }
        res.send(shards);
      })
      .get('/:id', (req, res, next) => {
        res.sendStatus(Mesh.heartbeat(req.params.id));
        next();
      })
      .delete('/:id', (req, res, next) => {
        Mesh.remove(req.params.id);
        res.sendStatus(200);
      });
  }
}
