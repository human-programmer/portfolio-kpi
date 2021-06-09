import {MainAccount, MainAccounts} from "../../../crm_systems/main/components/accounts/Accounts";
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import IAccount = IMain.IAccount;
import {HttpsClient} from "../../../crm_systems/main/HttpsClient";

class TestClient extends HttpsClient {

}

class TestPragmaAccount extends MainAccount {
    httpsClient(): IMain.IHttpsClient {
        return undefined;
    }
}

export class TestPragmaAccounts extends MainAccounts {
    private testAccountsId: Array<number>

    constructor() {
        super();
        this.testAccountsId = []
    }

    async getTestPragmaAccountModel (pragmaAccountId: number): Promise<any> {
        const schema = MainAccounts.accountSchema
        const sql = `SELECT
                        id AS pragmaAccountId,
                        date_create AS dateCreate
                    FROM ${schema}
                    WHERE ${schema}.id = ${pragmaAccountId}`
        const result = await MainAccounts.query(sql)
        return result[0]
    }

    async getTestAccount() : Promise<IMain.IAccount> {
        const id = await this.createPragmaAccount('bitrix24')
        this.testAccountsId.push(id)
        return this.queryTestAccount(id)
    }

    async queryTestAccount(id: number): Promise<IAccount> {
        const model = await this.getTestPragmaAccountModel(id)
        return new TestPragmaAccount(this, model)
    }

    async clearTestAccounts(): Promise<void> {
        const promises = this.testAccountsId.map(id => this.deleteTestAccount(id))
        this.testAccountsId = []
        await Promise.all(promises)
    }

    async deleteTestAccount(id: number): Promise<void> {
        const schema = MainAccounts.accountSchema
        const sql = `DELETE FROM ${schema} WHERE ${schema}.id = ${id}`
        MainAccounts.query(sql)
    }
}