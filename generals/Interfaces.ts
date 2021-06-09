export namespace Generals {
    export interface ILogWriter {
        sendError(exception: any, message: string): Promise<void>
        add(message: string, params?: any)
        save(): Promise<void>
        setContainer(container_name: string) : void
    }

    export interface IFileHandler {
        getFileContent(): Promise<any>
        saveToFile(content: string): void
    }

    export enum AmocrmEntityGroup {
        customers = 'customers',
        leads = 'leads',
        contacts = 'contacts',
        companies = 'companies',
    }

    export enum EntityGroup {
        customers = 1,
        leads = 2,
        contacts = 3,
        companies = 4,
        constants = 5,
    }

    export function getEntityGroups(): EntityGroup[] {
        return [
            EntityGroup.customers,
            EntityGroup.leads,
            EntityGroup.contacts,
            EntityGroup.companies,
            EntityGroup.constants,
        ]
    }

    export interface IStatus {
        readonly status_id: number
        readonly pipeline_id: number
    }

    function isEntityField(pragmaFieldName: FieldName): boolean {
        switch (pragmaFieldName){
            case FieldName.date_update:
            case FieldName.date_create:
            case FieldName.title:
            case FieldName.costs:
            case FieldName.price:
            case FieldName.deleted:
                return true
            default:
                return false
        }
    }

    export enum FieldName {
        price = 'price',
        costs = 'costs',
        title = 'title',
        date_create = 'date_create',
        date_update = 'date_update',
        deleted = 'deleted',

        status_id = 'pragma_status_id',
        responsible_user_id = 'pragma_responsible_user_id',
        pipeline_id = 'pragma_pipeline_id',
    }

    export enum FieldType {
        date = 'date',
        enums = 'enums',
        float = 'float',
        multienums = 'multienums',
        string = 'string',
        unknown = 'unknown',

        user_id = 'user_id',
        status_id = 'status_id',
        pipeline_id = 'pipeline_id',
    }

    export interface ITimeInterval {
        readonly start: number
        readonly end: number
    }
}