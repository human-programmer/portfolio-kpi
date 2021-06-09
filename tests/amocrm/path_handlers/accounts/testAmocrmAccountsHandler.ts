import {AmocrmAccountsHandler} from "../../../../crm_systems/amocrm/path_handlers/accounts/AmocrmAccountsHandler";
import {IBasic} from "../../../../generals/IBasic";
import {IServer} from "../../../../server/intrfaces";
import IRequest = IServer.IInputRequest;
import IQuery = IServer.IInputQuery;
import testError = IBasic.testError;
import Errors = IBasic.Errors;
import {TestAmocrmAccounts} from "../../accounts/TestAmocrmAccounts";
import {checkAccountModel} from "../../accounts/tests";
import {Amocrm} from "../../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAccount = Amocrm.IAccount;
import IAmocrmAccountStruct = Amocrm.IAmocrmAccountStruct;
import {TestAmocrmModules} from "../../modules/TestAmocrmModules";
import {AMOCRM_ACCOUNTS_ROUTE} from "../../../../crm_systems/amocrm/AMOCRM_CONSTANTS";

const chai = require('chai')

const PATH = AMOCRM_ACCOUNTS_ROUTE + '/get'


function getDefaultQuery(filter: any = {}, code, referer): IQuery {
    return {
        client_module_code: code,
        account_referer: referer,
        filter,
    }
}

function getDefaultRequest(filter: any = {}, code, referer): IRequest {
    return {
        method: 'get',
        crmName: 'amocrm',
        entity: 'accounts',
        query: getDefaultQuery(filter, code, referer)
    }
}

export async function testAmocrmAccountsHandler(): Promise<void> {
    describe('AmocrmAccountsHandler', () => {
        describe('Errors', () => {
            it('Wrong Path', async () => {
                const request: IRequest = {
                    method: 'get1',
                    crmName: 'amocrm',
                    entity: 'accounts',
                    query: getDefaultQuery({}, 'qwe', 'qqwe')
                }
                const answer = await AmocrmAccountsHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode)
            })
        })
        describe('success', () => {
            it('Single Referer', async () => {
                const {testAccount, testAccount1, testAccount2, client_account, client_module} = await init();

                const request = getDefaultRequest({amocrm_referer: testAccount.amocrmReferer}, client_module.code, client_account.amocrmReferer)
                const answer = await AmocrmAccountsHandler.execute(request)

                chai.assert(answer.result.length === 1)
                checkAccountModel(testAccount, answer.result[0])
            })

            it('Some referer', async () => {
                const {testAccount, testAccount1, testAccount2, client_account, client_module} = await init();

                const filter = {amocrm_referer: [testAccount.amocrmReferer, testAccount1.amocrmReferer, testAccount1.amocrmReferer]}
                const request1 = getDefaultRequest(filter, client_module.code, client_account.amocrmReferer)
                const answer1 = await AmocrmAccountsHandler.execute(request1)
                chai.assert(answer1.result.length === 2)
                checkAccountsModels([testAccount, testAccount1], answer1.result)
            })

            it('Single amocrm_account_id', async () => {
                const {testAccount, testAccount1, testAccount2, client_account, client_module} = await init();

                const filter = {amocrm_account_id: testAccount.amocrmAccountId}
                const request = getDefaultRequest(filter, client_module.code, client_account.amocrmReferer)
                const answer = await AmocrmAccountsHandler.execute(request)

                chai.assert(answer.result.length === 1)
                checkAccountModel(testAccount, answer.result[0])
            })

            it('Some amocrm_account_id', async () => {
                const {testAccount, testAccount1, testAccount2, client_account, client_module} = await init();

                const filter = {amocrm_account_id: [testAccount.amocrmAccountId, testAccount1.amocrmAccountId, testAccount1.amocrmAccountId]}
                const request1 = getDefaultRequest(filter, client_module.code, client_account.amocrmReferer)
                const answer1 = await AmocrmAccountsHandler.execute(request1)
                chai.assert(answer1.result.length === 2)
                checkAccountsModels([testAccount, testAccount1], answer1.result)
            })

            it('Single amocrm_account_id, referer', async () => {
                const {testAccount, testAccount1, testAccount2, client_account, client_module} = await init();

                const filter = {amocrm_account_id: testAccount.amocrmAccountId, amocrm_referer: testAccount1.amocrmReferer}
                const request1 = getDefaultRequest(filter, client_module.code, client_account.amocrmReferer)
                const answer1 = await AmocrmAccountsHandler.execute(request1)
                chai.assert(answer1.result.length === 2)
                checkAccountsModels([testAccount, testAccount1], answer1.result)
            })

            it('Some amocrm_account_id, referer', async () => {
                const {testAccount, testAccount1, testAccount2, client_account, client_module} = await init();

                const filter = {
                    amocrm_account_id: [testAccount.amocrmAccountId, testAccount2.amocrmAccountId],
                        amocrm_referer: [testAccount1.amocrmReferer, testAccount2.amocrmReferer]
                }
                const request1 = getDefaultRequest(filter, client_module.code, client_account.amocrmReferer)
                const answer1 = await AmocrmAccountsHandler.execute(request1)
                chai.assert(answer1.result.length === 3)
                checkAccountsModels([testAccount, testAccount1, testAccount2], answer1.result)
            })

            it('Single pragma_account_id', async () => {
                const {testAccount, testAccount1, testAccount2, client_account, client_module} = await init();

                const filter = {pragma_account_id: testAccount.pragmaAccountId,}
                const request1 = getDefaultRequest(filter, client_module.code, client_account.amocrmReferer)
                const answer1 = await AmocrmAccountsHandler.execute(request1)
                chai.assert(answer1.result.length === 1)
                checkAccountsModels([testAccount], answer1.result)
            })
        })
    })
}

async function init(): Promise<any> {
    const testAccounts = new TestAmocrmAccounts()
    const testModules = new TestAmocrmModules()
    setTimeout(() => clearAll(testAccounts, testModules), 2000)
    const clients = await createTests(testAccounts, testModules)
    const accounts = await createAccounts(testAccounts);
    return Object.assign(clients, accounts)
}

async function clearAll(accounts?, modules?): Promise<void> {
    try {
        await Promise.all([
            accounts.clearTests(),
            modules.clearTestAll()
        ])
    } catch (e) {
        throw e
    }
}

async function createTests(accounts?, modules?): Promise<any> {
    const testModuleCode = 'c.' + new Date().getTime()
    const testAccountSubdomain = 's.' + new Date().getTime()
    const client_module = await modules.createTestModule(testModuleCode, 100, testModuleCode + 'a', 'i.' + testModuleCode, 'dhd')
    const client_account = await accounts.createTestDefaultAccount(testAccountSubdomain)
    return {client_module, client_account}
}

async function createAccounts(accounts?): Promise<any> {
    return {
        testAccount: await  accounts.createTestDefaultAccount(),
        testAccount1: await  accounts.createTestDefaultAccount(),
        testAccount2: await  accounts.createTestDefaultAccount(),
    }
}

function checkAccountsModels(accounts: Array<IAccount>, models: Array<IAmocrmAccountStruct>): void {
    models.forEach(model => {
        const account = accounts.find(acc => acc.pragmaAccountId === model.pragma_account_id)
        checkAccountModel(account, model)
    })
}