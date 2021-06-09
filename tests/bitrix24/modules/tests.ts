import * as chai from "chai";
import {TestBitrix24Modules} from "./TestBitrix24Modules";

const testModules = new TestBitrix24Modules()

export async function testBitrix24Modules(): Promise<void> {
    describe('test bitrix24 modules', () => {
        it('buffer', async () => {
            testModules.testedBuffer().clearBufferForTest()
            const testCode = 'testBuffer0'
            const testedBuffer = testModules.testedBuffer()
            await testModules.getTestModule(testCode, 50, 'werwer', 'werwer', 'wer')
            const module0 = await testModules.getByCode(testCode)
            const module1 = await testModules.getByCode(testCode)
            const module2 = await testModules.getByPragmaId(module0.pragmaModuleId)

            chai.assert(module0.code === testCode)
            chai.assert(module0 === module1)
            chai.assert(module1 === module2)
            chai.assert(testedBuffer.ModuleForTests.length === 1)
        })
        it('getters', async () => {
            chai.assert(testModules.testedBuffer().ModuleForTests.length === 0)
            const testCode = 'testBuffer0'
            const freePeriodDays = 50
            const integrationId = 'sassdfsdfsdfsdf'
            const secretKey = 'kljfdngjsdfgfbg'
            const handlerPath = 'sfljsnkljgnf'

            await testModules.getTestModule(testCode, freePeriodDays, integrationId, secretKey, handlerPath)
            testModules.testedBuffer().clearBufferForTest()

            const module0 = await testModules.getByCode(testCode)

            chai.assert(module0.code === testCode)
            chai.assert(module0.freePeriodDays === freePeriodDays)
            chai.assert(module0.bitrix24IntegrationId === integrationId)
            chai.assert(module0.bitrix24SecretKey === secretKey)
            chai.assert(module0.bitrix24HandlerPath === handlerPath)

            testModules.testedBuffer().clearBufferForTest()
            const module1 = await testModules.getByPragmaId(module0.pragmaModuleId)

            chai.assert(module1.code === testCode)
            chai.assert(module1.freePeriodDays === freePeriodDays)
            chai.assert(module1.bitrix24IntegrationId === integrationId)
            chai.assert(module1.bitrix24SecretKey === secretKey)
            chai.assert(module1.bitrix24HandlerPath === handlerPath)
        })

        afterEach(() => testModules.clearTestModules())
    })
}