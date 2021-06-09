import {TestAmocrmModules} from "../modules/TestAmocrmModules";
import {TestAmocrmAccounts} from "../accounts/TestAmocrmAccounts";
import {TestAmocrmNode, TestAmocrmNodes} from "./TestAmocrmNodes";
import {AmocrmNodesBuffer} from "../../../crm_systems/amocrm/components/accounts_modules/AmocrmAccountsModules";
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAccountModule = Amocrm.IAccountModule;
import IAccount = Amocrm.IAccount;
import {checkModuleModel} from "../modules/tests";
import {checkAccountModel} from "../accounts/tests";
import {LogJson} from "../../../generals/LogWriter";
import {createUniqueTestUsers} from "../../pragma/users/tests";
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import IApiKey = IMain.IApiKey;
import IUser = IMain.IUser;
import {CRMDB} from "../../../generals/data_base/CRMDB";

const chai = require('chai')

const testModules = new TestAmocrmModules()
const testAccounts = new TestAmocrmAccounts()
const testNodes = new TestAmocrmNodes(testModules, testAccounts)

async function createNodes(size: number = 5): Promise<void> {
    const promises = []
    for(let i = 0; i < size; i++)
        promises.push(createNode())
    await Promise.all(promises)
}

async function createNode(): Promise<IAccountModule> {
    const module = await testModules.createTestDefaultModule()
    const account = await testAccounts.createTestDefaultAccount()
    return await testNodes.getAccountModule(module, account)
}

function nodeIsUninstalled(node: IAccountModule):void {
    chai.assert(node.isPragmaActive === false)
    chai.assert(node.shutdownTimeSeconds === 0)
    chai.assert(node.amocrmRefreshToken === '')
    chai.assert(node.amocrmAccessToken === '')
    chai.assert(node.amocrmShutdownTime === 0)
}

export async function testAmocrmAccountsModules (): Promise<void> {
    describe('Amocrm Nodes', () => {
        // it('Buffer', async () => {
        //     await testNodes.clearTest()
        //
        //     const buffer = new AmocrmNodesBuffer()
        //
        //     const node1 = await testNodes.createTestNode()
        //     chai.assert(buffer.size === 0)
        //     buffer.add(node1)
        //     chai.assert(buffer.size === 1)
        //
        //     const node2 = await testNodes.createTestNode()
        //     chai.assert(buffer.size === 1)
        //     buffer.add(node2)
        //     chai.assert(buffer.size === 2)
        //
        //     chai.assert(buffer.findByInterface(node1.module.amocrmIntegrationId,node1.account.amocrmSubdomain) === node1)
        //     chai.assert(buffer.find(node1.module.code,node1.account.pragmaAccountId) === node1)
        //     chai.assert(buffer.findByInterface(node2.module.amocrmIntegrationId,node2.account.amocrmSubdomain) === node2)
        //     chai.assert(buffer.find(node2.module.code,node2.account.pragmaAccountId) === node2)
        //
        //     const node3 = await testNodes.createTestNode()
        //     chai.assert(buffer.size === 2)
        //     buffer.add(node3)
        //     chai.assert(buffer.size === 3)
        //
        //     chai.assert(buffer.findByInterface(node3.module.amocrmIntegrationId,node3.account.amocrmSubdomain) === node3)
        //     chai.assert(buffer.find(node3.module.code,node3.account.pragmaAccountId) === node3)
        //
        //     await testNodes.clearTest()
        // })

        describe('Methods', () => {
            // it('getAccountModule', async () => {
            //     await testNodes.clearTest()
            //
            //     await createNodes(5)
            //
            //     const module1 = await testModules.createTestDefaultModule()
            //     const account1 = await testAccounts.createTestDefaultAccount()
            //     const node1 = await testNodes.getAccountModule(module1, account1)
            //
            //     await createNodes(5)
            //
            //     chai.assert(testNodes.nodesBuffer.size === 11)
            //
            //     chai.assert(node1.module === module1)
            //     chai.assert(node1.account === account1)
            //     chai.assert(node1 === await testNodes.getAccountModule(module1, account1))
            //     chai.assert(testNodes.nodesBuffer.size === 11)
            //
            //     await testNodes.clearTest()
            // })
            //
            // it('findAccountModule founded', async () => {
            //     await testNodes.clearTest()
            //
            //     await createNodes(5)
            //
            //     const module1 = await testModules.createTestDefaultModule()
            //     const account1 = await testAccounts.createTestDefaultAccount()
            //     await testNodes.getAccountModule(module1, account1)
            //     const node1 = await testNodes.findAccountModule(module1.amocrmIntegrationId, account1.amocrmSubdomain)
            //
            //     await createNodes(5)
            //
            //     chai.assert(testNodes.nodesBuffer.size === 11)
            //
            //     chai.assert(node1.module === module1)
            //     chai.assert(node1.account === account1)
            //     chai.assert(node1 === await testNodes.findAccountModule(module1.amocrmIntegrationId, account1.amocrmSubdomain))
            //     chai.assert(testNodes.nodesBuffer.size === 11)
            //
            //     await testNodes.clearTest()
            // })
            //
            // it('findAccountModule not', async () => {
            //     await testNodes.clearTest()
            //
            //     const node1 = await testNodes.findAccountModule('do;kgodf;gdg', 'a;ldknliaiernu')
            //     chai.assert(!node1)
            //
            //     const account1 = await testAccounts.createTestDefaultAccount()
            //     const node2 = await testNodes.findAccountModule('do;kgodf;gdg', account1.amocrmSubdomain)
            //     chai.assert(!node2)
            //
            //     const module1 = await testModules.createTestDefaultModule()
            //     const node3 = await testNodes.findAccountModule(module1.amocrmIntegrationId, 'sdfposdkfopskfs')
            //     chai.assert(!node3)
            //
            //     await testNodes.getAccountModule(module1, account1)
            //     const node4 = await testNodes.findAccountModule(module1.amocrmIntegrationId, account1.amocrmSubdomain)
            //     chai.assert(!!node4)
            //
            //     await testNodes.clearTest()
            // })
            //
            // it('Not installed', async () => {
            //     await testNodes.clearTest()
            //
            //     const node1 = await createNode()
            //
            //     nodeIsUninstalled(node1)
            //
            //     await testNodes.clearTest()
            // })
            //
            // it('Install', async () => {
            //     await testNodes.clearTest()
            //
            //     const node1 = await testNodes.createTestNode()
            //
            //     nodeIsUninstalled(node1)
            //
            //     await node1.amocrmInstall('ciwosdipfjaospijoapsjaopsdijaopdfigjdafopigj')
            //
            //     chai.assert(node1.account.amocrmCountry === node1.testAccountApiAnswer.country)
            //     chai.assert(node1.account.amocrmCreatedAt === node1.testAccountApiAnswer.created_at)
            //     chai.assert(node1.account.amocrmCreatedBy === node1.testAccountApiAnswer.created_by)
            //     chai.assert(node1.account.amocrmCurrency === node1.testAccountApiAnswer.currency)
            //     chai.assert(node1.account.amocrmCurrencySymbol === node1.testAccountApiAnswer.currency_symbol)
            //     chai.assert(node1.account.amocrmAccountId === node1.testAccountApiAnswer.id)
            //     chai.assert(node1.account.amocrmIsTechnical === node1.testAccountApiAnswer.is_technical_account)
            //     chai.assert(node1.account.amocrmName === node1.testAccountApiAnswer.name)
            //     chai.assert(node1.account.amocrmSubdomain === node1.testAccountApiAnswer.subdomain)
            //
            //     const shutdownTime = Number.parseInt(node1.testTokensApiAnswer.expires_in) + Math.ceil(new Date().getTime() / 1000)
            //
            //     chai.assert(node1.isPragmaActive === true)
            //     chai.assert(node1.amocrmEnable === true)
            //     chai.assert(node1.amocrmRefreshToken === node1.testTokensApiAnswer.refresh_token)
            //     chai.assert(node1.amocrmAccessToken === node1.testTokensApiAnswer.access_token)
            //     chai.assert((node1.amocrmShutdownTime - shutdownTime) < 10)
            //     chai.assert(node1.shutdownTimeSeconds !== 0)
            //
            //     testNodes.clearTestBuffer()
            //
            //     const node2 = await testNodes.findAccountModule(node1.module.amocrmIntegrationId, node1.account.amocrmSubdomain)
            //
            //     chai.assert(node1 !== node2)
            //     chai.assert(node1.amocrmRefreshToken === node2.amocrmRefreshToken)
            //     chai.assert(node1.amocrmAccessToken === node2.amocrmAccessToken)
            //     chai.assert(node1.amocrmShutdownTime === node2.amocrmShutdownTime)
            //     const dif = node1.shutdownDate.getTime() - node2.shutdownDate.getTime()
            //     chai.assert(dif < 1000)
            //     // chai.assert(node1.shutdownTimeSeconds === node2.shutdownTimeSeconds)
            //     chai.assert(node1.isOnceInstalled === node2.isOnceInstalled)
            //     chai.assert(node1.isUnlimitedTime === node2.isUnlimitedTime)
            //
            //     const log = new LogJson('amo', 'sdf')
            //     log.add('model', node1.publicModel)
            //     await log.save()
            //
            //     await testNodes.clearTest()
            // })
            //
            // it('publicModel', async () => {
            //     const node = await testNodes.createTestNode()
            //     checkModuleModel(node.module, node.publicModel.module)
            //     checkAccountModel(node.account, node.publicModel.account)
            //     chai.assert(node.amocrmEnable === node.publicModel.amocrm_enable)
            // })

            it('api_key activate', async () => {
                const {user0, user1} = await createUniqueTestUsers()
                const node = await createUniqueNode()
                const token0 = await checkActivateToken(node, user0)
                const token1 = await checkActivateToken(node, user1)
                const oldTokenValid = await node.checkApiKey(token0)
                chai.assert(oldTokenValid === false)
                const newTokenValid = await node.checkApiKey(token1)
                chai.assert(newTokenValid === true)
            })

            // it('', async () => {
            //     await testNodes.clearTest()
            // })
        })
    })
}

async function createInstalledNodes(): Promise<any> {
    const nodes = await Promise.all([
        createUniqueNode(),
        createUniqueNode(),
        createUniqueNode(),
        createUniqueNode(),
    ])
    return {
        node0: nodes[0],
        node1: nodes[1],
        node2: nodes[2],
        node3: nodes[3],
    }
}

async function createUniqueNode(): Promise<TestAmocrmNode> {
    const testNodes = createTestNodes()
    setTimeout(() => testNodes.clearTest(), 2000)
    return await testNodes.createTestNode()
}

async function checkActivateToken(node: IAccountModule, user: IUser): Promise<string> {
    const token = await node.createInactiveApiKey(user.pragmaUserId)
    await node.amocrmInstall('ciwosdipfjaospijoapsjaopsdijaopdfigjdafopigj')
    await checkActiveToken(node, token)
    await checkNodeUser(node, user)
    return token
}

async function getActiveTokens(node): Promise<Array<IApiKey>> {
    return await node.getActiveApiKeys()
}

async function checkActiveToken(node: IAccountModule, token: string): Promise<void> {
    const activeKeys = await getActiveTokens(node)
    const key = activeKeys.filter(i => i.token === token)
    chai.assert(!!key)
}

async function checkNodeUser(node: IAccountModule, user: IUser): Promise<void> {
    const freshNode = await createTestNodes().findNode(node.module, node.account)
    chai.assert(freshNode.pragmaUserId === user.pragmaUserId)
}

function createTestNodes(): TestAmocrmNodes {
    const testModules = new TestAmocrmModules()
    const testAccounts = new TestAmocrmAccounts()
    return  new TestAmocrmNodes(testModules, testAccounts)
}