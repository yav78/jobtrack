export interface CrudServiceInterface {

    getAll(): Promise<any>;
    getById(id: string): Promise<any>;
    create(data: any): Promise<any>;
    update(id: string, data: any): Promise<any>;
    delete(id: string): Promise<any>;
    
}
