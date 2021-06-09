import {TestAmocrmNode, TestAmocrmNodes} from "../../accounts_modules/TestAmocrmNodes";
import {TestAmocrmModules} from "../../modules/TestAmocrmModules";
import {TestAmocrmAccounts} from "../../accounts/TestAmocrmAccounts";
import {IBasic} from "../../../../generals/IBasic";
import {IServer} from "../../../../server/intrfaces";
import IQuery = IServer.IInputQuery;
import IRequest = IServer.IInputRequest;
import {AmocrmNodesHandler} from "../../../../crm_systems/amocrm/path_handlers/accounts_modules/AmocrmNodesHandler";
import {Amocrm} from "../../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAccountModule = Amocrm.IAccountModule;
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {checkAccountModel} from "../../accounts/tests";
import {checkModuleModel} from "../../modules/tests";
import Errors = IBasic.Errors;
import testError = IBasic.testError;
import {AMOCRM_NODES_ROUTE} from "../../../../crm_systems/amocrm/AMOCRM_CONSTANTS";
import {createUniqueTestUsers} from "../../../pragma/users/tests";
import {IMain} from "../../../../crm_systems/main/interfaces/MainInterface";
import IApiKeyQuery = IMain.IApiKeyQuery;
import IApiKeyRequest = IMain.IApiKeyRequest;
import IUser = IMain.IUser;
import IApiKey = IMain.IApiKey;
import {CRMDB} from "../../../../generals/data_base/CRMDB";

const chai = require('chai')

// const testModules = new TestAmocrmModules()
// const testAccounts = new TestAmocrmAccounts()
// const testNodes = new TestAmocrmNodes(testModules, testAccounts)


const PATH = AMOCRM_NODES_ROUTE + '/get'
const testModuleCode = 'AmocrmTestModuleCode3453555'
const testAccountReferer = 'amocrmTestReferer349058304958345'

function getDefaultQuery(filter: any = {}): IQuery {
    return {
        client_module_code: testModuleCode,
        account_referer: testAccountReferer,
        filter,
    }
}

function getDefaultRequest(data: any = {}, method: string = 'get'): IRequest {
    return {
        method,
        crmName: 'amocrm',
        entity: 'nodes',
        query: getDefaultQuery(data)
    }
}

export async function testAmocrmNodesHandler(): Promise<void> {
    describe('Amocrm Nodes', async () => {
        describe('Errors', () => {
            it('Wrong method', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                    amocrm_referer: node0.account.amocrmReferer, amocrm_integration_id: node0.module.amocrmIntegrationId
                }
                const request = getDefaultRequest(data, 'get1')
                const answer = await AmocrmNodesHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode)
            })
        })
        describe('Success', () => {
            it('No parameters', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {}
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                testError(answer.result, Errors.internalErrorCode, 'Method "allNodes" not implemented')
            })
            it('Single amocrm_account_id', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                        amocrm_account_id: node0.account.amocrmAccountId
                    }
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                testError(answer.result, Errors.internalErrorCode, 'Method "allNodesOfAccount" not implemented')
            })
            it('Single amocrm_referer', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                        amocrm_referer: node0.account.amocrmReferer
                    }
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                testError(answer.result, Errors.internalErrorCode, 'Method "allNodesOfAccount" not implemented')
            })
            it('Single amocrm_integration_id', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                        amocrm_integration_id: node0.module.amocrmIntegrationId
                    }
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                testError(answer.result, Errors.internalErrorCode, 'Method "allNodesOfModule" not implemented')
            })

            it('Single amocrm_referer, code', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                    amocrm_referer: node0.account.amocrmReferer,
                    code: node0.module.code
                }
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                chai.assert(answer.result.length === 1)
                checkNode(node0, answer.result[0])
            })

            it('Single amocrm_account_id, amocrm_integration_id', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                        amocrm_account_id: node0.account.amocrmAccountId, amocrm_integration_id: node0.module.amocrmIntegrationId
                    }
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                chai.assert(answer.result.length === 1)
                checkNode(node0, answer.result[0])
            })
            it('Single amocrm_referer, amocrm_integration_id', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                        amocrm_referer: node0.account.amocrmReferer, amocrm_integration_id: node0.module.amocrmIntegrationId
                    }
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                chai.assert(answer.result.length === 1)
                checkNode(node0, answer.result[0])
            })
            it('Single amocrm_account_id, amocrm_referer, amocrm_integration_id', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                        amocrm_account_id: node1.account.amocrmAccountId,
                        amocrm_referer: node0.account.amocrmReferer,
                        amocrm_integration_id: node0.module.amocrmIntegrationId
                    }
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                chai.assert(answer.result.length === 1)
                checkNode(node0, answer.result[0])
            })
            it('Single amocrm_account_id, amocrm_integration_id, some amocrm_referer', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                        amocrm_account_id: node1.account.amocrmAccountId,
                        amocrm_referer: [node0.account.amocrmReferer, node1.account.amocrmReferer],
                        amocrm_integration_id: node0.module.amocrmIntegrationId
                    }
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                chai.assert(answer.result.length === 1)
                checkNode(node0, answer.result[0])
            })
            it('Single amocrm_referer, amocrm_integration_id, some amocrm_account_id', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                        amocrm_account_id: [node1.account.amocrmAccountId, node0.account.amocrmAccountId],
                        amocrm_referer: node0.account.amocrmReferer,
                        amocrm_integration_id: node1.module.amocrmIntegrationId
                    }
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                chai.assert(answer.result.length === 1)
                checkNode(node1, answer.result[0])
            })
            it('Single amocrm_account_id, amocrm_referer, some amocrm_integration_id', async () => {
                const {node0, node1, node2, node3} = await init()
                const data = {
                        amocrm_account_id: [node1.account.amocrmAccountId, node3.account.amocrmAccountId],
                        amocrm_referer: [node0.account.amocrmReferer, node2.account.amocrmReferer],
                        amocrm_integration_id: [node1.module.amocrmIntegrationId, node0.module.amocrmIntegrationId]
                    }
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                chai.assert(answer.result.length === 2)
                checkNodes([node1, node0], answer.result)
            })
            it('Clear tests', async () => await clearTests())
        })

        describe('ApiKeys', () => {
            it('create.inactive.api.key', async () => {
                const {user0} = await createUniqueTestUsers()
                const node = await createInstalledNode()
                const request = createApiKeyRequest(node, user0,"create.inactive.api.key")
                const answer = await AmocrmNodesHandler.execute(request)
                chai.assert(answer.result.api_key)
            })
            it('check.api.key -> fail', async () => {
                const {user0} = await createUniqueTestUsers()
                const node = await createInstalledNode()

                const request = createApiKeyRequest(node, user0,"create.inactive.api.key")
                const answer = await AmocrmNodesHandler.execute(request)

                const request1 = createApiKeyRequest(node, user0,"check.api.key")
                request1.query.api_key = answer.result.api_key
                const answer1 = await AmocrmNodesHandler.execute(request1)
                chai.assert(answer1.result.status === 'fail')
            })
            it('check.api.key -> success', async () => {
                const {user0} = await createUniqueTestUsers()
                const node = await createInstalledNode()

                const api_key = await node.createInactiveApiKey(user0.pragmaUserId)
                await node.activateToken(api_key)

                const request1 = createApiKeyRequest(node, user0,"check.api.key")
                request1.query.api_key = api_key
                const answer1 = await AmocrmNodesHandler.execute(request1)
                chai.assert(answer1.result.status === 'success')
            })
        })
        // it('Clear tests', async () => await clearTests())
    })
}

function createApiKeyRequest(node: IAccountModule, user: IUser,  method: string): IApiKeyRequest|any {
    const query: IApiKeyQuery = {
        api_key: "",
        client_module_code: node.module.code,
        pragma_user_id: user.pragmaUserId,
        pragma_account_id: node.pragmaAccountId
    }
    return {
        crmName: "amocrm",
        entity: "nodes",
        method,
        query
    }
}

async function clearTests(): Promise<void> {
    // await Promise.all([
    //     testModules.clearTestAll(),
    //     testAccounts.clearAllTests()
    // ])
}

async function init(): Promise<any> {
    // await clearTests()
    return await createInstalledNodes()
}

async function createInstalledNodes(): Promise<any> {
    const nodes = await Promise.all([
        createInstalledNode(),
        createInstalledNode(),
        createInstalledNode(),
        createInstalledNode(),
    ])
    return {
        node0: nodes[0],
        node1: nodes[1],
        node2: nodes[2],
        node3: nodes[3],
    }
}

async function createInstalledNode(): Promise<TestAmocrmNode> {
    const testModules = new TestAmocrmModules()
    const testAccounts = new TestAmocrmAccounts()
    const testNodes = new TestAmocrmNodes(testModules, testAccounts)
    setTimeout(() => testNodes.clearTest(), 2000)
    const node = await testNodes.createTestNode()
    await node.amocrmInstall('8o3h4g8horiaghiodufghouidaf')
    chai.assert(node.isOnceInstalled === true)
    return node
}

function checkNodes(nodes: Array<IAccountModule>, models: Array<IAmocrmNodeStruct>): void {
    models.forEach(model => {
        const node = nodes.find(i => i.pragmaAccountId === model.account.pragma_account_id)
        checkNode(node, model)
    })
}

function checkNode(node: IAccountModule, model: IAmocrmNodeStruct): void {
    checkModuleModel(node.module, model.module)
    checkAccountModel(node.account, model.account)
    chai.assert(model.amocrm_enable === node.amocrmEnable)
    chai.assert(model.is_once_installed === node.isOnceInstalled)
    chai.assert(model.is_pragma_active === node.isPragmaActive)
    chai.assert(model.is_unlimited === node.isUnlimitedTime)
    chai.assert(Math.abs(model.shutdown_time - node.shutdownTimeSeconds) <= 3)
}