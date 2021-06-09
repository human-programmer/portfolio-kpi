import {PragmaAccounts} from "../../../crm_systems/pragma/components/accounts/Accounts";
import {Pragma} from "../../../crm_systems/pragma/instarface/IPragma";
import IAccount = Pragma.IAccount;
import {CRMDB} from "../../../generals/data_base/CRMDB";

export class TestPragmaAccounts extends PragmaAccounts {
    private testAccounts: Array<number> = []

    constructor() {
        super()
    }

    async createTestAccount(crmName: string): Promise<IAccount> {
        const accId = await this.createPragmaAccount(crmName)
        const account = await this.getAccount(accId)
        this.testAccounts.push(account.pragmaAccountId)
        return account
    }

    async clearAllTest(): Promise<void> {
        this.clearBufferTest()
        await this.clearAccountsTest()
    }

    async clearAccountsTest(): Promise<void> {
        const schema = CRMDB.accountSchema
        const condition = this.testAccounts.map(id => `${schema}.id = ${id}`).join(' OR ')
        if(!condition) return;
        const sql = `DELETE FROM ${schema} WHERE ${condition}`
        await CRMDB.query(sql)
        this.testAccounts = []
    }

    clearBufferTest(): void {
        const size = this.buffer.size
        for(let i = 0; i < size; ++i)
            this.buffer.accounts.pop()
    }
}