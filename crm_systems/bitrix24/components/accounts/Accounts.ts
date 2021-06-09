import AccountsSchema from "./AccountsSchema";
import {Bitrix24} from "../../interface/Bitrix24Interfaces";
import IAccounts = Bitrix24.IAccounts;
import IAccount = Bitrix24.IAccount;
import {MainAccount, MainAccounts} from "../../../main/components/accounts/Accounts";
import IBitrix24AccountStruct = Bitrix24.IBitrix24AccountStruct;


export class Account extends MainAccount implements IAccount {
    readonly bitrix24Accounts: IAccounts
    private _bitrix24Lang: string
    private _bitrix24MemberId: string
    private _bitrix24Referer: string

    constructor(accounts: IAccounts, model: any) {
        super(accounts, model);
        this.bitrix24Accounts = accounts
        this._bitrix24Lang = model.bitrix24Lang || ''
        this._bitrix24MemberId = model.bitrix24MemberId || ''
        this._bitrix24Referer = model.bitrix24Referer || ''
    }

    async save(): Promise<void> {
        await Promise.all([
            this.saveBitrix24Interface(),
            this.saveMain()
        ])
    }

    async saveBitrix24Interface(): Promise<void> {
        await this.bitrix24Accounts.saveBitrix24(this)
    }

    get bitrix24Lang(): string {
        return this._bitrix24Lang
    }

    setBitrix24Lang(lang: string): void {
        this._bitrix24Lang = lang
    }

    get bitrix24MemberId(): string {
        return this._bitrix24MemberId
    }

    get bitrix24Referer(): string {
        return this._bitrix24Referer
    }

    setBitrix24Referer(referer: string): void {
        this._bitrix24Referer = referer
    }

    get publicModel(): IBitrix24AccountStruct {
        return Object.assign({
            bitrix24_lang: this.bitrix24Lang,
            bitrix24_member_id: this.bitrix24MemberId,
            bitrix24_referer: this.bitrix24Referer,
        }, super.publicModel)
    }

    toString(): string {
        return JSON.stringify(this.publicModel)
    }
}

class AccountsBuffer {
    private accounts: Array<IAccount> = []

    constructor() {
    }

    findByMemberId(memberId: string): IAccount|null {
        return this.accounts.find(account => account.bitrix24MemberId === memberId)
    }

    findAccount(pragmaAccountId: number): IAccount|null {
        return this.accounts.find(account => account.pragmaAccountId === pragmaAccountId)
    }

    addAccount(account: IAccount) : void {
        this.accounts.push(account)
    }

    resetBufferToTest(): void {
        // @ts-ignore
        this.accounts = []
    }

    get accountForTest(): Array<IAccount> {
        return this.accounts
    }
}

export class Accounts extends MainAccounts implements IAccounts {
    private readonly schema: AccountsSchema
    protected readonly buffer: AccountsBuffer

    private static _inst: Accounts

    static getAccounts() : IAccounts {
        if(Accounts._inst) return Accounts._inst
        Accounts._inst = new Accounts()
        return Accounts._inst
    }

    protected static _setInstForTest(accounts: Accounts): void {
        Accounts._inst = accounts
    }

    protected constructor() {
        super();
        this.schema = new AccountsSchema()
        this.buffer = new AccountsBuffer()
    }

    async getBitrix24Account(pragmaAccountId: number): Promise<IAccount> {
        return this.buffer.findAccount(pragmaAccountId) || await this.findInDb(pragmaAccountId);
    }

    private async findInDb (pragmaAccountId: number): Promise<IAccount> {
        const accountsModel = await this.schema.getBitrix24AccountRow(pragmaAccountId)
        return this.createAccountInstance(accountsModel)
    }

    async createAndGetBitrix24Account(bitrix24emberId: string): Promise<Bitrix24.IAccount> {
        return this.buffer.findByMemberId(bitrix24emberId) || this.createAndGetFromDb(bitrix24emberId);
    }

    async findAccounts(bitrix24MembersId: Array<string>|string): Promise<Array<IAccount>> {
        bitrix24MembersId = Array.isArray(bitrix24MembersId) ? bitrix24MembersId : [bitrix24MembersId]
        const promises = bitrix24MembersId.map(memberId => this.findAccount(memberId))
        const accounts = await Promise.all(promises)
        return accounts.filter(i => i)
    }

    async findAccount(bitrix24MemberId: string): Promise<IAccount|null> {
        return this.buffer.findByMemberId(bitrix24MemberId) || await this.findInDbByMemberId(bitrix24MemberId)
    }

    private async createAndGetFromDb(memberId: string): Promise<IAccount> {
        let account = await this.findInDbByMemberId(memberId);
        if(account) return account
        const pragmaAccountId = await this.createPragmaAccount('bitrix24')
        await this.saveMemberId(pragmaAccountId, memberId)
        return this.getBitrix24Account(pragmaAccountId)
    }

    protected async saveMemberId(pragmaAccountId: number, memberId: string): Promise<void> {
        await this.schema.saveMemberId(pragmaAccountId, memberId)
    }

    private async findInDbByMemberId (memberId: string): Promise<IAccount|null> {
        const account_row = await this.schema.getBitrix24AccountRowByMemberId(memberId)
        return account_row ? this.createAccountInstance(account_row) : null
    }

    private createAccountInstance (accountModel: Object) : IAccount {
        const account = new Account(this, accountModel)
        this.buffer.addAccount(account)
        return account
    }

    async saveBitrix24(account: Bitrix24.IAccount): Promise<void> {
        await this.schema.saveAccountRow(account)
    }
}