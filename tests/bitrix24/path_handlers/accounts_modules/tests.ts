import {TestBitrix24Accounts} from "../../accounts/TestAccounts";

const chai = require('chai')
import {IBasic} from "../../../../generals/IBasic";
import testError = IBasic.testError;
import {TestAccountsModulesHandler} from "./TestAccountsModulesHandler";
import {TestBitrix24Modules} from "../../modules/TestBitrix24Modules";
import {Bitrix24AccountsHandler} from "../../../../crm_systems/bitrix24/path_handlers/accounts/Bitrix24AccountsHandler";
import {Bitrix24AccountsModulesHandler} from "../../../../crm_systems/bitrix24/path_handlers/accounts_modules/Bitrix24AccountsModulesHandler";
import Errors = IBasic.Errors;
import {BITRIX24_NODES_ROUTE} from "../../../../crm_systems/bitrix24/BITIX24_CRONSTANTS";

const PATH: string = BITRIX24_NODES_ROUTE

const testClientModuleCode = 'testClientCode'
const testFilterModuleCode = 'testFilterModulesdfsdfsdf'
const testAccountMemberId = 'testmemberId_sdkjkdfkgodfg'

const testAccounts = new TestBitrix24Accounts()
const testModules = new TestBitrix24Modules()

export async function testBitrix24AccountsModulesHandler(): Promise<void> {

    describe('bitrix24 accounts modules handler', () => {
        describe('Errors', () => {
            it('Request route is undefined', async () => {
                const testRequest = {query: {}, client_module_code: testClientModuleCode, basePath: ''}
                const answer = await TestAccountsModulesHandler.execute(testRequest)
                testError(answer.result, 1001)
            })
            it('Wrong path', async () => {
                const testRequest = {
                    query: {client_module_code: testClientModuleCode},
                    basePath: '/wrongPath'
                }

                const answer = await TestAccountsModulesHandler.execute(testRequest)
                testError(answer.result, 1001)
            })
        })

        describe('Correct requests', () => {
            it('routeOwner', () => {
                chai.assert(Bitrix24AccountsModulesHandler.isRouteOwner(PATH))
                chai.assert(!Bitrix24AccountsModulesHandler.isRouteOwner(PATH + '1'))
            })

            it('allNodes', async () => {
                const testRequest = {
                    query: {client_module_code: testClientModuleCode},
                    basePath: PATH
                }

                const answer: any = await TestAccountsModulesHandler.execute(testRequest)
                chai.assert(answer.result.error === true)
                chai.assert(answer.result.code === 1000)
            })
            it('allNodesOfModule', async () => {
                const testRequest = {
                    query: {filter: {module_code: testFilterModuleCode}, client_module_code: testClientModuleCode},
                    basePath: PATH
                }
                const answer: any = await TestAccountsModulesHandler.execute(testRequest)
                chai.assert(answer.result.error === true)
                chai.assert(answer.result.code === 1000)
            })

            it('allNodesOfAccount', async () => {
                const testRequest = {
                    query: {filter: {account_member_id: testAccountMemberId}, client_module_code: testClientModuleCode},
                    basePath: PATH
                }
                const answer:any = await TestAccountsModulesHandler.execute(testRequest)
                chai.assert(answer.result.error === true)
                chai.assert(answer.result.code === 1000)
            })

            it('singleNode', async () => {
                const frePeriod = 34
                const account = await testAccounts.getTestAccount(testAccountMemberId, 'sdkfjlghidfgid', 'rt')
                const module = await testModules.getTestModule(testFilterModuleCode, frePeriod, 'dfgdfgdfga', 'sfsdf', 'dfg')

                const filter = {
                    module_code: testFilterModuleCode,
                    member_id: testAccountMemberId
                }

                const testRequest = {
                    query: {filter, client_module_code: testClientModuleCode},
                    basePath: PATH
                }

                let answer: any = await TestAccountsModulesHandler.execute(testRequest)
                answer = answer.result
                chai.assert(!!answer.length)

                const accountModuleModel: any = answer[0]
                chai.assert(accountModuleModel.account.pragma_account_id === account.pragmaAccountId)
                chai.assert(accountModuleModel.account.pragma_time_create === account.timeCreateSeconds)
                chai.assert(accountModuleModel.account.bitrix24_lang === account.bitrix24Lang)
                chai.assert(accountModuleModel.account.bitrix24_member_id === account.bitrix24MemberId)
                chai.assert(accountModuleModel.account.bitrix24_referer === account.bitrix24Referer)

                chai.assert(accountModuleModel.module.pragma_module_id === module.pragmaModuleId)
                chai.assert(accountModuleModel.module.free_period_days === module.freePeriodDays)
                chai.assert(accountModuleModel.module.is_free === module.isFree)
                chai.assert(accountModuleModel.module.code === module.code)
                chai.assert(accountModuleModel.module.bitrix24_integration_id === module.bitrix24IntegrationId)
                chai.assert(accountModuleModel.module.bitrix24_handler_path === module.bitrix24HandlerPath)
            })

            it('Unknown account', async () => {
                const filter = {
                    module_code: 'ieruierui4954769476867',
                    member_id: 'testAccountMemberId'
                }
                await testModules.getTestModule(filter.module_code, 3, 'dfgdfg', 'dfgdfgdfsdf', 'dfgsd')
                const testRequest = {
                    query: {filter, client_module_code: testClientModuleCode},
                    basePath: PATH
                }

                let answer: any = await TestAccountsModulesHandler.execute(testRequest)
                chai.assert(answer.result.error)
                chai.assert(answer.result.code === Errors.notFoundCode)
            })

            it('Unknown module', async () => {
                testAccounts.clearTestAccounts()
                const filter = {
                    module_code: 'testFilterModuleCode98789897789789547854879',
                    member_id: 'testAccountMemberId0934899978348973478912'
                }
                await testAccounts.getTestAccount(filter.member_id, 'sdkfjlghidfgid', '')
                const testRequest = {
                    query: {filter, client_module_code: testClientModuleCode},
                    basePath: PATH
                }

                let answer: any = await TestAccountsModulesHandler.execute(testRequest)
                chai.assert(answer.result.error)
                chai.assert(answer.result.code === Errors.notFoundCode)
            })

            afterEach(() => testAccounts.clearTestAccounts())
        })
    })
}