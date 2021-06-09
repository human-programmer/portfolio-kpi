import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {IMain} from "../../interfaces/MainInterface";
import IAccountModule = IMain.IAccountModule;
import {Generals} from "../../../../generals/Interfaces";
import ILogWriter = Generals.ILogWriter;
import {IBasic} from "../../../../generals/IBasic";
import randomString = IBasic.randomString;
import {Task, TasksManager} from "../tasks_manager/TasksManager";
import Errors = IBasic.Errors;
import IApiKey = IMain.IApiKey;
import IMainNodeStruct = IMain.IMainNodeStruct;
import Error = IBasic.Error;

export class NodesTaskManager extends TasksManager {
    private static inst: NodesTaskManager
    readonly stack: Array<RemoveTempTokenTask>
    static get self(): NodesTaskManager {
        if(NodesTaskManager.inst) return NodesTaskManager.inst
        NodesTaskManager.inst = new NodesTaskManager()
        return NodesTaskManager.inst
    }
}

class RemoveTempTokenTask extends Task {
    readonly targetToken: IApiKey
    readonly tokensStorage: Array<IApiKey>

    constructor(targetToken: IApiKey, tokens: Array<IApiKey>, timeout: number = 30 * 60) {
        const executeTime = new Date().getTime() + timeout
        super(executeTime)
        this.targetToken = targetToken
        this.tokensStorage = tokens
    }

    async execute(): Promise<void> {
        await super.execute()
        const key = this.tokensStorage.find(i => i.token === this.targetToken.token)
        if(!key) return;
        const index = this.tokensStorage.indexOf(key)
        this.tokensStorage.splice(index, 1)
        await ApiKeysSchema.deleteApiKey(this.targetToken)
    }
}

abstract class MainNodeTokens {
    abstract readonly pragmaAccountId: number
    abstract readonly pragmaModuleId: number
    abstract logWriter: ILogWriter
    abstract setPragmaUserId(id: number): Promise<void>

    private apiKeys: Array<IApiKey>
    private tempTokenLifeTime: number = 30 * 60000

    async createInactiveApiKey(pragmaUserId: number): Promise<string> {
        if(!pragmaUserId) throw Errors.invalidRequest('pragmaUserId can not be null')
        const token = await ApiKeysSchema.createInactiveApiKey(this.pragmaModuleId, this.pragmaAccountId, pragmaUserId)
        const key = await this.loadApiKey(token)
        this.createRemoveTempTokenTask(key)
        return key.token
    }

    private async loadApiKey(token: string): Promise<IApiKey> {
        if(!Array.isArray(this.apiKeys)) {
            const keys = await this.getApiKeys()
            return keys.find(i => i.token === token)
        }
        const key = await this.getApiKeyFromDb(token)
        this.apiKeys.push(key)
        return key
    }

    private async getApiKeyFromDb(token: string): Promise<IApiKey> {
        const apiKeys = await ApiKeysSchema.getApiKeys(this.pragmaModuleId, this.pragmaAccountId)
        const key = apiKeys.find(i => i.token === token)
        if(!key) throw Errors.internalError('ApiKey not found after create')
        return key
    }

    private createRemoveTempTokenTask(targetToken: IApiKey): void {
        const task = new RemoveTempTokenTask(targetToken, this.apiKeys, this.tempTokenLifeTime)
        NodesTaskManager.self.addTask(task)
    }

    async activateToken(token: string): Promise<boolean> {
        const tokens = await this.getApiKeys()
        this.logWriter.sendError(token, 'token')
        this.logWriter.sendError(tokens.length, 'SIZE')
        this.logWriter.sendError(tokens.map(i => i.token), 'tokens')

        const tokenStruct = await this.findApiKey(token)
        if(!tokenStruct)
            return await this.saveErrorOfActivate()
        await this.activateApiKey(tokenStruct)
        return true
    }

    private async activateApiKey(key: IApiKey): Promise<void> {
        if(key.isActive) return;
        await key.setIsActive()
        await this.setPragmaUserId(key.pragmaUserId)
        await this.removeOldApiKeys(key)
    }

    private async removeOldApiKeys(newKey: IApiKey): Promise<void> {
        const apiKeys = await this.getApiKeysOfAccount(newKey.pragmaAccountId)
        const oldKeys = apiKeys.filter(i => i.token !== newKey.token)
        const size = oldKeys.length
        for (let i = size - 1; i>= 0; --i)
            await this.removeOldApiKey(oldKeys[i])
    }

    private async getApiKeysOfAccount(pragmaAccountId: number): Promise<Array<IApiKey>> {
        const apiKeys = await this.getApiKeys()
        return apiKeys.filter(i => i.pragmaAccountId === pragmaAccountId)
    }

    private async removeOldApiKey(oldKey: IApiKey): Promise<void> {
        await ApiKeysSchema.deleteApiKey(oldKey)
        const index = this.apiKeys.indexOf(oldKey)
        this.apiKeys.splice(index, 1)
    }

    private async saveErrorOfActivate(): Promise<false> {
        const error = Errors.invalidRequest('Invalid api_key for activate')
        await this.logWriter.sendError(error, error.message)
        return false
    }

    async checkApiKey(token: string): Promise<boolean> {
        if(!token) return false
        const tokenStruct = await this.findApiKey(token)
        return !!tokenStruct && !!tokenStruct.isActive
    }

    private async findApiKey(token: string): Promise<IApiKey|null> {
        const tokens = await this.getApiKeys()
        return tokens.find(i => i.token === token)
    }

    private async getActiveApiKeys(): Promise<Array<IApiKey>> {
        const keys = await this.getApiKeys()
        return keys.filter(i => i.isActive)
    }

    private async getInactiveApiKeys(): Promise<Array<IApiKey>> {
        const keys = await this.getApiKeys()
        return keys.filter(i => !i.isActive)
    }

    private async getApiKeys(): Promise<Array<IApiKey>> {
        if(this.apiKeys) return this.apiKeys
        await this.loadApiKeys()
        return this.apiKeys
    }

    private async loadApiKeys(): Promise<void> {
        this.apiKeys = await ApiKeysSchema.getApiKeys(this.pragmaModuleId, this.pragmaAccountId)
    }
}

export abstract class MainAccountModule extends MainNodeTokens implements IAccountModule{
    protected abstract getApiKeyOfWidget(): Promise<string>
    readonly account: IMain.IAccount
    readonly module: IMain.IModule
    private _pragmaUserId: number|null
    readonly isUnlimitedTime: boolean
    private _shutdownDate: Date|null
    private _shutdownTimeSeconds: number
    private _isOnceInstalled: boolean
    protected _logWriter: ILogWriter

    constructor(module: IMain.IModule, account: IMain.IAccount, model: any, logWriter: ILogWriter) {
        super()
        this._logWriter = logWriter
        this.account = account
        this.module = module
        this._pragmaUserId = Number.parseInt(model.pragmaUserId) || null
        this.isUnlimitedTime = !!model.isUnlimitedTime
        this._shutdownDate = model.shutdownDate || null
        this._shutdownTimeSeconds = model.shutdownDate ? Math.ceil(model.shutdownDate.getTime() / 1000) : 0
        this._isOnceInstalled = !!model.isOnceInstalled
    }

    get pragmaUserId(): number|null {
        return this._pragmaUserId
    }

    async setPragmaUserId(id: number): Promise<void> {
        await MainAccountsModulesSchema.setUserIdOfNode(this.pragmaModuleId, this.pragmaAccountId, id)
        this._pragmaUserId = id
    }

    private async savePragma(): Promise<void> {
        await MainAccountsModulesSchema.install(this)
    }

    async installMain(token?: string): Promise<void> {
        try {
            await MainAccountsModulesSchema.install(this)
            this._isOnceInstalled = true
            await this.activateApiKeyOfWidget()
        } catch (e) {
            const error = e instanceof Error ? e : Errors.innerError('installMain', e)
            this.logWriter.sendError(error, 'installMain')
            throw error
        }
    }

    private async activateApiKeyOfWidget(): Promise<void> {
        const token = await this.getApiKeyOfWidget()
        token && await this.activateToken(token) && await this.setFreePeriod()
    }

    private async setFreePeriod(): Promise<void> {
        this.shutdownDate || await this.setShutdownDate()
    }

    private async setShutdownDate(days: number = this.module.freePeriodDays) : Promise<void> {
        if(!this.module.isFree) {
            const shutdownTime = new Date().getTime() + days * 86400 * 1000
            this._shutdownDate = new Date(shutdownTime)
            this._shutdownTimeSeconds = Math.ceil(this.shutdownDate.getTime() / 1000)
            await this.savePragma()
        }
    }

    get pragmaModuleId (): number {
        return this.module.pragmaModuleId
    }

    get pragmaAccountId (): number {
        return this.account.pragmaAccountId
    }

    get shutdownDate(): Date|null {
        return this._shutdownDate
    }
    get shutdownTimeSeconds(): number {
        return this._shutdownTimeSeconds
    }
    async changeShutdownTimeSec(time: number): Promise<void> {
        this._shutdownTimeSeconds = time
        this._shutdownDate = new Date(this._shutdownTimeSeconds * 1000)
        await this.savePragma()
    }
    get isOnceInstalled(): boolean {
        return this._isOnceInstalled
    }
    get isPragmaActive(): boolean {
        const timeFlag = (this.shutdownTimeSeconds * 1000 - new Date().getTime()) > 0
        return this.isOnceInstalled && (this.module.isFree || timeFlag)
    }

    get publicModel(): IMainNodeStruct {
        return {
            module: this.module.publicModel,
            account: this.account.publicModel,
            pragma_user_id: this.pragmaUserId,
            shutdown_time: this.shutdownTimeSeconds,
            is_once_installed: this.isOnceInstalled,
            is_unlimited: this.isUnlimitedTime,
            is_pragma_active: this.isPragmaActive,
        }
    }

    get logWriter(): ILogWriter {
        return this._logWriter
    }
}


class MainAccountsModulesSchema extends CRMDB {
    async pragmaAccountModule (pragmaModuleId: number, pragmaAccountId: number): Promise<any> {
        const schema = MainAccountsModulesSchema.moduleToAccountSchema
        const sql = `SELECT
                        ${schema}.module_id AS pragmaModuleId,
                        ${schema}.account_id AS pragmaAccountId,
                        ${schema}.user_id AS pragmaUserId,
                        ${schema}.enable_date AS shutdownDate,
                        ${schema}.unlimited_time AS isUnlimitedTime,
                        true AS isOnceInstalled
                    FROM ${schema} 
                    WHERE ${schema}.module_id = ? 
                    AND ${schema}.account_id = ?`
        const model = [pragmaModuleId, pragmaAccountId]
        const answer = await CRMDB.query(sql, model)
        return answer[0] || null
    }

    static async install (module: IAccountModule) : Promise<void> {
        const schema = MainAccountsModulesSchema.moduleToAccountSchema
        const date = CRMDB.escape(module.shutdownDate)
        const sql = `INSERT INTO ${schema} (module_id, account_id, enable_date)
                    VALUES (${module.pragmaModuleId}, ${module.pragmaAccountId}, ${date})
                    ON DUPLICATE KEY UPDATE enable_date = ${date}`;
        await CRMDB.query(sql)
    }

    static async setUserIdOfNode(moduleId: number, accountId: number, userId: number): Promise<void> {
        const sql = `UPDATE ${CRMDB.moduleToAccountSchema} SET user_id = ${userId} WHERE module_id = ${moduleId} AND account_id = ${accountId}`
        await CRMDB.query(sql)
    }
}

export class MainAccountsModules {
    readonly schema: MainAccountsModulesSchema

    constructor() {
        this.schema = new MainAccountsModulesSchema()
    }

    protected async findPragmaModuleModel (pragmaModuleId: number, pragmaAccountId: number): Promise<any>{
        return await this.schema.pragmaAccountModule(pragmaModuleId, pragmaAccountId) || {}
    }

    protected async getPragmaNodeModel (pragmaModuleId: number, pragmaAccountId: number): Promise<any> {
        return await this.schema.pragmaAccountModule(pragmaModuleId, pragmaAccountId) || {}
    }
}

export class ApiKeysSchema extends CRMDB {

    static async activateToken(pragmaAccountId: number, apiKey: string): Promise<void> {
        const sql = `UPDATE ${CRMDB.nodesApiKeysSchema} SET is_active = 1 WHERE account_id = ${pragmaAccountId} AND api_key = '${apiKey}'`
        await CRMDB.query(sql)
    }

    static async createInactiveApiKey(moduleId: number, accountId: number, userId: number): Promise<string> {
        const key = randomString(128)
        const sql = `INSERT INTO ${CRMDB.nodesApiKeysSchema} (module_id, account_id, user_id, api_key, is_active)
                    VALUES(?, ?, ?, ?, 0)`
        await CRMDB.query(sql, [moduleId, accountId, userId, key])
        return key
    }

    static async deleteApiKey(api_key: IApiKey): Promise<void> {
        const sql = `DELETE FROM ${CRMDB.nodesApiKeysSchema} WHERE api_key = '${api_key.token}'`
        await CRMDB.query(sql)
    }

    static async getActiveApiKeys(moduleId: number, accountId: number): Promise<Array<IApiKey> > {
        const apiKeys = await ApiKeysSchema.getApiKeys(moduleId, accountId)
        return apiKeys.filter(apiKey => apiKey.isActive)
    }

    static async getInactiveApiKeys(moduleId: number, accountId: number): Promise<Array<IApiKey> > {
        const apiKeys = await ApiKeysSchema.getApiKeys(moduleId, accountId)
        return apiKeys.filter(apiKey => !apiKey.isActive)
    }

    static async getApiKeys(moduleId: number, accountId: number): Promise<Array<IApiKey> > {
        const api_keys = CRMDB.nodesApiKeysSchema
        const condition = `${api_keys}.module_id = ${moduleId} AND ${api_keys}.account_id = ${accountId}`
        const sql = ApiKeysSchema.sql(condition)
        const models = await CRMDB.query(sql)
        return ApiKeysSchema.createApiKeysObjects(models)
    }

    private static sql(condition: string): string {
        const api_keys = CRMDB.nodesApiKeysSchema
        return `SELECT 
                    ${api_keys}.account_id AS pragmaAccountId,
                    ${api_keys}.user_id AS pragmaUserId,
                    ${api_keys}.module_id AS pragmaModuleId,
                    ${api_keys}.date_create AS dateCreate,
                    ${api_keys}.is_active AS isActive,
                    ${api_keys}.api_key AS apiKey
                FROM ${api_keys} 
                WHERE ${condition}`
    }

    private static createApiKeysObjects(models: Array<any>): Array<IApiKey> {
        return models.map(model => ApiKeysSchema.createApiKeyObject(model))
    }

    private static createApiKeyObject(model: any): IApiKey {
        return new ApiKeyStruct(model)
    }
}

class ApiKeyStruct implements IApiKey {
    readonly token: string
    readonly pragmaUserId: number
    readonly pragmaAccountId: number
    readonly pragmaModuleId: number
    readonly timeCreate: number
    private _isActive: boolean

    constructor(model: any) {
        this._isActive = !!model.isActive
        this.pragmaAccountId = model.pragmaAccountId
        this.pragmaModuleId = model.pragmaModuleId
        this.pragmaUserId = model.pragmaUserId
        this.timeCreate = model.dateCreate.getTime()
        this.token = model.apiKey
    }


    async setIsActive(): Promise<void> {
        if(!this.isActive) {
            await ApiKeysSchema.activateToken(this.pragmaAccountId, this.token)
            this._isActive = true
        }
    }

    get isActive(): boolean {
        return this._isActive
    }
}