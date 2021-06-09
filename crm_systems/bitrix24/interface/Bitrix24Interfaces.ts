import {IMain} from "../../main/interfaces/MainInterface";
import {IBasic} from "../../../generals/IBasic";
import {IServer} from "../../../server/intrfaces";

export namespace Bitrix24 {
    import IError = IBasic.IError;

    export interface IInputRequest extends IServer.IInputRequest {
        readonly query: IInputQuery
    }

    export interface IInputQuery extends IServer.IInputQuery {
        readonly client_member_id?: string
    }

    export interface IInputNodeInstallRequest extends IInputRequest {
        readonly query: IInputNodeInstallQuery
    }

    export interface IInputNodeInstallQuery extends IInputQuery {
        readonly data: IInputNodeInstallData
    }

    export interface IInputNodeInstallData {
        readonly state: string
        readonly DOMAIN: string
        readonly APP_SID: string
        readonly AUTH_ID: string
        readonly REFRESH_ID: string
        readonly AUTH_EXPIRES: string
        readonly member_id: string
    }

    export interface IBitrix24NodesQuery extends IInputQuery {
        readonly filter: {
            readonly module_code: string|null
            readonly member_id: string|null
        }
    }

    export interface IAccountsFilter {
        readonly members_id: Array<string>
    }

    export interface IAccountsQuery extends IServer.IInputQuery {
        readonly filter: IAccountsFilter
    }

    export interface IBitrix24AccountStruct extends IMain.IMainAccountStruct {
        readonly bitrix24_lang: string
        readonly bitrix24_member_id: string
        readonly bitrix24_referer: string
    }

    export interface IAccount extends IMain.IAccount {
        readonly bitrix24MemberId: string
        readonly bitrix24Referer: string
        readonly bitrix24Lang: string
        setBitrix24Lang(lang: string): void
        setBitrix24Referer(referer: string): void
        save(): void
        saveBitrix24Interface(): void
        publicModel: IBitrix24AccountStruct
        toString(): string
    }

    export interface IAccounts extends IMain.IAccounts {
        saveBitrix24(account: IAccount): Promise<void>
        createAndGetBitrix24Account(bitrix24emberId: string): Promise<IAccount>
        getBitrix24Account(pragmaAccountId: number): Promise<IAccount>
        findAccounts(bitrix24MembersId: Array<string>|string): Promise<Array<IAccount>>
        findAccount(bitrix24MemberId: string): Promise<IAccount|null>
    }

    export interface InstallData {
        readonly accessToken: string
        readonly refreshToken: string
        readonly shutdownTimeSec: number
    }

    export interface IOAuthData {
        readonly grant_type: string
        readonly client_id: string
        readonly client_secret: string
        readonly refresh_token: string
        toString(): string
    }

    export interface IBitrix24ModuleStruct extends IMain.IMainModuleStruct {
        readonly bitrix24_integration_id: string
        readonly bitrix24_handler_path: string
    }

    export interface IModule extends IMain.IModule {
        readonly bitrix24SecretKey: string
        readonly bitrix24IntegrationId: string
        readonly bitrix24HandlerPath: string
        publicModel: IBitrix24ModuleStruct
        toString(): string
    }

    export interface IModules extends IMain.IModules {
        getByPragmaId(pragmaModuleId: number): Promise<IModule>
        getByCode(code: string): Promise<IModule>
        findByCode(code: string): Promise<IModule|null>
    }

    export interface IRequest {
        readonly id: number
        readonly bitrix24Method: string
        readonly bitrix24FullMethod: string
        readonly queryBody: any
        executedTrigger(result: any): void
        errorTrigger(error: IError): void
        executed(): Promise<any>
        readonly isBatch: boolean
    }

    export interface IBatch extends IRequest{
        readonly requests: Array<IRequest>
    }

    export interface IRestApiStack {
        readonly size: number
        readonly bitrix24RequestsStack: Array<IRequest>
        nextRequest(): IRequest
        push(request: IRequest): void
    }

    export interface IHttpsClient {
        readonly bitrix24Path: string
        oauthToken(queryParams: IOAuthData): Promise<InstallData|IError>
        bitrix24Query(bitrix24Method: string, params: any): Promise<any>
        bitrix24Batch(bitrix24Method: string, params: any): Promise<any>
    }

    export interface IRestApiGateway extends IHttpsClient{
        execute(request: IRequest): Promise<any>
    }

    export interface IAccountModule extends IMain.IAccountModule {
        bitrix24Refresh(): Promise<void>
        readonly bitrix24AccessToken: string
        readonly bitrix24RefreshToken: string
        readonly bitrix24ShutdownTimeSec: number
        readonly bitrix24NotArchaicToken: boolean
        readonly module: IModule
        readonly account: IAccount
        bitrix24Install(params: InstallData): Promise<void>
        readonly publicModel: any
        toString(): string
        readonly bitrix24RestApiGateway: Bitrix24.IRestApiGateway
        createBitrix24RestApiRequest(method: string, params?: any): IRequest
        createBitrix24RestApiBatch(requests: Array<IRequest>): IRequest
    }

    export interface IAccountsModules extends IMain.IAccountsModules {
        accountModule (pragmaModuleId:  number, pragmaAccountId: number): Promise<IAccountModule>
        findAccountModuleByMemberId (pragmaModuleCode: string, bitrix24MemberId: string): Promise<IAccountModule|null>
    }

    export interface IQueryRequest extends IServer.IInputQuery {
        readonly member_id?: string
        readonly data: IInputQueryData
    }

    export interface IInputQueryData {
        readonly method: string
        readonly params: any
    }
}