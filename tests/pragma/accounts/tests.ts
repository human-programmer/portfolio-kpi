import {TestPragmaAccounts} from "./TestPragmaAccounts";
import {Pragma} from "../../../crm_systems/pragma/instarface/IPragma";
import IAccount = Pragma.IAccount;
import {Buffer} from "../../../crm_systems/pragma/components/accounts/Accounts";
import {CRMDB} from "../../../generals/data_base/CRMDB";
const chai = require('chai')

const testAccounts = new TestPragmaAccounts()

export async function testPragmaAccounts(): Promise<void> {
    describe('PragmaAccounts', () => {
        it('Buffer', async () => {
            await testAccounts.clearAllTest()

            const buffer = new Buffer()
            const account1 = await getTestAccount()
            buffer.add(account1)
            chai.assert(buffer.size === 1)
            chai.assert(buffer.find(account1.pragmaAccountId) === account1)
            chai.assert(await testAccounts.getAccount(account1.pragmaAccountId) === account1)

            const account2 = await getTestAccount()
            buffer.add(account2)
            chai.assert(buffer.size === 2)
            chai.assert(buffer.find(account2.pragmaAccountId) === account2)
            chai.assert(await testAccounts.getAccount(account2.pragmaAccountId) === account2)

            await testAccounts.clearAllTest()
        })

        it('crmName', async () => {
            const amocrmAcc = await getTestAccount('bitrix24')
            await testAccounts.clearBufferTest()
            const acc_1 = await testAccounts.getAccount(amocrmAcc.pragmaAccountId)
            chai.assert(acc_1 !== amocrmAcc)
            chai.assert(acc_1.crmName === 'bitrix24')

            const bitrix24Acc = await getTestAccount('amocrm')
            await testAccounts.clearBufferTest()
            const acc_2 = await testAccounts.getAccount(bitrix24Acc.pragmaAccountId)
            chai.assert(acc_2 !== bitrix24Acc)
            chai.assert(acc_2.crmName === 'amocrm')
        })
    })
}

export async function createUniqueAccounts(): Promise<any> {
    const promises = [
        createUniqueAccount(),
        createUniqueAccount(),
        createUniqueAccount(),
        createUniqueAccount(),
    ]
    const accounts = await Promise.all((promises))
    return {
        account0: accounts[0],
        account1: accounts[1],
        account2: accounts[2],
        account3: accounts[3],
    }
}

async function createUniqueAccount(): Promise<IAccount> {
    const accounts = new TestPragmaAccounts()
    setTimeout(() => accounts.clearAccountsTest(), 2000)
    return await accounts.createTestAccount('amocrm')
}

async function getTestAccount(crmName: string = 'amocrm'): Promise<IAccount> {
    return await testAccounts.createTestAccount(crmName)
}