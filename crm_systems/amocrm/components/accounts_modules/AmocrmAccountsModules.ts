import {MainAccountModule, MainAccountsModules} from "../../../main/components/accounts_modules/MainAccountsModules";
import {Amocrm} from "../../interface/AmocrmInterfaces";
import IAccountsModules = Amocrm.IAccountsModules;
import IAccountModule = Amocrm.IAccountModule;
import IModule = Amocrm.IModule;
import IAccount = Amocrm.IAccount;
import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {AmocrmModules} from "../modules/AmocrmModules";
import {AmocrmAccounts} from "../accounts/AmocrmAccounts";
import OAuthData = Amocrm.OAuthData;
import {Generals} from "../../../../generals/Interfaces";
import ILogWriter = Generals.ILogWriter;
import {LogJson} from "../../../../generals/LogWriter";
import {IMain} from "../../../main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {Configs} from "../../../../generals/Configs";

abstract class NodeGetaway extends MainAccountModule {
    abstract readonly module: IModule
    abstract readonly account: IAccount

    private _amocrmAccessToken: string;
    private _amocrmEnable: boolean;
    private _amocrmRefreshToken: string;
    private _amocrmShutdownTime: number;

    protected abstract saveAmocrmInterface(): Promise<void>
    protected abstract get self(): IAccountModule

    constructor(module: IModule, account: IAccount, model: any, logWriter: ILogWriter) {
        super(module, account, model, logWriter)
        this._amocrmEnable = !!model.amocrmEnable
        this._amocrmAccessToken = model.amocrmAccessToken || ''
        this._amocrmRefreshToken = model.amocrmRefreshToken || ''
        this._amocrmShutdownTime = model.amocrmShutdownTime || 0
    }

    async refreshAmocrmTokens(): Promise<void> {
        if(!this.amocrmIsNotArchaicToken)
            await this.updateTokens()
    }

    get amocrmIsNotArchaicToken(): boolean {
        const time = new Date().getTime() / 1000
        return (this.amocrmShutdownTime - time) > 600
    }

    async amocrmInstall(code: string): Promise<void> {
        try{
            await this.updateTokens(code)
            await this.install()
        } catch (error) {
            const message = typeof error === 'string' ? error : 'Authorization error'
            this.logWriter.sendError(error, message)
            throw error
        }
    }

    private async install(): Promise<void> {
        await Promise.all([
            this.updateAccountParams(),
            super.installMain()
        ])
    }

    protected async updateTokens(code: string = null): Promise<void> {
        try {
            const request = this.createOAuthRequestOptions(code ? 'authorization_code' : 'refresh_token', code)
            const answer = await this.restQuery(request)
            answer.body = NodeGetaway.safeParsing(answer.body)
            this.validOAuthAnswer(answer)
            await this.saveTokens(answer.body)
        } catch (e) {
            this.logWriter.sendError(e, 'updateTokens ERROR')
            throw e
        }
    }

    validOAuthAnswer(answer: any): void {
        if(answer.info.statusCode >= 400) {
            const error = Errors.crmAuthorization(answer)
            this.account.logWriter.sendError(error, error.message)
            throw error
        }
    }

    protected async getApiKeyOfWidget(): Promise<string> {
        const settings = await this.getAmocrmWidgetSettings()
        const key = typeof settings.api_key === 'string' ? settings.api_key : ''
        return key.trim().replace(/^"/, '').replace(/"$/, '')
    }

    private async updateAccountParams(): Promise<void> {
        await this.account.updateAmocrmInterfaceByApi(this.self)
    }

    private async getAmocrmWidgetSettings(): Promise<any> {
        if(!this.module.amocrmCode) return {}
        const options = await this.createAmocrmOptions('/api/v4/widgets/' + this.module.amocrmCode, 'GET')
        const answer = await this.amocrmRequest(options)
        const widget = NodeGetaway.safeParsing(answer.body)

        this.logWriter.sendError(widget, 'WIDGET')

        return NodeGetaway.fetchSettings(widget)
    }

    private static fetchSettings(widget: any): any {
        try{
            return widget.settings || {}
        } catch (e) {
            return {}
        }
    }

    private static safeParsing(content: any|string): any {
        try {
            return typeof content === 'string' ? JSON.parse(content) : content
        } catch (e) {
            return content
        }
    }

    private async saveTokens(answer: any): Promise<void> {
        this._amocrmAccessToken = answer.access_token
        this._amocrmRefreshToken = answer.refresh_token
        this._amocrmShutdownTime = Math.ceil(new Date().getTime() / 1000) + Number.parseInt(answer.expires_in)
        this._amocrmEnable = true
        await this.saveAmocrmInterface()
    }

    async amocrmRequest(request: IRequestOptions): Promise<any> {
        await this.refreshAmocrmTokens()
        this.addHeaders(request)
        return await this.restQuery(request)
    }

    private addHeaders(request: any): void {
        request.headers = request.headers instanceof Object ? request.headers : []
        request.headers['Authorization'] = 'Bearer ' + this.amocrmAccessToken
        request.headers['Content-Type'] = 'application/json'
    }

    protected async restQuery(options: IRequestOptions): Promise<any> {
        const answer = await this.account.executeRestQuery(options, this.logWriter)
        this.validAmocrmApiAnswer(answer)
        return answer
    }

    private validAmocrmApiAnswer(answer: any): void {
        if(answer.info.statusCode === 401)
            this.setAmocrmEnable(false)
    }

    private getInstallData(code: string): OAuthData {
        return {
            client_id: this.module.amocrmIntegrationId,
            client_secret: this.module.amocrmSecretKey,
            grant_type: 'authorization_code',
            code,
            redirect_uri: Configs.amocrmRedirectUri,
        }
    }

    private get refreshStruct(): OAuthData {
        return {
            client_id: this.module.amocrmIntegrationId,
            client_secret: this.module.amocrmSecretKey,
            grant_type: 'refresh_token',
            refresh_token: this.amocrmRefreshToken,
            redirect_uri: Configs.amocrmRedirectUri,
        }
    }

    private createOAuthRequestOptions (grant_type: string, code: string = undefined): IRequestOptions {
        return {
            uri: '/oauth2/access_token',
            body: grant_type === 'authorization_code' ? this.getInstallData(code) : this.refreshStruct,
            method: 'POST',
            headers: {'Content-Type': 'application/json; charset=utf-8'}
        }
    }

    get amocrmAccessToken(): string {
        return this._amocrmAccessToken;
    }

    get amocrmEnable(): boolean {
        return this._amocrmEnable;
    }

    async setAmocrmEnable(value: boolean): Promise<void> {
        this._amocrmEnable = !!value;
        await this.saveAmocrmInterface()
    }

    get amocrmRefreshToken(): string {
        return this._amocrmRefreshToken;
    }

    get amocrmShutdownTime(): number {
        return this._amocrmShutdownTime;
    }

    async createAmocrmOptions(path: string, method: string, body: any = {}): Promise<IRequestOptions> {
        await this.refreshAmocrmTokens()
        return {
            uri: path,
            body,
            method: method.toUpperCase(),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this.amocrmAccessToken
            }
        }
    }
}

export class AmocrmAccountModule extends NodeGetaway implements IAccountModule {
    readonly module: Amocrm.IModule;
    readonly account: Amocrm.IAccount;

    constructor(module: IModule, account: IAccount, model: any) {
        model = model || {}
        const logWriter = new LogJson(account.amocrmReferer, module.code)
        super(module, account, model, logWriter)

        this.module = module
        this.account = account
    }

    get publicModel(): IAmocrmNodeStruct {
        const amocrm = {account: this.account.publicModel,}
        // @ts-ignore
        return Object.assign(super.publicModel, {amocrm_enable: this.amocrmEnable})
    }

    protected async saveAmocrmInterface(): Promise<void> {
        await NodesSchema.saveInterface(this)
    }

    protected get self(): IAccountModule {
        return this
    }
}

export class AmocrmNodesBuffer {
    readonly buffer: Array<IAccountModule> = []

    add(node: IAccountModule): void {
        this.buffer.push(node)
    }

    findByInterface(amocrmId: string, subdomain: string): IAccountModule|null {
        return this.buffer.find(node => node.module.amocrmIntegrationId === amocrmId && node.account.amocrmSubdomain === subdomain)
    }

    find (moduleCode: string, pragmaAccountId: number): IAccountModule|null {
        return this.buffer.find(node => node.module.code === moduleCode && node.account.pragmaAccountId === pragmaAccountId)
    }

    get size(): number {
        return this.buffer.length
    }
}

class NodesSchema extends CRMDB{
    static async findInterface (pragmaModuleId: number, pragmaAccountId: number): Promise<object> {
        const amocrm = super.amocrmModulesTokensSchema
        const condition = `${amocrm}.module_id = ${pragmaModuleId} AND ${amocrm}.pragma_account_id = ${pragmaAccountId}`
        const sql = NodesSchema.sql(condition)
        const answer = await super.query(sql)
        return answer[0] || {}
    }

    private static sql(condition: string): string {
        const amocrm = super.amocrmModulesTokensSchema
        return `SELECT
                    ${amocrm}.enable AS amocrmEnable,
                    ${amocrm}.access_token AS amocrmAccessToken,
                    ${amocrm}.refresh_token AS amocrmRefreshToken,
                    ${amocrm}.date_time AS amocrmShutdownTime
                FROM ${amocrm} WHERE ${condition}`
    }

    static async saveInterface(node: IAccountModule): Promise<void> {
        const amocrm = super.amocrmModulesTokensSchema
        const sql = `INSERT INTO ${amocrm} (module_id, pragma_account_id, enable, access_token, refresh_token, date_time)
                    VALUES (?,?,${node.amocrmEnable},?,?,?)
                    ON DUPLICATE KEY UPDATE
                        ${amocrm}.enable = VALUES(${amocrm}.enable),
                        ${amocrm}.access_token = VALUES(${amocrm}.access_token),
                        ${amocrm}.refresh_token = VALUES(${amocrm}.refresh_token),
                        ${amocrm}.date_time = VALUES(${amocrm}.date_time)`

        const model = [
            node.module.pragmaModuleId,
            node.account.pragmaAccountId,
            // node.amocrmEnable ? 1 : 0,
            node.amocrmAccessToken,
            node.amocrmRefreshToken,
            node.amocrmShutdownTime
        ]
        await super.query(sql, model)
    }
}

export class AmocrmAccountsModules extends MainAccountsModules implements IAccountsModules{
    private static _instance: AmocrmAccountsModules
    protected buffer: AmocrmNodesBuffer

    static get self(): AmocrmAccountsModules {
        if(AmocrmAccountsModules._instance)
            return AmocrmAccountsModules._instance
        AmocrmAccountsModules._instance = new AmocrmAccountsModules()
        return AmocrmAccountsModules._instance
    }

    protected constructor() {
        super();
        this.buffer = new AmocrmNodesBuffer()
    }

    async findAccountModule(amocrmIntegrationId: string, subdomain: string): Promise<IAccountModule|null> {
        const node = this.buffer.findByInterface(amocrmIntegrationId, subdomain)
        if(node) return node

        const moduleAndAccount = await Promise.all([
            this.AmocrmModules.findByAmocrmId(amocrmIntegrationId),
            this.AmocrmAccounts.findByAmocrmSubdomain(subdomain)
        ])
        if(moduleAndAccount[0] && moduleAndAccount[1]) {
            const model = await this.findModel(moduleAndAccount[0], moduleAndAccount[1])
            if(Object.keys(model).length)
                return this.getAccountModule(moduleAndAccount[0], moduleAndAccount[1])
        }
        return null
    }

    private async findModel(module: IModule, account: IAccount): Promise<any> {
        const models = await Promise.all([
            await super.findPragmaModuleModel(module.pragmaModuleId, account.pragmaAccountId),
            await NodesSchema.findInterface(module.pragmaModuleId, account.pragmaAccountId)
        ])
        return Object.assign(models[1], models[0])
    }

    async findNode(module: IModule, account: IAccount): Promise<IAccountModule|null> {
        const node = this.buffer.find(module.code, account.pragmaAccountId)
        if(node)
            return node
        const model = await this.getModel(module, account)
        if(!model || !Object.keys(model).length)
            return null
        return this.createNode(module, account, model)
    }

    async getAccountModule(module: IModule, account: IAccount): Promise<IAccountModule> {
        const node = this.buffer.find(module.code, account.pragmaAccountId)
        if(node) return node
        const model = await this.getModel(module, account)
        return this.createNode(module, account, model)
    }

    private async createNode(module: IModule, account: IAccount, model: any): Promise<IAccountModule> {
        const node = new AmocrmAccountModule(module, account, model)
        this.buffer.add(node)
        return node
    }

    private async getModel(module: IModule, account: IAccount): Promise<any|null> {
        const models = await Promise.all([
            await super.getPragmaNodeModel(module.pragmaModuleId, account.pragmaAccountId),
            await NodesSchema.findInterface(module.pragmaModuleId, account.pragmaAccountId)
        ])
        return Object.assign(models[1], models[0])
    }

    protected get AmocrmModules(): AmocrmModules {
        return AmocrmModules.self
    }

    protected get AmocrmAccounts(): AmocrmAccounts {
        return AmocrmAccounts.self
    }
}