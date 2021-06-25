import bodyParser from 'body-parser';

import {PluginConfig, PluginRouteOptions} from '../@types/plugin';
import {GraphItemParams} from './graphItemParams';
import {respond} from './utils';
import {Request} from 'express';
import {GraphItemService} from './graphItemService';

export = function configureRoutes(options: PluginRouteOptions<PluginConfig>): void {
  options.router.use(bodyParser.json({limit: '6mb', extended: true} as any));
  const graphItemService = new GraphItemService();
  options.router.post(
    '/importNodes',
    respond((req: Request) => {
      req.setTimeout(600000)
      const rc = options.getRestClient(req);
      const params = GraphItemParams.checkImportNodes(req);
      graphItemService.importGraphItems(params, rc, false);
      return Promise.resolve({message: 'import started'})
    })
  );

  options.router.post(
    '/importStatus',
    respond((req: Request) => {
      req.setTimeout(600000)
      return Promise.resolve(graphItemService.importResult);
    })
  );

  options.router.post(
    '/importEdges',
    respond((req: Request) => {
      req.setTimeout(600000)
      const rc = options.getRestClient(req);
      const params = GraphItemParams.checkImportEdges(req);
      graphItemService.importGraphItems(params, rc, false);
      return Promise.resolve({message: 'import started'})
    })
  );
};
