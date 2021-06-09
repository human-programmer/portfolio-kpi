import {TestPragmaAccounts} from "./TestPragmaAccounts";
TestPragmaAccounts
const chai = require('chai')
const chaiHttp = require('chai-http')



const testPragmaAccounts = new TestPragmaAccounts()
const accounts_id: Array<number> = []
export async function testMainAccounts(): Promise<void> {
    chai.use(chaiHttp)
    describe('pragmaAccount', () => {
        describe('createPragma', () => {
            it('createPragmaAccount', async () => {
                try {
                    const account = await testPragmaAccounts.getTestAccount()
                    accounts_id.push(account.pragmaAccountId)
                    const accountModel = await testPragmaAccounts.getTestPragmaAccountModel(account.pragmaAccountId)
                    chai.assert(account.pragmaAccountId === accountModel.pragmaAccountId)
                } catch (e) {
                    console.log(e)
                }
            })
        })

        afterEach(() => {
            testPragmaAccounts.clearTestAccounts()
        })
    })
}