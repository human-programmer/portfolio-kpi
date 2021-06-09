import {Batch, Bitrix24ApiRequest, RestApiStack} from "../../../crm_systems/bitrix24/components/gateway/RestApiGateway";
import {VALID_BITRIX24_METHODS} from "../../../crm_systems/bitrix24/components/gateway/MethodValidator";
import {TestBitrix24AccountsModules} from "../accounts_modules/TestBitrix24AccountsModules";
import {TestBitrix24Modules} from "../modules/TestBitrix24Modules";
import {TestBitrix24Accounts} from "../accounts/TestAccounts";
import {Bitrix24} from "../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IAccountModule = Bitrix24.IAccountModule;

const chai = require('chai')

const BATCH_SIZE = 50

const testModules = new TestBitrix24Modules()
const testAccounts = new TestBitrix24Accounts()
const testNodes = new TestBitrix24AccountsModules(testModules, testAccounts)
async function clearTests(): Promise<void> {
    await Promise.all([
        testModules.clearTestModules(),
        testAccounts.clearTestAccounts()
    ])
}

async function init(): Promise<IAccountModule> {
    await clearTests()
    const moduleAndAccount = await Promise.all([
        testModules.createTestModule(),
        testAccounts.createAndGetBitrix24Account('erwerter')
    ])
    return testNodes.getTestAccountModule(moduleAndAccount[0].pragmaModuleId, moduleAndAccount[1].pragmaAccountId)
}

export async function testBitrix24RestApiStack(): Promise<void> {
    describe('Bitrix24 RestApiStack', () => {

        it('empty stack', async () => {
            const testNode = await init()
            const testStack = new RestApiStack(testNode)
            const nextRequest = testStack.nextRequest()
            chai.assert(!nextRequest)
        })

        it('full stack', async () => {
            const testNode = await init()
            const testStack = new RestApiStack(testNode)
            VALID_BITRIX24_METHODS.forEach(method => method !== 'batch' && testStack.push(new Bitrix24ApiRequest('test', method, {})))


            const startSize = testStack.size
            chai.assert(startSize === VALID_BITRIX24_METHODS.length - 1)

            const nextRequest = testStack.nextRequest()

            chai.assert(nextRequest.isBatch === true)
            chai.assert(nextRequest instanceof Batch)
            chai.assert(testStack.size === startSize - BATCH_SIZE)

            testStack.push(new Bitrix24ApiRequest('test', 'batch', {}))
            chai.assert(testStack.size === startSize - BATCH_SIZE + 1)

            const nextRequest2 = testStack.nextRequest()
            chai.assert(nextRequest2.isBatch === true)
            chai.assert(!(nextRequest2 instanceof Batch))
            chai.assert(testStack.size === startSize - BATCH_SIZE)
        })
        it('Clear Tests', async () => await clearTests())
    })
}