import IRequest = Bitrix24.IRequest;

const chai = require('chai')
import {Bitrix24RestApiGateway, Bitrix24ApiRequest} from "../../../crm_systems/bitrix24/components/gateway/RestApiGateway";
import {TestBitrix24AccountsModules} from "../accounts_modules/TestBitrix24AccountsModules";
import {TestBitrix24Accounts} from "../accounts/TestAccounts";
import {TestBitrix24Modules} from "../modules/TestBitrix24Modules";
import {Bitrix24} from "../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IAccountModule = Bitrix24.IAccountModule;
import {IBasic} from "../../../generals/IBasic";
import Error = IBasic.Error;
import {VALID_BITRIX24_METHODS} from "../../../crm_systems/bitrix24/components/gateway/MethodValidator";
import {TestBitrix24Batch, TestBitrix24Request} from "./BatchTest";

const testRequestsQuantity = 100
const testRequests = VALID_BITRIX24_METHODS.filter(method => method !== 'batch').slice(0, testRequestsQuantity).map(method => new TestBitrix24Request('test', method, {}))
VALID_BITRIX24_METHODS.concat(testRequests.map(i => i.bitrix24Method))

const testAccounts = new TestBitrix24Accounts()
const testModules = new TestBitrix24Modules()
const testNodes = new TestBitrix24AccountsModules(testModules, testAccounts)

function answerByParams(testGateway: TestGateway, params: any): any {
    const id = Object.keys(params.cmd).map(i => Number.parseInt(i))
    const requests = testRequests.filter(request => id.indexOf(request.id) !== -1)
    const testBatch = new TestBitrix24Batch(testGateway.bitrix24Path, requests)
    return testBatch.testExecutedAnswer
}

class TestGateway extends Bitrix24RestApiGateway {
    constructor(node: IAccountModule) {
        super(node)
        Bitrix24RestApiGateway.requestTimeout = 500
    }
    async bitrix24Query(bitrix24Method: string, params: any): Promise<any> {
        await TestGateway.testDelay()
        return answerByParams(this, params)
    }
    async bitrix24Batch(bitrix24Method: string, params: any): Promise<any> {
        await TestGateway.testDelay()
        return answerByParams(this, params)
    }

    static testDelay (): Promise<any> {
        return new Promise(resolve => setTimeout(resolve, 500))
    }
}
async function createTestNode(): Promise<IAccountModule> {
    return await testNodes.createInstalledNode()
}

async function clearTests(): Promise<void> {
    await testAccounts.clearTestAccounts()
    await testModules.clearTestModules()
}

export async function testRestApiGateway(): Promise<void> {

    describe('Bitrix24 rest api gateway', async () => {
        try {
            await clearTests()
            const testNode = await createTestNode()
            const testGateway = new TestGateway(testNode)

            describe('Errors', () => {
                it('Invalid bitrix24 rest api method', async () => {
                    const request = new Bitrix24ApiRequest(testGateway.bitrix24Path, 'invalid.method', {})
                    const answer = await testGateway.execute(request)
                    chai.assert(answer instanceof Error)
                    chai.assert(answer.error)
                    chai.assert(answer.code === 1043)
                })
            })

            describe('Correct', () => {
                it('execute', async () => {
                    const ERROR_FLAG = 'ERROR_FLAG'
                    const promises = await Promise.race([
                        Promise.all(testRequests.map(request => testGateway.execute(request))),
                        new Promise(resolve => setTimeout(() => resolve(ERROR_FLAG), 2000))
                    ])

                    chai.assert(promises !== ERROR_FLAG)
                    const n = testRequests.filter(testRequest => !testRequest.testExecutedFlag)
                    chai.assert(!testRequests.find(testRequest => !testRequest.testExecutedFlag))
                    chai.assert(testRequests.length === testRequestsQuantity)
                })
            })
        } catch (e) {
            console.error(e)
            chai.assert(false)
        }
    })
}