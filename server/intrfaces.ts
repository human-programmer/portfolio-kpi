export namespace IServer {
    export enum CrmName {
        amocrm = 'amocrm',
        bitrix24 = 'bitrix24',
        pragma = 'pragma',
    }

    export enum RequestCrmName {
        amocrm = 'amocrm',
        bitrix24 = 'bitrix24',
        pragma = 'pragma',
    }

    export enum RequestEntity {
        nodes = 'nodes',
        accounts = 'accounts',
        modules = 'modules',
        users = 'users',
        workers = 'workers',
    }

    export interface IInputQuery {
        readonly client_module_code?: string
        readonly account_referer?: string
        readonly data?: any
        readonly filter?: any
    }

    export interface IInputRequest {
        readonly crmName: RequestCrmName|string
        readonly entity: RequestEntity|string
        readonly method: string
        readonly query?: IInputQuery
    }

    export interface IResult {
        readonly result: any
        readonly isFile: boolean
    }

    export class Result implements IResult{
        readonly result: any
        readonly isFile: boolean = false

        constructor(result: any, isFile: boolean = false) {
            this.result = result
            this.isFile = isFile
        }
    }

    export enum TypeWorkerMessage {
        configs = 'configs',
        api = 'api',
    }

    export interface IWorkerMessage {
        readonly requestId: number
        readonly type: TypeWorkerMessage
        body: IInputRequest|any
    }
}