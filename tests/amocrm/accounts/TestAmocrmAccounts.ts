import {
    AmocrmAccount,
    AmocrmAccounts,
    IAmoAccountParams
} from "../../../crm_systems/amocrm/components/accounts/AmocrmAccounts";
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAccount = Amocrm.IAccount;
import {CRMDB} from "../../../generals/data_base/CRMDB";
import IAccountModule = Amocrm.IAccountModule;

class TestAmocrmAccount extends AmocrmAccount {
    testParamsCreator: any

    constructor(accounts: TestAmocrmAccounts, model: any) {
        super(accounts, model);
    }

    setAll(params: IAmoAccountParams): void {
        super.setAll(params)
    }

    async amocrmApiAccountParams(node: IAccountModule): Promise<any> {
        return new Promise(resolve => {
            setTimeout(() => resolve(this.testParamsCreator()), 100)
        })
    }
}

export class TestAmocrmAccounts extends AmocrmAccounts{
    readonly testAccounts: Array<number> = []
    testParamsCreator: any

    constructor() {
        super()
    }

    _createAccountInstance(model: object): IAccount {
        const account = new TestAmocrmAccount(this, model)
        this.buffer.add(account)
        return account
    }

    async createTestDefaultAccount(subdomain?: string ): Promise<IAccount> {
        const params = TestAmocrmAccounts.getTestDefaultParams(subdomain)
        const account = await this.createAndGetAmocrmAccount(params.subdomain)
        // @ts-ignore
        account.setAll(params)
        // @ts-ignore
        await account.saveAmocrmInterface()
        return account
    }

    async createAndGetAmocrmAccount (amocrmSubdomain: string): Promise<IAccount> {
        const account = await super.createAndGetAmocrmAccount(amocrmSubdomain)
        // @ts-ignore
        account.testParamsCreator = this.testParamsCreator
        this.testAccounts.push(account.pragmaAccountId)
        return account
    }

    async clearTests(): Promise<void> {
        const condition = this.testAccounts.map(id => 'id = ' + id).join(' OR ')
        if(!condition) return;
        const sql = `DELETE FROM ${CRMDB.accountSchema} WHERE ${condition}`
        await CRMDB.query(sql)
    }

    clearBufferTest(): void {
        const size = this.buffer.size
        for (let i = 0; i < size; i++)
            this.buffer.buffer.pop()
    }

    async clearAllTests(): Promise<void> {
        this.clearBufferTest()
        await this.clearTests()
    }

    private static getTestDefaultParams(subdomain?: string): IAmoAccountParams {
        const time = new Date().getTime()
        const uniqueId = Math.ceil((time << 5) * Math.random())

        return {
            id: uniqueId,
            subdomain: subdomain ? subdomain : ('testSubdomain_' + uniqueId),
            country: 'by',
            createdAt: Math.ceil(time / 1000),
            createdBy: time << 6,
            currency: 'USD',
            currencySymbol: '$',
            isTechnical: true,
            name: 'TEST_CRM',
        }
    }
}