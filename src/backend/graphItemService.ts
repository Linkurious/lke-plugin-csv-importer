
import {RestClient} from '@linkurious/rest-client';
import {GroupedErrors, InvalidParameter, parseCSV, RowErrorMessage} from './utils';
import {ImportEdgesParams, ImportItemsResponse, ImportNodesParams} from '../@types/shared';

export class GraphItemService {
  public static async importGraphItems(
    params: ImportNodesParams | ImportEdgesParams,
    rc: RestClient,
    isEdge: boolean
  ): Promise<ImportItemsResponse> {
    const csv = parseCSV(params.csv);
    const headers = GraphItemService.checkNonEmptyHeaders(csv);

    // A map to group the common errors
    const errors = new GroupedErrors();

    let i = 0;
    for (const rowValues of csv) {
      i++;
      try {
        // Merge headers with rowValues
        const properties = GraphItemService.buildProperties(headers, rowValues, isEdge);

        let response;
        if (isEdge) {
          // Import an edge
          const {sourceKey, itemType, sourceType, destinationType} = params as ImportEdgesParams;
          response = await rc.graphEdge.createEdge({
            sourceKey: sourceKey,
            type: itemType,
            properties: properties,
            source: await GraphItemService.getNodeID(rc, sourceKey, sourceType, rowValues[0]),
            target: await GraphItemService.getNodeID(rc, sourceKey, destinationType, rowValues[1])
          });
        } else {
          // Import a node
          response = await rc.graphNode.createNode({
            sourceKey: params.sourceKey,
            categories: [params.itemType],
            properties: properties
          });
        }

        console.log({response});
        if (!response.isSuccess()) {
          errors.add(response, i);
        }
      } catch (e) {
        console.log({e});
        errors.add(e.message, i);
      }
    }

    return {
      success: i - errors.total,
      failed: errors.total,
      error: errors.toString()
    };
  }

  /**
   * Check that the first line of the csv is not empty
   */
  private static checkNonEmptyHeaders(csv: Generator<string[]>): string[] {
    const headers = csv.next().value;
    if (
      !Array.isArray(headers) ||
      headers.length === 0 ||
      headers.some((h) => typeof h !== 'string' || h.length === 0)
    ) {
      throw new InvalidParameter('Headers cannot be empty');
    }
    return headers;
    // TODO check missing required properties (schemas) and unexpected properties (strict-schema)
  }

  /**
   * Merge headers array with the row values array.
   */
  private static buildProperties(
    headers: string[],
    rowValues: string[],
    isEdge: boolean
  ): Record<string, string> {
    // There should not be more values than headers
    if (rowValues.length > headers.length) {
      console.log({rowValues, headers});
      throw new Error(RowErrorMessage.TOO_MANY_VALUES);
    }
    const properties: Record<string, string> = {};
    // First two values of an edge are the source and the target
    for (let j = isEdge ? 2 : 0; j < rowValues.length; j++) {
      const value = rowValues[j].trim();
      // Valid properties are only non-empty values
      if (value.length !== 0) {
        properties[headers[j]] = value;
      }
    }
    return properties;
  }

  /**
   * Return the graph ID of a node given its uid and category
   */
  private static async getNodeID(
    rc: RestClient,
    sourceKey: string,
    category: string,
    uid: string | undefined
  ): Promise<string> {
    // TODO we can cache the nodes on creation and get them here
    if (!uid) {
      throw new Error(RowErrorMessage.SOURCE_TARGET_NOT_FOUND);
    }
    const query = `MATCH (n:\`${category}\`) WHERE n.UID = "${uid}" return n limit 1`; // TODO escape properly
    try {
      const res = await rc.graphQuery.runQuery({
        sourceKey: sourceKey,
        query: query
      });
      if (res.isSuccess() && res.body.nodes.length > 0) {
        return res.body.nodes[0].id;
      }
      console.log(query, res.body);
      throw new Error(RowErrorMessage.SOURCE_TARGET_NOT_FOUND);
    } catch (e) {
      console.log(query, e);
      throw new Error(RowErrorMessage.SOURCE_TARGET_NOT_FOUND);
    }
  }
}
