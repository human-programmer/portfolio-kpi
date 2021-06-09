import {PWorkers} from "../../../server/PWorkers";
import {TestBitrix24Accounts} from "../accounts/TestAccounts";
import {TestBitrix24Modules} from "../modules/TestBitrix24Modules";
import {Bitrix24} from "../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IAccount = Bitrix24.IAccount;
import IModule = Bitrix24.IModule;
import {IBasic} from "../../../generals/IBasic";
import Errors = IBasic.Errors;
import {
    BITRIX24_ACCOUNTS_ROUTE,
    BITRIX24_INSTALL_ROUTE,
    BITRIX24_NODES_ROUTE
} from "../../../crm_systems/bitrix24/BITIX24_CRONSTANTS";

const chai = require('chai')

const bitrix24Worker = PWorkers.PragmaWorkers.bitrix24RequestWorker

const AccountsPath = BITRIX24_ACCOUNTS_ROUTE
const AccountsModulesPath = BITRIX24_NODES_ROUTE
const installPath = BITRIX24_INSTALL_ROUTE
const testMemberId = 'testMember3945093458'
const testCode = 'testCode3094984375'
const testLang = 'fggh'

const testAccounts = new TestBitrix24Accounts()
const testModules = new TestBitrix24Modules()

let testAccount: IAccount
let testModule: IModule

function getRequest(): any {
    return {
        basePath: '',
        query: {}
    }
}

function compareAccounts(account_model: any, account_instance: IAccount): void {
    chai.assert(account_model.pragma_account_id === account_instance.pragmaAccountId)
    chai.assert(account_model.pragma_time_create === account_instance.timeCreateSeconds)
    chai.assert(account_model.bitrix24_lang === account_instance.bitrix24Lang)
    chai.assert(account_model.bitrix24_member_id === account_instance.bitrix24MemberId)
}

function compareModules(moduleModel: any, module_instance: IModule): void {
    chai.assert(moduleModel.free_period_days === module_instance.freePeriodDays)
    chai.assert(moduleModel.is_free === module_instance.isFree)
    chai.assert(moduleModel.code === module_instance.code)
    chai.assert(moduleModel.pragma_module_id === module_instance.pragmaModuleId)
    chai.assert(moduleModel.bitrix24_integration_id === module_instance.bitrix24IntegrationId)
    chai.assert(moduleModel.bitrix24_handler_path === module_instance.bitrix24HandlerPath)
}

async function createTests(): Promise<any> {
    const res = await Promise.all([
        testModules.getTestModule(testCode, 34, 'df345345ergerg', 'dfgdfg', 'dfgdfgertet'),
        testAccounts.getTestAccount(testMemberId, '3877g478g', testLang)
    ])
    return {
        module: res[0],
        account: res[1],
    }
}

async function clearTests(): Promise<void> {
    await testAccounts.clearTestAccounts()
    await testModules.clearTestModules()
}

let module = null
let account = null

async function init(): Promise<any> {
    if(module && account) return ;
    try {
        await clearTests()
        const params = await createTests()
        module = params.module
        account = params.account
    } catch (e) {
        console.error(e)
    }
}

function validAsUninstalledModule(moduleModel: any, module: IModule = null, account: IAccount = null): void {
    compareAccounts(moduleModel.account, account || testAccount)
    compareModules(moduleModel.module, module || testModule)

    chai.assert(moduleModel.installed === false)
    chai.assert(moduleModel.unlimited_time === false)
    chai.assert(moduleModel.shutdown_time === 0)
    chai.assert(moduleModel.pragma_active === false)
}


function getNode(moduleCode: string, memberId: string): Promise<any> {
    const testRequest = getRequest()

    testRequest.basePath = AccountsModulesPath
    testRequest.query = {
        client_module_code: moduleCode,
        filter: {member_id: memberId, module_code: moduleCode}
    }

    return bitrix24Worker.executeRequest(testRequest)
}

function getInstallStruct(module: IModule, account: IAccount):any {
    return {
        state: module.code,
        DOMAIN: account.bitrix24Referer,
        APP_SID: 'jkfjkldfkljdfkljd',
        AUTH_ID: 'dfkljdfoib43g30748g80374fhhofuierge',
        REFRESH_ID: 'u834987348734t8',
        AUTH_EXPIRES: '3600',
        member_id: account.bitrix24MemberId,
        LANG: testLang
    }
}

export async function testBitrix24RequestWorker(): Promise<void> {
    describe('Bitrix24 Request Worker', async () => {
        describe('', async () => {

            it('Wrong path', async () => {
                await init()
                const testRequest = getRequest()
                testRequest.basePath = AccountsPath + '1'
                let answer: any = await bitrix24Worker.executeRequest(testRequest)
                chai.assert(answer.result.error)
            })

            describe('accounts', () => {

                it('Account not found', async () => {
                    await init()

                    const testRequest = getRequest()
                    testRequest.basePath = AccountsPath
                    testRequest.query = {
                        client_module_code: testCode,
                        filter: {members_id: 'qwer967967906790867890546706870'}
                    }

                    let answer = await bitrix24Worker.executeRequest(testRequest)
                    chai.assert(answer instanceof Object)
                    chai.assert(Array.isArray(answer.result))
                    chai.assert(answer.result.length === 0)
                })

                it('founded account', async () => {
                    await init()
                    const testRequest = getRequest()
                    testRequest.basePath = AccountsPath
                    testRequest.query = {
                        client_module_code: testCode,
                        filter: {members_id: testMemberId}
                    }

                    let answer = await bitrix24Worker.executeRequest(testRequest)
                    chai.assert(answer instanceof Object)
                    chai.assert(Array.isArray(answer.result))
                    chai.assert(answer.result.length === 1)

                    compareAccounts(answer.result[0], account)
                })
            })

            describe('nodes', () => {

                it('Account not found', async () => {
                    await init()
                    const testRequest = getRequest()

                    testRequest.basePath = AccountsModulesPath
                    testRequest.query = {
                        client_module_code: testCode,
                        filter: {member_id: 'sdfsdfswejkldkjldfkl98034983479987y1', module_code: testCode}
                    }

                    let answer = await bitrix24Worker.executeRequest(testRequest)
                    chai.assert(answer.result.error)
                    chai.assert(answer.result.code === Errors.notFoundCode)
                })

                it('Get uninstall node', async () => {
                    await init()
                    const testRequest = getRequest()

                    testRequest.basePath = AccountsModulesPath
                    testRequest.query = {
                        client_module_code: testCode,
                        filter: {member_id: testMemberId, module_code: testCode}
                    }

                    let answer = await bitrix24Worker.executeRequest(testRequest)
                    validAsUninstalledModule(answer.result[0], module, account)
                })
            })

            it('install', async () => {
                await init()
                setTimeout(() => clearTests(), 2000)

                const account = await testAccounts.getTestAccount('install__' + new Date().getTime(), 'ererter' + new Date().getTime(), testLang)
                const module = await testModules.getTestModule('install__' + new Date().getTime(), 453, 'dfdfgdfgdfgl;l,l' + new Date().getTime(), 'dfgdfgdfg', 'oifjboijo')

                const node = await getNode(module.code, account.bitrix24MemberId)
                validAsUninstalledModule(node.result[0], module, account)

                const testRequest = getRequest()

                testRequest.basePath = installPath
                testRequest.query = {
                    client_module_code: testCode,
                    data: getInstallStruct(module, account)
                }

                const answer = await bitrix24Worker.executeRequest(testRequest)
                chai.assert(answer.result.status === 'installed')
                const node1 = await getNode(module.code, account.bitrix24MemberId)

                compareAccounts(node1.result[0].account, account)
                compareModules(node1.result[0].module, module)

                chai.assert(node1.result[0].installed === true)
                chai.assert(node1.result[0].unlimited_time === false)
                chai.assert((node1.result[0].shutdown_time - Math.ceil(new Date().getTime() / 1000) - 3300) > 0)
                chai.assert(node1.result[0].pragma_active === true)
            })
        })
    })
}