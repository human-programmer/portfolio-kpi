import {
    MainAccountModule,
    MainAccountsModules
} from "../../../crm_systems/main/components/accounts_modules/MainAccountsModules";
import {TestPragmaModules} from "../modules/TestPragmaModules";
import {TestPragmaAccounts} from "../accounts/TestPragmaAccounts";
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import IAccountModule = IMain.IAccountModule;
import IModule = IMain.IModule;
import {LogJson} from "../../../generals/LogWriter";
import {CRMDB} from "../../../generals/data_base/CRMDB";
import {IBasic} from "../../../generals/IBasic";
import randomString = IBasic.randomString;
import {MainModule} from "../../../crm_systems/main/components/modules/Modules";
import {Pragma} from "../../../crm_systems/pragma/instarface/IPragma";
import IAccount = Pragma.IAccount;
import {createUniqueTestUsers} from "../../pragma/users/tests";
const chai = require('chai')

const logWriter = new LogJson('tests', 'main')

class TestMainAccountsModules extends MainAccountsModules {
    async pragmaTestAccountModuleModel (moduleId: number, accountId: number): Promise<any> {
        return this.getPragmaNodeModel(moduleId, accountId)
    }
}

class TestMainNode extends MainAccountModule {
    protected getApiKeyOfWidget(): Promise<string> {
        return Promise.resolve("");
    }
}

async function createUniqueInstalledMainNodes(): Promise<any> {
    const nodes = await Promise.all([
        getUniqueInstalledNode(),
        getUniqueInstalledNode(),
        getUniqueInstalledNode(),
        getUniqueInstalledNode(),
    ])
    return {
        node0: nodes[0],
        node1: nodes[1],
        node2: nodes[2],
        node3: nodes[3],
    }
}

async function getUniqueInstalledNode(): Promise<IAccountModule> {
    const node = await getUniqueNode()
    await node.installMain()
    return node
}

async function getUniqueNode(module?: IModule, account?: IAccount): Promise<IAccountModule> {
    module = module || await getUniqueModule()
    account = account || await getUniqueAccount()
    const testAccountsModules = new TestMainAccountsModules()
    const accountsModuleModel = await testAccountsModules.pragmaTestAccountModuleModel(module.pragmaModuleId, account.pragmaAccountId)
    return new TestMainNode(module, account, accountsModuleModel, logWriter)
}

async function getUniqueModule(code?: string, freePeriod: number = 100): Promise<MainModule> {
    const testModules = new TestPragmaModules()
    setTimeout(() => testModules.clearTestModules(), 2000)
    return await testModules.getTestModule(code || randomString(10), freePeriod)
}

async function getUniqueAccount(): Promise<IMain.IAccount> {
    const testAccounts = new TestPragmaAccounts()
    setTimeout(() => testAccounts.clearTestAccounts())
    return await testAccounts.getTestAccount()
}

function compareDates(date1: Date, date2: Date = new Date()): void {
    chai.assert(date1.getFullYear() === date2.getFullYear())
    chai.assert(date1.getMonth() === date2.getMonth())
    chai.assert(date1.getDate() === date2.getDate())
    chai.assert(date1.getHours() === date2.getHours())
    chai.assert(date1.getMinutes() === date2.getMinutes())
}

export async function testMainAccountsModules(): Promise<void> {
    describe('pragmaAccountModuleModel', () => {
        it('test free module', async () => {
            const module = await getUniqueModule('test0', 0)
            chai.assert(module.isFree === true)
            chai.assert(!module.freePeriodDays)
        })
        it('test paid module', async () => {
            const freePeriodDays = 30
            const module = await getUniqueModule('test0.1', freePeriodDays)
            chai.assert(module.isFree === false)
            chai.assert(module.freePeriodDays === freePeriodDays)
        })


        it('uninstalled module', async () => {
            const module = await getUniqueModule('test2')
            const account = await getUniqueAccount()
            const accountsModule = await getUniqueNode(module, account)
            chai.assert(module.pragmaModuleId === accountsModule.pragmaModuleId)
            chai.assert(account.pragmaAccountId === accountsModule.pragmaAccountId)

            chai.assert(module.pragmaModuleId === accountsModule.pragmaModuleId)
            chai.assert(account.pragmaAccountId === accountsModule.pragmaAccountId)
            chai.assert(!accountsModule.shutdownDate)
            chai.assert(accountsModule.isUnlimitedTime === false)
            chai.assert(accountsModule.isOnceInstalled === false)
        })

        it('install pragma module for free', async () => {
            const module = await getUniqueModule('test3')
            const account = await getUniqueAccount()
            const accountsModule = await getUniqueNode(module, account)
            chai.assert(!accountsModule.shutdownDate)
            chai.assert(accountsModule.isUnlimitedTime === false)
        })

        it('install module for paid', async () => {
            const freePeriodDays: number = 30
            const module = await getUniqueModule('test3', freePeriodDays)
            const account = await getUniqueAccount()
            const accountsModule = await getUniqueNode(module, account)
            await accountsModule.installMain()

            chai.assert(accountsModule.isUnlimitedTime === false)
            chai.assert(!accountsModule.shutdownDate)
        })

        describe('ApiKeys', async () => {
            it('createInactiveApiKey', async () => {
                const {node0, node1, node2, node3} = await createUniqueInstalledMainNodes()
                const {user0, user1, user2, user3} = await createUniqueTestUsers()
                const key0 = await node0.createInactiveApiKey(user0.pragmaUserId)
                const key1 = await node0.createInactiveApiKey(user1.pragmaUserId)
                const key2 = await node0.createInactiveApiKey(user2.pragmaUserId)
                await delay(500)
                await checkActualInactiveTokens(node0, [key0, key1, key2])
                await checkActualActiveTokens(node0, [])
            })
            it('create.inactive.api.key', async () => {
                const {node0} = await createUniqueInstalledMainNodes()
                const {user0, user1, user2, user3} = await createUniqueTestUsers()
                node0.tempTokenLifeTime = 100
                const key0 = await node0.createInactiveApiKey(user0.pragmaUserId)
                const key1 = await node0.createInactiveApiKey(user0.pragmaUserId)
                const key2 = await node0.createInactiveApiKey(user2.pragmaUserId)
                await delay(140)
                await checkActualInactiveTokens(node0, [])
                await checkActualActiveTokens(node0, [])
            })
            it('activateToken', async () => {
                const {node0} = await createUniqueInstalledMainNodes()
                const {user0, user1, user2, user3} = await createUniqueTestUsers()
                const key0 = await node0.createInactiveApiKey(user0.pragmaUserId)
                const key1 = await node0.createInactiveApiKey(user0.pragmaUserId)
                const key2 = await node0.createInactiveApiKey(user2.pragmaUserId)
                await delay(140)
                await node0.activateToken(key0)
                await checkActualInactiveTokens(node0, [])
                await checkActualActiveTokens(node0, [key0])
            })
            it('check.api.key', async () => {
                const {node0, node1} = await createUniqueInstalledMainNodes()
                const {user0, user1, user2, user3} = await createUniqueTestUsers()
                const key0 = await node0.createInactiveApiKey(user0.pragmaUserId)
                const key1 = await node0.createInactiveApiKey(user1.pragmaUserId)
                const key2 = await node0.createInactiveApiKey(user2.pragmaUserId)
                await delay(140)
                await node0.activateToken(key0)
                await checkApiKeySuccess(node0, key0)
                await checkApiKeyFail(node0, key1)
                await checkApiKeyFail(node1, key0)
                await checkApiKeyFail(node1, key2)
            })
            it('Node not found', async () => {
                const node0 = await getUniqueNode()
                const {user0, user1, user2, user3} = await createUniqueTestUsers()
                const key0 = await node0.createInactiveApiKey(user0.pragmaUserId)
            })
        })
    })
}

async function checkActualActiveTokens(node, tokens: Array<string>): Promise<void> {
    const activeApiKeys = await getActiveTokens(node)
    chai.assert(activeApiKeys.length === tokens.length)
    compareTokens(activeApiKeys, tokens)
    const actualActiveTokens = await getActualActiveTokens(node)
    compareTokens(actualActiveTokens, tokens)
}

async function getActiveTokens(node): Promise<Array<string>> {
    const keys = await await node.getActiveApiKeys()
    return keys.map(i => i.token)
}

async function checkActualInactiveTokens(node, tokens: Array<string>): Promise<void> {
    const inactiveTokens = await getInactiveTokens(node)
    chai.assert(inactiveTokens.length === tokens.length)
    compareTokens(inactiveTokens, tokens)
    const actualInactiveTokens = await getActualInactiveTokens(node)
    compareTokens(actualInactiveTokens, tokens)
}

async function getInactiveTokens(node): Promise<Array<string>> {
    const keys = await await node.getInactiveApiKeys()
    return keys.map(i => i.token)
}


function compareTokens(tokens1: Array<string>, tokens2: Array<string>): void {
    chai.assert(tokens1 !== tokens2)
    chai.assert(tokens1.length === tokens2.length)
    chai.assert(!tokens1.find(token => tokens2.indexOf(token) === -1))
}

async function getActualInactiveTokens(node: IAccountModule): Promise<Array<string>> {
    const api_keys = CRMDB.nodesApiKeysSchema
    const sql = `SELECT
                        ${api_keys}.account_id AS pragmaAccountId,
                        ${api_keys}.api_key AS api_key
                    FROM ${api_keys}
                    WHERE ${api_keys}.account_id = ? AND ${api_keys}.is_active = 0`
    const keys = await CRMDB.query(sql, [node.pragmaAccountId])
    return keys.map(i => i.api_key).filter(i => i)
}

async function getActualActiveTokens(node: IAccountModule): Promise<Array<string>> {
    const api_keys = CRMDB.nodesApiKeysSchema
    const sql = `SELECT
                        ${api_keys}.account_id AS pragmaAccountId,
                        ${api_keys}.api_key AS api_key
                    FROM ${api_keys}
                    WHERE ${api_keys}.account_id = ? AND ${api_keys}.is_active = 1`
    const keys = await CRMDB.query(sql, [node.pragmaAccountId])
    return keys.map(i => i.api_key).filter(i => i)
}

async function checkApiKeySuccess(node: IAccountModule, token: string): Promise<void> {
    const flag = await node.checkApiKey(token)
    chai.assert(flag === true)
    const node1 = await getUniqueNode(node.module, node.account)
    chai.assert(node !== node1)
    chai.assert(node.pragmaAccountId === node1.pragmaAccountId)

    const flag1 = await node1.checkApiKey(token)
    chai.assert(flag1 === true)
}

async function checkApiKeyFail(node: IAccountModule, token: string): Promise<void> {
    const flag = await node.checkApiKey(token)
    chai.assert(flag === false)
    const node1 = await getUniqueNode(node.module, node.account)
    chai.assert(node !== node1)
    chai.assert(node.pragmaAccountId === node1.pragmaAccountId)

    const flag1 = await node1.checkApiKey(token)
    chai.assert(flag1 === false)
}

async function delay(ms: number = 0): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
}