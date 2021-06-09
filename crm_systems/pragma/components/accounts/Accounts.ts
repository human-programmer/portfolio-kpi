import {MainAccount, MainAccounts} from "../../../main/components/accounts/Accounts";
import {Pragma} from "../../instarface/IPragma";
import IAccounts = Pragma.IAccounts;
import IAccount = Pragma.IAccount;
import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;

class PragmaAccount extends MainAccount implements IAccount {

}

export class Buffer {
    readonly accounts: Array<IAccount> = []

    constructor() {
    }

    add(account: IAccount): void {
        this.accounts.push(account)
    }

    find(pragmaAccountId: number): IAccount|null {
        return this.accounts.find(account => account.pragmaAccountId === pragmaAccountId)
    }

    get size(): number {
        return this.accounts.length
    }
}

class PragmaAccountsSchema extends CRMDB {
    static async get(pragmaAccountId: number): Promise<any> {
        const condition = `${super.accountSchema}.id = ?`
        const sql = PragmaAccountsSchema.sql(condition)
        const result = await super.query(sql, [pragmaAccountId])
        if(result.length === 0)
            throw Errors.invalidRequest('Account not found "' + pragmaAccountId + '"')
        return result[0]
    }

    private static sql(condition: string): string {
        const pragma = super.accountSchema
        const crmNames = super.crmNameSchema
        return `SELECT 
                    ${pragma}.id AS pragmaAccountId,
                    ${pragma}.date_create AS dateCreate,
                    ${pragma}.test AS pragmaTest,
                    ${crmNames}.name AS crmName
                FROM ${pragma} 
                    INNER JOIN ${crmNames} ON ${crmNames}.id = ${pragma}.crm
                WHERE ${condition}`
    }
}

export class PragmaAccounts extends MainAccounts implements IAccounts {
    private static inst: PragmaAccounts
    protected readonly buffer: Buffer

    static get self(): PragmaAccounts {
        if(PragmaAccounts.inst) return PragmaAccounts.inst
        PragmaAccounts.inst = new PragmaAccounts()
        return PragmaAccounts.inst
    }

    protected constructor() {
        super()
        this.buffer = new Buffer()
    }

    async getAccount(pragmaAccountId: number): Promise<Pragma.IAccount> {
        return this.buffer.find(pragmaAccountId) || await this.getFromDb(pragmaAccountId)
    }

    private async getFromDb(pragmaAccountId: number): Promise<Pragma.IAccount> {
        const model = await PragmaAccountsSchema.get(pragmaAccountId)
        return this.createInstance(model)
    }

    private createInstance(model: any): IAccount {
        const account = new PragmaAccount(this, model)
        this.buffer.add(account)
        return account
    }
}