import {Request, Response} from 'express';
import {LkErrorKey} from '@linkurious/rest-client';

export function log(...messages: unknown[]): void {
  console.log(
    `${new Date().toISOString()} ${messages
      .map((message) => JSON.stringify(message, null, 2))
      .join(' ')}`
  );
}

export enum RowErrorMessage {
  TOO_MANY_OR_MISSING_PROPERTIES = 'There are not as many properties as headers',
  SOURCE_TARGET_NOT_FOUND = 'Source or target node not found',
  DATA_SOURCE_UNAVAILABLE = 'Data-source is not available',
  UNAUTHORIZED = 'You are not logged in',
  UNEXPECTED = 'Unexpected error, check the logs'
}

export class GroupedErrors extends Map<RowErrorMessage, number[]> {
  public static validKeys = new Set(Object.values(RowErrorMessage));

  constructor(entries?: [RowErrorMessage, number[]][]) {
    super();
    entries?.forEach(([error, rows]) => rows.forEach((row) => this.add(error, row)));
  }

  public total = 0;
  public add(error: unknown, rowNumbers: number | number[]) {
    const errorKey = GroupedErrors.simplifyErrorMessage(error);
    let entry = this.get(errorKey);
    if (entry === undefined) {
      entry = [];
      this.set(errorKey, entry);
    }
    if (typeof rowNumbers === 'number') {
      rowNumbers = [rowNumbers];
    }
    for (let i = 0; i < rowNumbers.length; i++) {
      entry.push(rowNumbers[i]);
      this.total++;
    }
  }

  public toObject() {
    const obj: Record<string, string[]> = {};
    for (const [a, b] of this) {
      b.sort((a, b) => a - b);
      const readableRows: string[] = [];
      let last: number | [number, number] | null = null;
      for (const row of b) {
        // Convert row to row range
        if (typeof last === 'number' && last === row - 1) {
          last = [last, row];
          readableRows[readableRows.length - 1] = `${last[0]}~${last[1]}`;
          continue;
        }
        // Expand range
        if (Array.isArray(last) && last[1] === row - 1) {
          last[1] = row;
          readableRows[readableRows.length - 1] = `${last[0]}~${last[1]}`;
          continue;
        }
        // Add single row
        readableRows.push(row + '');
        last = row;
      }
      obj[a] = readableRows;
    }
    return obj;
  }

  private static simplifyErrorMessage(error: unknown): RowErrorMessage {
    if (GroupedErrors.validKeys.has(error as RowErrorMessage)) {
      return error as RowErrorMessage;
    }

    // @ts-ignore
    if (error.body?.key === LkErrorKey.DATA_SOURCE_UNAVAILABLE) {
      return RowErrorMessage.DATA_SOURCE_UNAVAILABLE;
    }
    // @ts-ignore
    if (error.body?.key === LkErrorKey.UNAUTHORIZED) {
      return RowErrorMessage.UNAUTHORIZED;
    }

    return RowErrorMessage.UNEXPECTED;
  }
}

export function respond(asyncHandler: (req: Request) => Promise<{[k: string]: unknown} | void>) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const body = await asyncHandler(req);
      if (body === undefined) {
        res.status(204);
        res.send();
      } else {
        res.status(200);
        res.json(body);
      }
    } catch (e) {
      log(e);
      // We don't really care about the status code
      res.status(400);
      res.json({
        success: 0
      });
    }
  };
}
