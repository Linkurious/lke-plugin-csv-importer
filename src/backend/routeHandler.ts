import bodyParser from 'body-parser';
import allSettled from "promise.allsettled";

import {PluginConfig, PluginRouteOptions} from '../@types/plugin';

export = function configureRoutes(options: PluginRouteOptions<PluginConfig>): void {
  options.router.use(bodyParser.json({limit: '100mb', extended: true} as any));

  options.router.get('/getSchema', async (req, res) => {
      try {
          const schemaResult = await options.getRestClient(req).graphSchema.getTypesWithAccess({
              entityType: req.query.entityType || 'node' as any,
              sourceKey: req.query.sourceKey as string
          });
          res.status(200);
          res.contentType('application/json');
          res.send(JSON.stringify(schemaResult));
      } catch (e) {
          res.status(412);
          res.send(JSON.stringify({status: 412, body: e}));
      }
  });

  options.router.post('/addNodes', async (req, res) => {
      try {
          if(!req.body || !req.body.nodes || !Array.isArray(req.body.nodes)) {
              throw new Error('Payload is empty.');
          }
          let nodesPromise: Promise<any>[] = [];
          req.body.nodes.forEach((node: any) => {
            console.log(node);
              if(!node || !node.categories || !node.properties) {
                  throw new Error('Node parameters are invalid or missing.');
              }
              nodesPromise.push(options.getRestClient(req).graphNode.createNode({
                  categories: node.categories,
                  properties: node.properties,
                  sourceKey: req.query.sourceKey as string
              }));
          });
          console.log(nodesPromise)
          let totalSuccessful = 0, totalFailed = 0;
          const results = await Promise.all(nodesPromise);
          console.log(results)
          // TODO:  add way to check if node was actually added
          totalSuccessful = results.length;
          totalFailed = results.length - totalSuccessful;

          res.status(200);
          res.contentType('application/json');
          res.send(JSON.stringify({total: req.body.nodes.length, success: totalSuccessful, failed: totalFailed,  message: "Nodes are imported."}));

      } catch (e) {
          res.status(412);
          res.send(JSON.stringify(e, Object.getOwnPropertyNames(e)));
      }
  });

  options.router.post('/addEdges', async (req, res) => {
      try {
          if(!req.body || !req.body.edges || !Array.isArray(req.body.edges)) {
              throw new Error('Payload is empty.');
          }
          let edgesPromise: Promise<any>[] = [];
          req.body.edges.forEach((query: string) => {
              edgesPromise.push(options.getRestClient(req).graphQuery.runQuery({
                  query,
                  sourceKey: req.query.sourceKey as string
              }));
          });
          let totalSuccessful = 0, totalFailed = 0;
          const results = await allSettled(edgesPromise);
          totalSuccessful = results.filter((promise: any) => promise.status === 'fulfilled' ).length;
          totalFailed = results.length - totalSuccessful;
          res.status(200);
          res.contentType('application/json');
          res.send(JSON.stringify({total: req.body.edges.length, success: totalSuccessful, failed: totalFailed,  message: "Edges are imported."}));
      } catch (e) {
          res.status(412);
          res.send(e.message);
      }
  });
};