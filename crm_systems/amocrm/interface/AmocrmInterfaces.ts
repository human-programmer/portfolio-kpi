import {IMain} from "../../main/interfaces/MainInterface";
import {Generals} from "../../../generals/Interfaces";
import {IServer} from "../../../server/intrfaces";

export namespace Amocrm {
    import ILogWriter = Generals.ILogWriter;
    import IRequestOptions = IMain.IRequestOptions;
    import IInputQuery = IServer.IInputQuery;
    import IMainAccountStruct = IMain.IMainAccountStruct;
    import IMainNodeStruct = IMain.IMainNodeStruct;
    import IMainModuleStruct = IMain.IMainModuleStruct;
    import IInputRequest = IServer.IInputRequest;

    export interface IAccountsFilter extends IMain.IAccountsFilter{
        readonly amocrm_referer?: Array<string>
        readonly amocrm_account_id?: Array<number>
    }

    export interface IAccountsQuery extends IMain.IAccountsQuery {
        readonly filter: IAccountsFilter
    }

    export interface IInputAccountsRequest extends IMain.IAccountsRequest {
        readonly query: IAccountsQuery
    }

    export interface IAmocrmAccountStruct extends IMainAccountStruct {
        readonly amocrm_account_id: number
        readonly amocrm_referer: string
        readonly amocrm_subdomain: string
        readonly amocrm_country: string
        readonly amocrm_created_at: number
        readonly amocrm_created_by: number
        readonly amocrm_is_technical: boolean
        readonly amocrm_name: string
    }

    export interface IAccount extends IMain.IAccount{
        readonly amocrmAccountId: number
        readonly amocrmSubdomain: string
        readonly amocrmReferer: string
        readonly amocrmName: string
        readonly amocrmCreatedAt: number
        readonly amocrmCreatedBy: number
        readonly amocrmCountry: string
        readonly amocrmCurrency: string
        readonly amocrmCurrencySymbol: string
        readonly amocrmIsTechnical: boolean
        readonly amocrmGateway: IGateway
        readonly logWriter: ILogWriter
        readonly publicModel: IAmocrmAccountStruct
        updateAmocrmInterfaceByApi(node: IAccountModule): Promise<void>
        executeRestQuery(options: IRequestOptions, logWriter: ILogWriter): Promise<any>
    }

    export interface IAccounts extends IMain.IAccounts{
        getAccount(pragmgaAccountId: number): Promise<IAccount>
        findAccount(pragmaAccountId: number): Promise<IAccount|null>
        findByAmocrmId(amocrmAccountId: number): Promise<IAccount|null>
        findByAmocrmReferer (amocrmReferer: string): Promise<IAccount|null>
        findByAmocrmSubdomain (amocrmSubdomain: string): Promise<IAccount|null>
        createAnGetAccountByReferer(referer: string): Promise<IAccount>
        createAndGetAmocrmAccount (amocrmSubdomain: string): Promise<IAccount>
    }

    export interface IAmocrmModuleStruct extends IMainModuleStruct{
        readonly amocrm_integration_id: string
        readonly amocrm_code: string
    }

    export interface IModule extends IMain.IModule{
        readonly amocrmIntegrationId: string
        readonly amocrmSecretKey: string
        readonly amocrmCode: string
        readonly publicModel: IAmocrmModuleStruct
    }

    export interface IModules extends IMain.IModules {
        getModule(pragmaModuleId: number): Promise<IModule>
        findByCode(code: string): Promise<IModule|null>
        findByAmocrmId (integrationId: string): Promise<IModule|null>
    }

    export interface IGateway {
        execute(request: IRequestOptions, logWriter: ILogWriter): Promise<any>
    }

    export interface IInputNodesRequest extends IInputRequest {
        readonly query: IGetNodesQuery|IInstallNodeQuery|IUpdateNodeQuery|object
    }

    export interface IGetNodesQuery extends IInputQuery {
        readonly filter?: INodesFilter
    }

    export interface INodesFilter extends IAccountsFilter, IMain.INodesFilter{
        readonly amocrm_integration_id: Array<string>
    }

    export interface IInstallNodeQuery extends IInputQuery {
        readonly code: string
        readonly referer: string
        readonly client_id: string
        readonly from_widget?: string
    }

    export interface IUpdateNodeQuery extends IInputQuery {
        readonly data: INodeUpdateData
    }

    export interface INodeUpdateData {
        readonly pragma_module_id: number
        readonly pragma_account_id: number
        readonly shutdown_time?: number
        readonly amocrm_disabled?: boolean
    }

    export interface IDataInstall {
        readonly code: string
        readonly referer: string
        readonly client_id: string
        readonly from_widget?: string
    }

    export interface OAuthData {
        readonly client_id: string
        readonly client_secret: string
        readonly grant_type: string
        readonly code?: string
        readonly refresh_token?: string
        readonly redirect_uri: string
    }

    export interface IAmocrmNodeStruct extends IMainNodeStruct{
        readonly module: IAmocrmModuleStruct
        readonly account: IAmocrmAccountStruct
        readonly amocrm_enable: boolean
    }

    export interface IAccountModule extends IMain.IAccountModule{
        readonly logWriter: ILogWriter
        readonly module: IModule
        readonly account: IAccount
        readonly amocrmEnable: boolean
        readonly amocrmAccessToken: string
        readonly amocrmRefreshToken: string
        readonly amocrmShutdownTime: number
        readonly amocrmIsNotArchaicToken: boolean
        readonly publicModel: IAmocrmNodeStruct
        setAmocrmEnable(value: boolean): Promise<void>
        refreshAmocrmTokens(): Promise<void>
        amocrmInstall(code: string): Promise<void>
        amocrmRequest(request: IRequestOptions): Promise<any>
        createAmocrmOptions(path: string, method: string, body?: any): Promise<IRequestOptions>
        changeShutdownTimeSec(time: number): Promise<void>
    }

    export interface IAccountsModules extends IMain.IAccountsModules{
        findAccountModule(amocrmIntegrationId: string ,subdomain: string): Promise<IAccountModule>
        getAccountModule(module: IModule, account: IAccount): Promise<IAccountModule>
        findNode(module: IModule, account: IAccount): Promise<IAccountModule|null>
    }
}