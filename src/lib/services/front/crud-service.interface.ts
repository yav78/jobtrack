export interface CrudServiceInterface {
  getAll<T = unknown>(): Promise<T>;
  getById<T = unknown>(id: string): Promise<T>;
  create<T = unknown>(data: unknown): Promise<T>;
  update<T = unknown>(id: string, data: unknown): Promise<T>;
  delete<T = unknown>(id: string): Promise<T>;
}
