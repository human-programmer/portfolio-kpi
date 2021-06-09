import {TestAmocrmModule, TestAmocrmModules} from "./TestAmocrmModules";
import {Buffer} from "../../../crm_systems/amocrm/components/modules/AmocrmModules";
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IModule = Amocrm.IModule;
const chai = require('chai')

const testModules = new TestAmocrmModules()

const testCode = 'code_testCreate1236890'
const testFreePeriod = 45
const testAmocrCode = 'amocrmCode_testCreate1236890'
const testIId = 'iId_testCreate1236890'
const testSecret = 'secret_testCreate1236890'

async function getTestModule(): Promise<TestAmocrmModule> {
    const time = new Date().getTime()
    return await testModules.createTestModule('code_' + time, 45, 'amocrmCode_' + time, 'iId_' + time, 'secret_' + time)
}

function compareModules(m1: IModule, m2: IModule): void {
    chai.assert(m1.code === m2.code)
    chai.assert(m1.freePeriodDays === m2.freePeriodDays)
    chai.assert(m1.amocrmCode === m2.amocrmCode)
    chai.assert(m1.amocrmIntegrationId === m2.amocrmIntegrationId)
    chai.assert(m1.amocrmSecretKey === m2.amocrmSecretKey)
}

export async function testAmocrmModules(): Promise<void> {
    describe('Amocrm Modules', async () => {

        describe('Create Test', async () => {
            it('', async () => {
                const module = await testModules.createTestModule(testCode, testFreePeriod, testAmocrCode, testIId, testSecret)
                chai.assert(module.code === testCode)
                chai.assert(module.freePeriodDays === testFreePeriod)
                chai.assert(module.amocrmCode === testAmocrCode)
                chai.assert(module.amocrmIntegrationId === testIId)
                chai.assert(module.amocrmSecretKey === testSecret)
                testModules.clearTestBuffer()

                const amocrmModule = await testModules.findByAmocrmId(module.amocrmIntegrationId)
                chai.assert(module !== amocrmModule)
                compareModules(module, amocrmModule)

                const amocrmModule2 = await testModules.findByAmocrmId(module.amocrmIntegrationId)
                chai.assert(amocrmModule === amocrmModule2)
                compareModules(module, amocrmModule2)

                const amocrmModule3 = await testModules.findByCode(module.code)
                chai.assert(amocrmModule === amocrmModule3)
                compareModules(module, amocrmModule3)

                testModules.clearTestBuffer()

                const amocrmModule4 = await testModules.findByCode(module.code)
                chai.assert(amocrmModule !== amocrmModule4)
                compareModules(module, amocrmModule4)
            })
        })

        describe('Buffer', async () => {
            it('', async () => {
                const buffer = new Buffer()
                const testModule1 = await getTestModule()
                buffer.add(testModule1)
                chai.assert(buffer.size === 1)
                chai.assert(await buffer.findByCode(testModule1.code) === testModule1)
                chai.assert(await buffer.findByAmocrmId(testModule1.amocrmIntegrationId) === testModule1)

                const testModule2 = await getTestModule()
                buffer.add(testModule2)
                chai.assert(buffer.size === 2)
                chai.assert(await buffer.findByCode(testModule2.code) === testModule2)
                chai.assert(await buffer.findByAmocrmId(testModule2.amocrmIntegrationId) === testModule2)
            })
        })

        describe('Methods', () => {
            it('publicModel', async () => {
                const testModule1 = await getTestModule()
                const model = testModule1.publicModel
                checkModuleModel(testModule1, model)
            })
        })

        afterEach(async () => await testModules.clearTestAll())
    })
}

export function checkModuleModel(module: IModule, model: any): void {
    chai.assert(module.amocrmCode === model.amocrm_code)
    chai.assert(module.amocrmIntegrationId === model.amocrm_integration_id)
    chai.assert(module.pragmaModuleId === model.pragma_module_id)
    chai.assert(module.code === model.code)
    chai.assert(module.freePeriodDays === model.free_period_days)
    chai.assert(module.isFree === model.is_free)
}