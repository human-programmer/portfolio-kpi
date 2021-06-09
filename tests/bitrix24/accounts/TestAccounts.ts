import {Accounts} from "../../../crm_systems/bitrix24/components/accounts/Accounts";
import {Bitrix24} from "../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IAccount = Bitrix24.IAccount;

export class TestBitrix24Accounts extends Accounts {
    private testAccountsId: Array<string>

    constructor() {
        super();
        this.testAccountsId = []
    }

    async getTestAccount(memberId: string, referer: string, lang: string): Promise<IAccount> {
        this.testAccountsId.push(memberId)
        const account = await this.createAndGetBitrix24Account(memberId)
        this.testAccountsId.push(memberId)
        account.setBitrix24Lang(lang)
        account.setBitrix24Referer(referer)
        await account.save()
        return account
    }

    async clearTestAccounts(): Promise<void> {
        const promises = this.testAccountsId.map(memberId => this.deleteBitrix24TestAccount(memberId))
        this.testAccountsId = []
        this.clearBuffer()
        await Promise.all(promises)
    }

    async deleteBitrix24TestAccount(memberId: string): Promise<void> {
        const pragma = TestBitrix24Accounts.accountSchema
        const bitrix24 = TestBitrix24Accounts.bitrix24AccountSchema
        const sql = `DELETE FROM ${pragma} 
                        WHERE ${pragma}.id = (
                            SELECT 
                                ${bitrix24}.pragma_account_id 
                            FROM ${bitrix24} 
                            WHERE ${bitrix24}.member_id = '${memberId}')`
        await TestBitrix24Accounts.query(sql)
    }

    clearBuffer(): void {
        this.buffer.resetBufferToTest()
    }

    get bufferForTest(){
        return this.buffer
    }
}