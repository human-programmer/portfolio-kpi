import {TestBitrix24Modules} from "../modules/TestBitrix24Modules";
import {TestBitrix24Accounts} from "../accounts/TestAccounts";
import {TestBitrix24AccountsModules} from "./TestBitrix24AccountsModules";
import {Bitrix24} from "../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import InstallData = Bitrix24.InstallData;


const chai = require('chai')

const testModules = new TestBitrix24Modules()
const testAccounts = new TestBitrix24Accounts()
const testAccountsModules = new TestBitrix24AccountsModules(testModules, testAccounts)


export async function bitrix24AccountsModulesTests(): Promise<void> {
    describe('test bitrix24 account module', async () => {
        it('buffer', async () => {
            const memberId = 'test0'
            const moduleCode = 'testBuffer0'

            await Promise.all([
                await testAccounts.getTestAccount(memberId, 'jhjghjgfjyr', ''),
                await testModules.getTestModule('testBuffer0', 30, 'qwerty', 'df;lgdfsfg', 'wwerwerwr')
            ])

            const account = await testAccounts.createAndGetBitrix24Account(memberId)
            const module = await testModules.getByCode(moduleCode)

            const accountModule0 = await testAccountsModules.accountModule(module.pragmaModuleId, account.pragmaAccountId)
            chai.assert(module === accountModule0.module)
            chai.assert(account === accountModule0.account)

            const accountModule1 = await testAccountsModules.accountModule(module.pragmaModuleId, account.pragmaAccountId)
            chai.assert(accountModule0 === accountModule1)
            chai.assert(module === accountModule1.module)
            chai.assert(account === accountModule1.account)

            testAccountsModules.bufferTest.clearBufferForTests()
            const accountModule2 = await testAccountsModules.accountModule(module.pragmaModuleId, account.pragmaAccountId)
            chai.assert(module === accountModule2.module)
            chai.assert(account === accountModule2.account)

            chai.assert(accountModule0 !== accountModule2)
        })
        it('update', async () => {
            const memberId = 'test1'
            const referer = 'refererTest'
            const lang = 'laTes'
            const code = 'testBuffer0'
            const freePeriod = 30
            const integrationId = 'idtest'
            const secretKey = 'secretKeyTest'
            const handlerPath = 'testPath'
            const testInstall: InstallData = {
                accessToken: 'accessL:Sejjlnskdjljndfn',
                refreshToken: 'testRefershsdkdgilsdnil',
                shutdownTimeSec: Math.ceil(new Date().getTime() / 1000 + 3600),
            }

            await Promise.all([
                await testAccounts.getTestAccount(memberId, referer, lang),
                await testModules.getTestModule(code, freePeriod, integrationId, secretKey, handlerPath)
            ])

            const account = await testAccounts.createAndGetBitrix24Account(memberId)
            const module = await testModules.getByCode(code)
            const accountModule = await testAccountsModules.getTestAccountModule(module.pragmaModuleId, account.pragmaAccountId)

            chai.assert(module === accountModule.module)
            chai.assert(account === accountModule.account)

            chai.assert(accountModule.module.code === code)
            chai.assert(accountModule.module.freePeriodDays === freePeriod)
            chai.assert(accountModule.module.bitrix24IntegrationId === integrationId)
            chai.assert(accountModule.module.bitrix24SecretKey === secretKey)
            chai.assert(accountModule.module.bitrix24HandlerPath === handlerPath)

            chai.assert(accountModule.bitrix24AccessToken === '')
            chai.assert(accountModule.bitrix24RefreshToken === '')
            chai.assert(accountModule.bitrix24ShutdownTimeSec === 0)
            chai.assert(accountModule.bitrix24NotArchaicToken === false)

            accountModule.bitrix24Install(testInstall)
            chai.assert(accountModule.bitrix24ShutdownTimeSec === testInstall.shutdownTimeSec)
            chai.assert(accountModule.bitrix24RefreshToken === testInstall.refreshToken)
            chai.assert(accountModule.bitrix24AccessToken === testInstall.accessToken)

            await testAccountsModules.bufferTest.clearBufferForTests()
            const freshAccountModule = await testAccountsModules.accountModule(module.pragmaModuleId, account.pragmaAccountId)

            chai.assert(accountModule !== freshAccountModule)
            chai.assert(freshAccountModule.bitrix24ShutdownTimeSec === testInstall.shutdownTimeSec)
            chai.assert(freshAccountModule.bitrix24RefreshToken === testInstall.refreshToken)
            chai.assert(freshAccountModule.bitrix24AccessToken === testInstall.accessToken)
        })

        afterEach(() => {
            testModules.clearTestModules()
            testAccounts.clearTestAccounts()
        })
    })
}

