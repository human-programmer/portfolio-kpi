import {Amocrm} from "../../interface/AmocrmInterfaces";
import IAccounts = Amocrm.IAccounts;
import {MainAccount, MainAccounts} from "../../../main/components/accounts/Accounts";
import IAccount = Amocrm.IAccount;
import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {AmocrmGateway} from "../gateway/AmocrmGateway";
import {LogJson} from "../../../../generals/LogWriter";
import {Generals} from "../../../../generals/Interfaces";
import ILogWriter = Generals.ILogWriter;
import IGateway = Amocrm.IGateway;
import IAccountModule = Amocrm.IAccountModule;
import IAmocrmAccountStruct = Amocrm.IAmocrmAccountStruct;
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;
import asLowerVarchar = IBasic.asLowerVarchar;
import asUpperVarchar = IBasic.asUpperVarchar;
import asVarchar = IBasic.asVarchar;
import {IMain} from "../../../main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;

export interface IAmoAccountParams {
    readonly id: number,
    readonly subdomain: string,
    readonly country: string,
    readonly createdAt: number,
    readonly createdBy: number,
    readonly currency: string,
    readonly currencySymbol: string
    readonly isTechnical: boolean,
    readonly name: string
}

abstract class AmocrmAccountGateway extends MainAccount{
    abstract get amocrmReferer(): string

    constructor(accounts: IAccounts, model: any) {
        super(accounts, model)
    }

    protected async amocrmApiAccountParams(node: IAccountModule): Promise<any> {
        const options = await node.createAmocrmOptions('/api/v4/account', 'GET')
        const answer = await node.amocrmRequest(options)
        answer.body = AmocrmAccountGateway.safeParsing(answer.body)
        AmocrmAccountGateway.validAnswer(node, answer)
        return AmocrmAccountGateway.createAnswerParams(answer)
    }

    private static safeParsing(content: any|string): any {
        try {
            return typeof content === 'string' ? JSON.parse(content) : content
        } catch (e) {
            return content
        }
    }

    private static validAnswer(node: IAccountModule, answer: any): void {
        if(answer.info.statusCode >= 400) {
            node.logWriter.sendError(answer, 'Account update Error')
            throw 'Account update Error'
        }
    }

    private static createAnswerParams(answer: any): IAmoAccountParams {
        const body = answer.body
        return {
            id: Number.parseInt(body.id),
            subdomain: asLowerVarchar(body.subdomain, 32),
            country: asUpperVarchar(body.country, 6),
            createdAt: Number.parseInt(body.created_at),
            createdBy: Number.parseInt(body.created_by),
            currency: asUpperVarchar(body.currency, 12),
            currencySymbol: asVarchar(body.currency_symbol, 4),
            isTechnical: !!body.is_technical_account,
            name: asVarchar(body.name, 256),
        }
    }
}

export class AmocrmAccount extends AmocrmAccountGateway implements IAccount {
    private readonly amocrmAccounts: IAccounts

    readonly logWriter: ILogWriter;

    private _amocrmAccountId: number;
    private _amocrmCountry: string;
    private _amocrmCreatedAt: number;
    private _amocrmCreatedBy: number;
    private _amocrmIsTechnical: boolean;
    private _amocrmName: string;
    private _amocrmSubdomain: string;
    private _amocrmCurrency: string
    private _amocrmCurrencySymbol: string

    readonly amocrmGateway: IGateway


    constructor(accounts: IAccounts, model: any) {
        super(accounts, model);

        this.amocrmAccounts = accounts

        this._amocrmAccountId = model.amocrmAccountId || 0
        this._amocrmSubdomain = model.amocrmSubdomain
        this._amocrmCountry = model.amocrmCountry || ''
        this._amocrmCreatedAt = model.amocrmCreatedAt || 0
        this._amocrmCreatedBy = model.amocrmCreatedBy || 0
        this._amocrmIsTechnical = !!model.amocrmIsTechnical
        this._amocrmName = model.amocrmName || ''
        this._amocrmCurrency = model.amocrmCurrency || ''
        this._amocrmCurrencySymbol = model.amocrmCurrencySymbol || ''

        this.logWriter = new LogJson(this.amocrmReferer, 'GENERALS')
        this.amocrmGateway = new AmocrmGateway(this.logWriter)
    }

    async executeRestQuery(options: IRequestOptions, logWriter: ILogWriter): Promise<any> {
        this.addRefererToUri(options)
        return this.amocrmGateway.execute(options, logWriter)
    }

    private addRefererToUri(options: any): void {
        options.uri = 'https://' + this.amocrmReferer + options.uri
    }

    get publicModel(): IAmocrmAccountStruct {
        const interfaceModel = {
            amocrm_account_id: this.amocrmAccountId,
            amocrm_referer: this.amocrmReferer,
            amocrm_subdomain: this.amocrmSubdomain,
            amocrm_country: this.amocrmCountry,
            amocrm_created_at: this.amocrmCreatedAt,
            amocrm_created_by: this.amocrmCreatedBy,
            amocrm_is_technical: this.amocrmIsTechnical,
            amocrm_name: this.amocrmName,
        }
        return Object.assign(interfaceModel, super.publicModel)
    }

    async updateAmocrmInterfaceByApi(node: IAccountModule): Promise<void> {
        const accountParams = await super.amocrmApiAccountParams(node)
        this.setAll(accountParams)
        await this.saveAmocrmInterface()
    }

    protected setAll(params: IAmoAccountParams): void {
        this._amocrmAccountId = params.id
        this._amocrmSubdomain = params.subdomain
        this._amocrmCountry = params.country || ''
        this._amocrmCreatedAt = params.createdAt || 0
        this._amocrmCreatedBy = params.createdBy || 0
        this._amocrmIsTechnical = !!params.isTechnical
        this._amocrmName = params.name || ''
        this._amocrmCurrency = params.currency || ''
        this._amocrmCurrencySymbol = params.currencySymbol || ''
    }

    get amocrmAccountId(): number {
        return this._amocrmAccountId;
    }

    get amocrmCountry(): string {
        return this._amocrmCountry;
    }

    get amocrmCreatedAt(): number {
        return this._amocrmCreatedAt;
    }

    get amocrmCreatedBy(): number {
        return this._amocrmCreatedBy;
    }

    get amocrmReferer(): string {
        return this.amocrmSubdomain + '.amocrm.ru';
    }

    get amocrmIsTechnical(): boolean {
        return this._amocrmIsTechnical;
    }

    get amocrmName(): string {
        return this._amocrmName;
    }

    get amocrmSubdomain(): string {
        return this._amocrmSubdomain;
    }

    get amocrmCurrency(): string {
        return this._amocrmCurrency;
    }

    get amocrmCurrencySymbol(): string {
        return this._amocrmCurrencySymbol;
    }

    async saveAmocrmInterface(): Promise<void> {
        await AmocrmAccountsSchema.saveAccountInterface(this)
    }
}

export class AmocrmAccountBuffer {
    readonly buffer: Array<IAccount> = []

    constructor() {
    }

    add(account: IAccount): void {
        this.buffer.push(account)
    }

    findByPragmaId(pragmaAccountId: number): IAccount|null {
        return this.buffer.find(account => account.pragmaAccountId === pragmaAccountId)
    }

    findByAmocrmId(amocrmAccountId: number): IAccount|null {
        return this.buffer.find(account => account.amocrmAccountId === amocrmAccountId)
    }

    findBySubdomain (subdomain: string): IAccount|null {
        return this.buffer.find(account => account.amocrmSubdomain === subdomain)
    }

    get size(): number {
        return this.buffer.length
    }
}

class AmocrmAccountsSchema extends CRMDB {

    static async saveAccountInterface (account: IAccount): Promise<void> {
        const amocrm = CRMDB.amocrmAccountsSchema
        const sql = `INSERT INTO ${amocrm} (
            id, 
            pragma_id, 
            subdomain, 
            name, 
            created_at, 
            created_by,
            country,
            currency,
            currency_symbol,
            is_technical_account
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            id = VALUES(id),
            subdomain = VALUES(subdomain),
            name = VALUES(name),
            created_at = VALUES(created_at),
            created_by = VALUES(created_by),
            country = VALUES(country),
            currency = VALUES(currency),
            currency_symbol = VALUES(currency_symbol),
            is_technical_account = VALUES(is_technical_account)`

        const model = [
            account.amocrmAccountId,
            account.pragmaAccountId,
            account.amocrmSubdomain,
            account.amocrmName,
            account.amocrmCreatedAt,
            account.amocrmCreatedBy,
            account.amocrmCountry,
            account.amocrmCurrency,
            account.amocrmCurrencySymbol,
            account.amocrmIsTechnical
        ]
        await CRMDB.query(sql, model)
    }

    static async findByPragmaId(pragmaAccountId: number): Promise<object|null> {
        const condition = `${CRMDB.accountSchema}.id = ${pragmaAccountId}`
        return AmocrmAccountsSchema.amocrmSingleSelect(condition)
    }

    static async findByAmocrmId(amocrmAccountId: number): Promise<object|null> {
        const condition = `${CRMDB.amocrmAccountsSchema}.id = ${amocrmAccountId}`
        return AmocrmAccountsSchema.amocrmSingleSelect(condition)
    }

    static async findBySubdomain(subdomain: string): Promise<object|null> {
        const condition = `${CRMDB.amocrmAccountsSchema}.subdomain = '${subdomain}'`
        return AmocrmAccountsSchema.amocrmSingleSelect(condition)
    }

    private static async amocrmSingleSelect(condition: string): Promise<object|null> {
        const sql = AmocrmAccountsSchema.sql(condition)
        const result = await CRMDB.query(sql)
        return result[0] || null
    }

    private static sql(condition: string): string {
        const amocrm = CRMDB.amocrmAccountsSchema
        const pragma = CRMDB.accountSchema
        const crmNames = CRMDB.crmNameSchema
        return `SELECT 
                    ${amocrm}.id AS amocrmAccountId,
                    ${amocrm}.subdomain AS amocrmSubdomain,
                    ${amocrm}.name AS amocrmName,
                    ${amocrm}.created_at AS amocrmCreatedAt,
                    ${amocrm}.created_by AS amocrmCreatedBy,
                    ${amocrm}.country AS amocrmCountry,
                    ${amocrm}.is_technical_account AS amocrmIsTechnical,
                    ${amocrm}.currency AS amocrmCurrency,
                    ${amocrm}.currency_symbol AS amocrmCurrencySymbol,
                    ${pragma}.id AS pragmaAccountId,
                    ${pragma}.date_create AS dateCreate,
                    ${pragma}.test AS pragmaTest,
                    ${crmNames}.name AS crmName
                FROM ${amocrm} 
                    INNER JOIN ${pragma} ON ${pragma}.id = ${amocrm}.pragma_id
                    INNER JOIN ${crmNames} ON ${crmNames}.id = ${pragma}.crm
                WHERE ${condition}`
    }
}

export class AmocrmAccounts extends MainAccounts implements IAccounts{
    private static _amocrmInst: AmocrmAccounts

    protected buffer: AmocrmAccountBuffer

    static get self(): AmocrmAccounts {
        if(AmocrmAccounts._amocrmInst)
            return AmocrmAccounts._amocrmInst
        AmocrmAccounts._amocrmInst = new AmocrmAccounts()
        return AmocrmAccounts._amocrmInst
    }

    protected constructor() {
        super()
        this.buffer = new AmocrmAccountBuffer()
    }

    async createAnGetAccountByReferer(referer: string): Promise<IAccount> {
        const subdomain = AmocrmAccounts.fetchSubdomain(referer)
        return this.createAndGetAmocrmAccount(subdomain)
    }

    async createAndGetAmocrmAccount(amocrmSubdomain: string): Promise<IAccount> {
        const account = await this.findByAmocrmSubdomain(amocrmSubdomain)
        if(account) return account
        return this.createAmocrmAccount(amocrmSubdomain)
    }

    private async createAmocrmAccount(amocrmSubdomain: string): Promise<IAccount> {
        const pragmaAccountId = await this.createPragmaAccount('amocrm')
        const model = {
            amocrmSubdomain,
            pragmaAccountId,
            dateCreate: new Date(),
            crmName: 'amocrm',
        }
        return this._createAccountInstance(model)
    }

    async findByAmocrmId(amocrmAccountId: number): Promise<Amocrm.IAccount | null> {
        return this.buffer.findByAmocrmId(amocrmAccountId) || await this.findInDbByAmocrmId(amocrmAccountId)
    }

    private async findInDbByAmocrmId(amocrmAccountId: number): Promise<IAccount | null> {
        const model = await AmocrmAccountsSchema.findByAmocrmId(amocrmAccountId)
        return model ? this._createAccountInstance(model) : null
    }

    async findByAmocrmReferer (amocrmReferer: string): Promise<IAccount|null> {
        const subdomain = AmocrmAccounts.fetchSubdomain(amocrmReferer)
        return this.findByAmocrmSubdomain(subdomain)
    }

    private static fetchSubdomain(referer: string): string {
        const arr = referer.split('.')
        return arr.slice(0, arr.length - 2).join('.')
    }

    async findByAmocrmSubdomain(amocrmSubdomain: string): Promise<Amocrm.IAccount | null> {
        return this.buffer.findBySubdomain(amocrmSubdomain) || await this.findInDbBySubdomain(amocrmSubdomain)
    }

    private async findInDbBySubdomain(subdomain: string): Promise<IAccount | null> {
        const model = await AmocrmAccountsSchema.findBySubdomain(subdomain)
        return model ? this._createAccountInstance(model) : null
    }

    async getAccount(pragmgaAccountId: number): Promise<Amocrm.IAccount> {
        const account = await this.findAccount(pragmgaAccountId)
        if(!account)
            throw Errors.invalidRequest('Account not found "' + pragmgaAccountId + '"')
        return account
    }

    async findAccount(pragmaAccountId: number): Promise<IAccount|null> {
        return this.buffer.findByPragmaId(pragmaAccountId) || await this.findInDbByPragmaId(pragmaAccountId)
    }

    async findInDbByPragmaId(pragmaAccountId: number): Promise<IAccount|null> {
        const model = await AmocrmAccountsSchema.findByPragmaId(pragmaAccountId)
        return model ? this._createAccountInstance(model) : null
    }

    protected _createAccountInstance(model: object): IAccount {
        const account = new AmocrmAccount(this, model)
        this.buffer.add(account)
        return account
    }
}