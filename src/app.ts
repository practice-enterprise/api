import { setSofa, Sofa, sofa } from './services/sofa';
import Express from 'express';
import { applyRoutes } from './routes';

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV == null) {
  require('dotenv').config();
}

(async () => {
  setSofa(new Sofa(process.env.COUCHDB || 'http://admin:admin@localhost:5984'));
  await sofa.doMigrations();
  
  const app = applyRoutes(Express());
  app.listen(process.env.PORT || 3000, () => {
    console.log(`listening on localhost:${process.env.PORT || 3000}`);
  });
})();
