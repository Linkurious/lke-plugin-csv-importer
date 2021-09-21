import {parse, ParseResult} from "papaparse";

export class CSVUtils {
  public static parseCSVFile(file: File | string): ParseResult<(string|number)[]> {
    return parse<(string | number)[]>(file, {
      delimiter: ",",
      escapeChar: '"',
      skipEmptyLines: false,
      dynamicTyping: true,
      header: false,
    });
  }

  /**
   * Returns one of:
   *   "No headers provided"
   *   "Header value is empty"
   *   "Missing values in records: 1, 5, 20"
   *   "Too many values in records: 1, 5, 20"
   */
  public static checkGlobalErrors(parseResult: ParseResult<(string|number)[]>): string | undefined {
    const headers = parseResult.data[0];
    // Empty line is parsed as ['null']
    if (headers.length === 1 && headers[0] === 'null') {
      return 'No headers provided';
    }
    // Ex: name,,surname
    if (headers.some(h => typeof h === 'string' && h.length === 0)) {
      return 'Header value is empty';
    }

    const missingValues: number[] = [];
    const tooManyValues: number[] = [];
    const expectedNumberOfValues = headers.length;
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      if (row.length < expectedNumberOfValues) {
        missingValues.push(i);
        continue;
      }
      if (row.length > expectedNumberOfValues) {
        tooManyValues.push(i);
      }
    }
    let error = '';
    if (missingValues.length > 0) {
      error = `Missing values in records: ${missingValues.join(', ')}`;
    }
    if (tooManyValues.length > 0) {
      if (error.length >= 0) {
        error += '<br>';
      }
      error += `Too many values in records: ${tooManyValues.join(', ')}`;
    }
    return error.length > 0 ? error : undefined;
  }
}
