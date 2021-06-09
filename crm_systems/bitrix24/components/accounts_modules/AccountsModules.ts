import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {
    MainAccountModule,
    MainAccountsModules
} from "../../../main/components/accounts_modules/MainAccountsModules";
// @ts-ignore
import {Bitrix24, InstallData, IRequest} from "../../interface/Bitrix24Interfaces";
import IAccountsModules = Bitrix24.IAccountsModules;
import IAccountModule = Bitrix24.IAccountModule;
import IModule = Bitrix24.IModule;
import IAccount = Bitrix24.IAccount;
import {Accounts} from "../accounts/Accounts";
import {Modules} from "../modules/Modules";
import IOAuthData = Bitrix24.IOAuthData;
import {LogJson} from "../../../../generals/LogWriter";
import {IBasic} from "../../../../generals/IBasic";
import IError = IBasic.IError;
import {Batch, Bitrix24ApiRequest, Bitrix24RestApiGateway} from "../gateway/RestApiGateway";
import IModules = Bitrix24.IModules;
import IAccounts = Bitrix24.IAccounts;
import Error = IBasic.Error;
import Errors = IBasic.Errors;


class RefreshData implements IOAuthData{
    readonly client_id: string;
    readonly client_secret: string;
    readonly grant_type: string;
    readonly refresh_token: string;

    constructor(
        client_id: string,
        client_secret: string,
        refresh_token: string
    ) {
        this.grant_type = 'refresh_token'
        this.client_secret = client_secret
        this.client_id = client_id
        this.refresh_token = refresh_token
    }

    toString(): string {
        return 'grant_type=' + this.grant_type + '&client_secret=' + this.client_secret + '&client_id=' + this.client_id + '&refresh_token=' + this.refresh_token
    }
}

abstract class Bitrix24NodeGateway extends MainAccountModule {
    abstract module: IModule
    abstract bitrix24RefreshToken: string
    abstract bitrix24RestApiGateway: Bitrix24.IRestApiGateway
    abstract bitrix24ShutdownTimeSec: number
    protected abstract setBitrix24AccessToken(token: string): void
    protected abstract setBitrix24RefreshToken(token: string): void
    protected abstract setBitrix24ShutdownTimeSec(time: string|number): void
    protected abstract bitrix24SaveTokens(params: InstallData): Promise<void>

    private refresh_flag = false
    private waiting_for_refresh = []
    private refresh_timeout = null

    async bitrix24Refresh(): Promise<void> {
        this.bitrix24NotArchaicToken || await this.refresh()
    }

    get bitrix24NotArchaicToken () : boolean {
        const currentTime = Math.ceil(new Date().getTime() / 1000)
        return this.bitrix24ShutdownTimeSec - currentTime > 300
    }

    private async refresh(): Promise<void> {
        await new Promise(this.refreshHandler)
    }

    private refreshHandler = async (resolve, reject): Promise<void> => {
        this.initRefresh(resolve, reject)
        try {
            this.refresh_flag || await this._refresh()
        } catch (e) {
            const error_message = typeof e === 'string' ? e : e.message || 'Inner error'
            const error = new Error(error_message, Errors.serverErrorCode, e)
            this.refreshTrigger(error)
        }
    }

    private initRefresh(resolve, reject): void {
        this.setErrorTimeOut()
        this.waiting_for_refresh.push({resolve, reject})
    }

    private setErrorTimeOut(): void {
        if(!this.refresh_timeout) {
            const error = Errors.server("Failed to update token, timed out")
            this.refresh_timeout = setTimeout(() => this.refreshTrigger(error), 3 * 60 * 1000)
        }
    }

    private async _refresh(): Promise<void> {
        this.refresh_flag = true

        const answer: InstallData | IError = await this.bitrix24RestApiGateway.oauthToken(this.refreshData)
        ;(!answer || answer.error) ? this.errorAnswer(answer) : await this.successAnswer(answer)
    }

    private errorAnswer (answer: any): void {
        const error_message = 'REFRESH TOKEN ERROR'
        const error = new Error(error_message, Errors.serverErrorCode, answer)
        this.logWriter.sendError(error, 'REFRESH TOKEN ERROR')
        this.refreshTrigger(error)
    }

    private async successAnswer(answer: any): Promise<void> {
        await this.bitrix24SaveTokens(answer)
        this.refreshTrigger()
    }

    private refreshTrigger(error?: IError): void {
        this.refresh_timeout && clearTimeout(this.refresh_timeout)
        try {
            this._refreshTrigger(error)
        } catch (e) {
            throw e
        } finally {
            this.refresh_flag = false
        }
    }

    private _refreshTrigger(error?: IError): void {
        if(error) {
            this.waiting_for_refresh.forEach(handlers => typeof handlers.reject === 'function' && handlers.reject(error))
        } else
            this.waiting_for_refresh.forEach(handlers => typeof handlers.resolve === 'function' && handlers.resolve())
        this.waiting_for_refresh = []
    }

    private get refreshData(): IOAuthData {
        return new RefreshData(
            this.module.bitrix24IntegrationId,
            this.module.bitrix24SecretKey,
            this.bitrix24RefreshToken
        )
    }
}

export class Bitrix24AccountModule extends Bitrix24NodeGateway implements IAccountModule{
    readonly module: IModule
    readonly account: IAccount

    private _bitrix24AccessToken: string
    private _bitrix24RefreshToken: string
    private _bitrix24ShutdownTimeSec: number
    readonly bitrix24RestApiGateway: Bitrix24.IRestApiGateway


    constructor(module: IModule, account: IAccount, model: any) {
        const logWriter = new LogJson(account.bitrix24Referer, module.code, 'node')
        super(module, account, model, logWriter)

        this.module = module
        this.account = account
        this._bitrix24AccessToken = model.bitrix24AccessToken || ''
        this._bitrix24RefreshToken = model.bitrix24RefreshToken || ''
        this._bitrix24ShutdownTimeSec = Math.ceil(model.bitrix24ShutdownTime || 0)
        this.bitrix24RestApiGateway = new Bitrix24RestApiGateway(this)
    }

    get bitrix24AccessToken(): string {
        return this._bitrix24AccessToken
    }

    get bitrix24RefreshToken(): string {
        return this._bitrix24RefreshToken
    }

    get bitrix24ShutdownTimeSec(): number {
        return this._bitrix24ShutdownTimeSec
    }

    async bitrix24Install(params: InstallData): Promise<void> {
        await Promise.all([
            this.bitrix24SaveTokens(params),
            this.installMain()
        ])
    }

    protected async bitrix24SaveTokens(params: InstallData): Promise<void> {
        this.setBitrix24AccessToken(params.accessToken)
        this.setBitrix24RefreshToken(params.refreshToken)
        this.setBitrix24ShutdownTimeSec(params.shutdownTimeSec)
        await this.saveInterface()
    }

    private async saveInterface(): Promise<void> {
        await Bitrix24AccountsModulesSchema.saveInterface(this)
    }

    get bitrix24PublicModel(): any {
        return {
            account: this.account.publicModel,
            module: this.module.publicModel,
            installed: this.isOnceInstalled,
            unlimited_time: this.isUnlimitedTime,
            shutdown_time: this.shutdownTimeSeconds,
            pragma_active: this.isPragmaActive,
        }
    }

    createBitrix24RestApiRequest(method: string, params?: any): IRequest {
        return new Bitrix24ApiRequest(this.bitrix24RestApiGateway.bitrix24Path, method, params)
    }

    createBitrix24RestApiBatch(requests: Array<IRequest>): IRequest {
        return new Batch(this.bitrix24RestApiGateway.bitrix24Path, requests)
    }

    toString(): string {
        return JSON.stringify(this.bitrix24PublicModel)
    }

    protected setBitrix24AccessToken(token: string): void {
        this._bitrix24AccessToken = token
    }

    protected setBitrix24RefreshToken(token: string): void {
        this._bitrix24RefreshToken = token
    }

    protected setBitrix24ShutdownTimeSec(time: string | number): void {
        time = typeof time === 'string' ? Number.parseInt(time) : time
        this._bitrix24ShutdownTimeSec = Math.ceil(time)
    }
}

class Buffer {
    private buffer: Array<Bitrix24AccountModule>

    constructor() {
        this.buffer = []
    }

    interfaceFind(moduleCode: string, memberId: string): Bitrix24AccountModule|null {
        return this.buffer.find(node => node.module.code === moduleCode && node.account.bitrix24MemberId === memberId)
    }

    find (moduleId: number, accountId: number): Bitrix24AccountModule|null {
        return this.buffer.find(accountModule => accountModule.pragmaModuleId === moduleId && accountModule.pragmaAccountId === accountId)
    }
    add (accountModule: Bitrix24AccountModule) : void {
        this.buffer.push(accountModule)
    }

    get bufferForTests(): Array<Bitrix24AccountModule> {
        return this.buffer
    }

    clearBufferForTests(): void {
        this.buffer = []
    }
}

class Bitrix24AccountsModulesSchema extends CRMDB {
    async findInterface (pragmaModuleId: number, pragmaAccountId: number) : Promise<any|null> {
        const schema = CRMDB.bitrix24ModulesTokensSchema
        const sql = `SELECT
                        ${schema}.pragma_account_id AS pragmaAccountId,
                        ${schema}.pragma_module_id AS pragmaModuleId,
                        ${schema}.access_token AS bitrix24AccessToken,
                        ${schema}.refresh_token AS bitrix24RefreshToken,
                        ${schema}.shutdown_time AS bitrix24ShutdownTime
                    FROM ${schema} 
                    WHERE ${schema}.pragma_account_id = ${pragmaAccountId} 
                    AND ${schema}.pragma_module_id = ${pragmaModuleId}`
        const answer = await  CRMDB.query(sql)
        return answer[0] || null
    }

    static async saveInterface(module: IAccountModule): Promise<void> {
        const schema = CRMDB.bitrix24ModulesTokensSchema
        const sql = `INSERT INTO ${schema} (pragma_account_id, pragma_module_id, access_token, refresh_token, shutdown_time)
                    VALUES(?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        ${schema}.access_token = VALUES(${schema}.access_token),
                        ${schema}.refresh_token = VALUES(${schema}.refresh_token),
                        ${schema}.shutdown_time = VALUES(${schema}.shutdown_time)`
        const model = [
            module.pragmaAccountId,
            module.pragmaModuleId,
            module.bitrix24AccessToken,
            module.bitrix24RefreshToken,
            module.bitrix24ShutdownTimeSec
        ]

        await CRMDB.query(sql, model)
    }
}

export class Bitrix24AccountsModules extends MainAccountsModules implements IAccountsModules{
    private static _inst: Bitrix24AccountsModules
    private readonly bitrix24Schema: Bitrix24AccountsModulesSchema
    private readonly buffer: Buffer
    protected _modules: IModules
    protected _accounts: IAccounts

    static get self(): Bitrix24AccountsModules {
        if(Bitrix24AccountsModules._inst)
            return Bitrix24AccountsModules._inst
        Bitrix24AccountsModules._inst = new Bitrix24AccountsModules()
        return Bitrix24AccountsModules._inst
    }

    private get modules(): IModules {
        return this._modules || Modules.getModules()
    }

    private get accounts(): IAccounts {
        return this._accounts || Accounts.getAccounts()
    }

    protected static _setInstForTest(modules: Bitrix24AccountsModules): void {
        Bitrix24AccountsModules._inst = modules
    }

    protected constructor() {
        super();
        this.bitrix24Schema = new Bitrix24AccountsModulesSchema()
        this.buffer = new Buffer()
    }

    async accountModule(pragmaModuleId: number, pragmaAccountId: number): Promise<Bitrix24.IAccountModule> {
        return this.buffer.find(pragmaModuleId, pragmaAccountId) || await this.getAccountModule(pragmaModuleId, pragmaAccountId)
    }

    async findAccountModuleByMemberId (pragmaModuleCode: string, bitrix24MemberId: string): Promise<IAccountModule|null> {
        const node = this.buffer.interfaceFind(pragmaModuleCode, bitrix24MemberId)
        if(node)
            return node
        const moduleAndAccount: Array<any> = await this.findModuleAndAccount(pragmaModuleCode, bitrix24MemberId)
        if(!moduleAndAccount[0] || !moduleAndAccount[1])
            return null
        return this.findNode(moduleAndAccount[0].pragmaModuleId, moduleAndAccount[1].pragmaAccountId)
    }

    private async findModuleAndAccount(moduleCode: string, memberId: string): Promise<Array<IModule|IAccount|null>> {
        return Promise.all([
            this.modules.getByCode(moduleCode),
            this.accounts.findAccount(memberId)
        ])
    }

    private async findNode(pragmaModuleId: number, pragmaAccountId: number): Promise<Bitrix24.IAccountModule|null> {
        const bitrix24Interface = await this.bitrix24Interface(pragmaModuleId, pragmaAccountId)
        if(!Object.keys(bitrix24Interface).length)
            return null;
        const promises = await Promise.all([
            this.getPragmaNodeModel(pragmaModuleId, pragmaAccountId),
            this.modules.getByPragmaId(pragmaModuleId),
            this.accounts.getBitrix24Account(pragmaAccountId)
        ])
        const model = Object.assign(promises[0], bitrix24Interface)
        return await this.createInstance(promises[1], promises[2], model)
    }

    private async getAccountModule (pragmaModuleId: number, pragmaAccountId: number): Promise<Bitrix24.IAccountModule> {
        const promises = await Promise.all([
            this.getPragmaNodeModel(pragmaModuleId, pragmaAccountId),
            this.bitrix24Interface(pragmaModuleId, pragmaAccountId),
            this.modules.getByPragmaId(pragmaModuleId),
            this.accounts.getBitrix24Account(pragmaAccountId)
        ])
        const model = Object.assign(promises[0], promises[1])
        return await this.createInstance(promises[2], promises[3], model)
    }

    private createInstance (module: IModule, account: IAccount, model: any) : IAccountModule {
        const accountModule = new Bitrix24AccountModule(module, account, model)
        this.buffer.add(accountModule)
        return accountModule
    }

    private async bitrix24Interface (pragmaModuleId: number, pragmaAccountId: number): Promise<any> {
        return await this.bitrix24Schema.findInterface(pragmaModuleId, pragmaAccountId) || {
            pragmaModuleId,
            pragmaAccountId,
            bitrix24AccessToken: '',
            bitrix24RefreshToken: '',
            bitrix24ShutdownTime: 0
        }
    }

    protected get bufferForTests(): Buffer {
        return this.buffer
    }
}