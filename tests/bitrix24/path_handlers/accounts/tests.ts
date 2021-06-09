import {IBasic} from "../../../../generals/IBasic";
const testError = IBasic.testError

const chai = require('chai')
import {TestAccountsHandler} from "./TestAccountsHandler";
import {TestBitrix24Accounts} from "../../accounts/TestAccounts";
import {Bitrix24} from "../../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IAccount = Bitrix24.IAccount;
import {Bitrix24AccountsHandler} from "../../../../crm_systems/bitrix24/path_handlers/accounts/Bitrix24AccountsHandler";
import Errors = IBasic.Errors;
import {BITRIX24_ACCOUNTS_ROUTE} from "../../../../crm_systems/bitrix24/BITIX24_CRONSTANTS";

const testAccounts = new TestBitrix24Accounts()
const PATH = BITRIX24_ACCOUNTS_ROUTE
const testClientCode = 'testClientCode'
const testClientMemberId = 'sdfsdfsdfsd'


function checkAccount (accountAnswer: any, expectedAccount: IAccount): void {
    chai.assert(accountAnswer.pragma_account_id === expectedAccount.pragmaAccountId)
    chai.assert(accountAnswer.pragma_time_create === expectedAccount.timeCreateSeconds)
    chai.assert(accountAnswer.bitrix24_lang === expectedAccount.bitrix24Lang)
    chai.assert(accountAnswer.bitrix24_member_id === expectedAccount.bitrix24MemberId)
    chai.assert(accountAnswer.bitrix24_referer === expectedAccount.bitrix24Referer)
}

export async function testBitrix24AccountsHandler(): Promise<void> {
    describe('Bitrix24AccountsHandler', () => {
        describe('error requests', () => {
            it('Wrong path', async () => {
                const testRequest = {
                    query: {},
                    basePath: PATH + '1'
                }

                const answer = await TestAccountsHandler.execute(testRequest)
                testError(answer.result, Errors.invalidRequestCode)
            })
            it('empty request', async () => {
                const testRequest = {
                    query: {},
                    basePath: PATH
                }

                const answer = await TestAccountsHandler.execute(testRequest)
                testError(answer.result, Errors.invalidRequestCode)
            })
        })


        describe('correct requests', () => {

            it('routeOwner', () => {
                chai.assert(Bitrix24AccountsHandler.isRouteOwner(PATH))
                chai.assert(!Bitrix24AccountsHandler.isRouteOwner(PATH + '1'))
            })

            it('single member id', async () => {
                const testMemberId = 'test'
                const test_referer = 'werwer'
                const testAccount = await testAccounts.getTestAccount(testMemberId, test_referer, '')

                const testRequest = {
                    query: {filter: {members_id: testMemberId}, client_module_code: testClientCode},
                    basePath: PATH
                }

                const answer: any = await TestAccountsHandler.execute(testRequest)
                chai.assert(answer.result instanceof Array)
                chai.assert(answer.result.length === 1)
                const account = answer.result[0]
                chai.assert(account.bitrix24_member_id === testMemberId)
                chai.assert(account.bitrix24_referer === test_referer)
                checkAccount(account, testAccount)
            })

            it('some members id', async () => {
                const members_id0: string = 'test1_lfkhnkjfhn'
                const member_id1: string = 'sdsfsdf'
                const test_account0 = await testAccounts.getTestAccount(members_id0, members_id0 + 'referer', '')
                const test_account1 = await testAccounts.getTestAccount(member_id1, member_id1 + 'referer', '')
                const testRequest = {
                    query: {filter: {members_id: [members_id0, member_id1]}, client_module_code: testClientCode},
                    basePath: PATH
                }

                const answer: any = await TestAccountsHandler.execute(testRequest)
                chai.assert(answer.result instanceof Array)
                chai.assert(answer.result.length === 2)
                checkAccount(test_account0, answer.result[0])
                checkAccount(test_account1, answer.result[1])
            })

            it('Accounts not found', async () => {
                const members_id: Array<string> = ['test1_werwesdn', 'test2fs_sfssdfsddgdg']
                const testRequest = {
                    query: {filter: {members_id}, client_module_code: testClientCode},
                    basePath: PATH
                }

                const answer = await TestAccountsHandler.execute(testRequest)
                chai.assert(answer.result instanceof Array)
                chai.assert(answer.result.length === 0)
            })
        })

        afterEach(() => testAccounts.clearTestAccounts())
    })
}