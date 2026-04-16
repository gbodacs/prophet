export interface OperationRecord {
  id: string;
  baseName: string;
  token: string;
  csvFileName: string;
  csvPath: string;
  pngFileNames: string[];
  pngPaths: string[];
  createdAt: string;
}

export interface OperationsDb {
  operations: OperationRecord[];
}
