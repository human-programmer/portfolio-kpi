import {Bitrix24} from "../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IAccount = Bitrix24.IAccount;
import * as chai from "chai";
import {TestBitrix24Accounts} from "./TestAccounts";

const memberId = 'werwerdssdr23r3423423'
const testReferer = 'test.test.rw'

async function update(account: IAccount): Promise<void> {
    account.setBitrix24Lang(testAccountModel.bitrix24Lang)
    account.setBitrix24Referer(testAccountModel.bitrix24Referer)
    await account.save()
}

const testAccountModel = {
    bitrix24Lang: 'Lang',
    bitrix24MemberId: memberId,
    bitrix24Referer: testReferer,
}

const testAccounts = new TestBitrix24Accounts()

export async function bitrix24AccountsTest() : Promise<void>{
    describe('Bitrix24Account', async () => {
        describe('buffer', async () => {
            it('buffer', async () => {
                testAccounts.clearBuffer()
                const memberId = 'testBuffer0'
                const account0 = await testAccounts.getTestAccount(memberId, 'qweretert', '')

                const bufferAccount0 = testAccounts.bufferForTest.accountForTest.find(acc => acc === account0)
                chai.assert(bufferAccount0 === account0)

                const account1 = await testAccounts.createAndGetBitrix24Account(memberId)
                chai.assert(account1 === account0)

                const account2 = await testAccounts.getBitrix24Account(account0.pragmaAccountId)
                chai.assert(account0 === account2)

                chai.assert(testAccounts.bufferForTest.accountForTest.length === 1)
            })
        })

        describe('getters', async () => {
            it('createAndGetBitrix24Account', async () => {
                const account = await testAccounts.createAndGetBitrix24Account(memberId)
                chai.assert(account.bitrix24MemberId === memberId)
                chai.assert(account.crmName === 'bitrix24')
                await update(account)
                testAccounts.clearBuffer()
                const account2 = await testAccounts.getBitrix24Account(account.pragmaAccountId)
                chai.assert(account !== account2)
                chai.assert(account2.pragmaAccountId === account.pragmaAccountId)
                chai.assert(account2.dateCreate.getTime() === account.dateCreate.getTime())
                chai.assert(account2.timeCreateSeconds === account.timeCreateSeconds)

                chai.assert(account2.bitrix24Lang === account.bitrix24Lang)
                chai.assert(account2.bitrix24Lang === testAccountModel.bitrix24Lang)

                chai.assert(account2.bitrix24MemberId === account.bitrix24MemberId)
                chai.assert(account2.bitrix24MemberId === testAccountModel.bitrix24MemberId)

                chai.assert(account2.bitrix24Referer === account.bitrix24Referer)
                chai.assert(account2.bitrix24Referer === testAccountModel.bitrix24Referer)
            })
        })

        afterEach(async () => {
            await testAccounts.clearTestAccounts()
        })
    })
}