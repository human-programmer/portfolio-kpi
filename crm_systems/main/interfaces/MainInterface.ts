import {IServer} from "../../../server/intrfaces";

export namespace IMain {
    import IInputQuery = IServer.IInputQuery;
    import IInputRequest = IServer.IInputRequest;

    export interface IHttpsClient {
        request (options: IRequestOptions)
    }

    export interface IInputGatewayRequest extends IInputRequest {
        readonly query: IInputGatewayQuery
    }

    export interface IInputGatewayQuery extends IInputQuery {
        readonly data: IRequestOptions
    }

    export interface IRequestOptions {
        readonly priority?: number
        readonly uri: string
        readonly body: any
        readonly method: string
        readonly headers?: any
    }

    export interface IAccountsFilter {
        readonly pragma_account_id: Array<number>
    }

    export interface IAccountsQuery extends IInputQuery{
        readonly filter: IAccountsFilter
    }

    export interface IAccountsRequest extends IInputRequest{
        readonly query: IAccountsQuery
    }

    export interface IApiKeyQuery extends IInputQuery {
        readonly api_key: string
        readonly pragma_account_id: number
        readonly pragma_user_id: number
    }

    export interface IApiKeyRequest extends IInputRequest {
        readonly query: IApiKeyQuery
    }

    export interface IApiKeyAnswer {
        readonly status?: 'success'|'fail'
        readonly api_key?: string
    }

    export interface IMainAccountStruct {
        readonly pragma_account_id: number
        readonly pragma_time_create: number
        readonly crm_name: 'amocrm'|'bitrix24'|'pragma'|string
    }

    export interface IAccount {
        readonly pragmaAccountId: number
        readonly timeCreateSeconds: number
        readonly dateCreate: Date
        readonly crmName: string
        saveMain(): Promise<void>
        readonly publicModel: IMainAccountStruct
    }
    export interface IAccounts {
        saveMain(account: IAccount): Promise<void>
        createPragmaAccount(crmName: string): Promise<number>
    }

    export interface IMainModuleStruct {
        readonly pragma_module_id: number
        readonly code: string
        readonly free_period_days: number
        readonly is_free: boolean
    }

    export interface IModule {
        readonly pragmaModuleId: number
        readonly code: string
        readonly freePeriodDays: number
        readonly isFree: boolean
        saveMain(): Promise<void>
        readonly publicModel: IMainModuleStruct
    }

    export interface IModules {
    }

    export interface IMainNodeStruct {
        readonly module: IMainModuleStruct
        readonly account: IMainAccountStruct
        readonly pragma_user_id: number|null
        readonly shutdown_time: number
        readonly is_unlimited: boolean
        readonly is_once_installed: boolean
        readonly is_pragma_active: boolean
        loaders?: any
    }

    export interface IApiKey {
        readonly token: string
        readonly pragmaUserId: number
        readonly pragmaAccountId: number
        readonly pragmaModuleId: number
        readonly timeCreate: number
        readonly isActive: boolean
        setIsActive(): Promise<void>
    }

    export interface INodesFilter extends IAccountsFilter{
        readonly code: Array<string>
        readonly pragma_module_id: Array<number>
    }

    export interface IAccountModule {
        readonly module : IModule
        readonly account: IAccount

        readonly pragmaModuleId: number
        readonly pragmaAccountId: number
        readonly pragmaUserId: number|null

        readonly shutdownTimeSeconds: number
        readonly shutdownDate: Date|null
        readonly isUnlimitedTime: boolean
        readonly isOnceInstalled: boolean
        readonly isPragmaActive: boolean
        readonly publicModel: IMainNodeStruct
        installMain() : Promise<void>

        createInactiveApiKey(pragmaUserId: number): Promise<string>
        checkApiKey(token: string): Promise<boolean>
        activateToken(token: string): Promise<boolean>
    }

    export interface IAccountsModules {
    }

    export interface ITask {
        readonly taskId: string
        readonly executeTime: number
        readonly timeInterval: number
        readonly executed: boolean
        execute(): Promise<void>
    }

    export interface ITaskManager {
        addTask(task: ITask): void
        removeTask(taskId: string): void
        readonly size: number
    }

    export interface IUsersFilter {
        readonly pragma_user_id: Array<number>
        readonly email: Array<string>
        readonly phone: Array<string>
    }

    export interface IGetUsersQuery extends IInputQuery {
        readonly filter: IUsersFilter
    }

    export interface ICreateUserQuery extends IInputQuery {
        readonly data: ICreateUserStruct
    }

    export interface IUpdateUserQuery extends IInputQuery {
        readonly data: IUpdateUserStruct
    }

    export interface IUsersRequest extends IInputRequest {
        readonly query: IGetUsersQuery|ICreateUserQuery|IUpdateUserQuery
    }

    export interface IMainUserStruct {
        readonly surname: string
        readonly middle_name: string
        readonly lang: string
        readonly name: string
    }

    export interface IUpdateUserStruct extends IMainUserStruct{
        readonly pragma_user_id: number
    }

    export interface ICreateUserStruct extends IMainUserStruct{
        readonly email: string
        readonly phone: string
    }

    export interface IUserStruct extends ICreateUserStruct{
        readonly pragma_user_id: number
        readonly confirm_email: boolean
    }

    export interface IUser {
        readonly pragmaUserId: number
        readonly email: string|null
        readonly confirmEmail: boolean
        readonly phone: string|null
        readonly name: string
        readonly surname: string
        readonly middleName: string
        readonly lang: string

        toString(): string
        readonly publicModel: IUserStruct

        update(struct: IUpdateUserStruct): Promise<void>

        compareEmail(email: string): boolean
        comparePhone(phone: string): boolean
        setPhone(phone: string): Promise<void>
        setConfirmEmail(): Promise<void>
    }

    export interface IUsers {
        findUserByEmail(email: string): Promise<IUser|null>
        findUserByPhone(phone: string): Promise<IUser|null>
        findUserById(pragmaUserId: number): Promise<IUser|null>
        createUser(struct: ICreateUserStruct): Promise<IUser>
    }
}