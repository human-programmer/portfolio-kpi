import {Bitrix24InstallHandlerTest} from "./Bitrix24InstallHandlerTest";
import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {TestBitrix24AccountsModules} from "../../accounts_modules/TestBitrix24AccountsModules";
import {Bitrix24InstallHandler,} from "../../../../crm_systems/bitrix24/path_handlers/install/Bitrix24InstallHandler";
import {TestBitrix24Accounts} from "../../accounts/TestAccounts";
import {TestBitrix24Modules} from "../../modules/TestBitrix24Modules";
import {Bitrix24} from "../../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IModule = Bitrix24.IModule;
import IAccount = Bitrix24.IAccount;
import {BITRIX24_INSTALL_ROUTE} from "../../../../crm_systems/bitrix24/BITIX24_CRONSTANTS";

const chai = require('chai')
const fs = require('fs')

const testModuleCode = 'Bitrix24Test'
const testSecretKey = 'LRmHEixuLHeTkY1StcAsJwe7gqkgyWYuJeO0HSXNySiNhvEbLg'
const testMemberId = 'f0d76bbee027d17b3acc9bde751ee14d'
const testIntegrationId = 'app.6024021e1447f2.21086018'
const testReferer = 'pragma.bitrix24.by'

const PATH = BITRIX24_INSTALL_ROUTE

const testModules = new TestBitrix24Modules()
const testAccounts = new TestBitrix24Accounts()
const testNodes = new TestBitrix24AccountsModules(testModules, testAccounts)
const testFreePeriodDays = 100

Bitrix24InstallHandlerTest.testAccounts = testAccounts
Bitrix24InstallHandlerTest.testModules = testModules

async function init(): Promise<any> {
    await clearTests()
    const result = await Promise.all([
        createTestModule(),
        // createTestAccount(),
    ])
    return {module: result[0], account: result[1]}
}

async function createTestModule(): Promise<IModule> {
    return testModules.getTestModule(testModuleCode, testFreePeriodDays, testIntegrationId, testSecretKey, 'https://smart.pragma.by/api/lib/OAuth/bitrix_test.php')
}

async function createTestAccount(): Promise<IAccount> {
    return testAccounts.getTestAccount(testMemberId, testReferer, 'by')
}

async function clearTests(): Promise<void> {
    testNodes.bufferTest.clearBufferForTests()
    await Promise.all([
        testModules.clearTestModules(),
        testAccounts.clearTestAccounts(),
        clearTestTokens(),
        clearTestAccounts(),
    ])
}

function getTestInstallRequest(): any {
    return {
        query: {
            client_module_code: testModuleCode,
            data: {
                state: testModuleCode,
                DOMAIN: 'pragma.bitrix24.by',
                APP_SID: 'b1a6a16eeca1ef3d3c6c20d417ec9c21',
                AUTH_ID: '2d345a60005223e2003e236400000035000003eb7f8688967c401d64d9d891af469143',
                REFRESH_ID: '1db38160005223e2003e2364000000350000039cdf3d44d67430b953fd46b5d7236f65',
                AUTH_EXPIRES: '3600',
                member_id: testMemberId,
            }},
        basePath: PATH
    }
}

function checkErrorAnswer(answer: any, expectedCode: number, expectedMessage: string = null): void {
    chai.assert(answer.error === true)
    chai.assert(answer.code === expectedCode)
    expectedMessage && chai.assert(answer.message === expectedMessage)
}

function checkErrors(): void {
    [
        'state',
        'DOMAIN',
        'APP_SID',
        'AUTH_ID',
        'REFRESH_ID',
        'AUTH_EXPIRES',
        'member_id',
    ].forEach(key => {
        it(`"${key}" is undefined`, async () => {
            const request = getTestInstallRequest()
            request.query.data[key] = ''
            const answer = await Bitrix24InstallHandlerTest.execute(request)
            checkErrorAnswer(answer.result, 1101, `"${key}" is undefined`)
        })
    })
}

export async function testBitrix24InstallHandlerPath(): Promise<void> {
    describe('install module', () => {
        describe('errors', () => {

            it('module not found', async () => {
                const request = getTestInstallRequest()
                request.query.data.state = 'qwe'
                request.query.client_module_code = 'qwe'
                const answer = await Bitrix24InstallHandlerTest.execute(request)
                checkErrorAnswer(answer.result, 1044)
            })

            checkErrors()
        })

        describe('correct request', () => {
            it('routeOwner', () => {
                chai.assert(Bitrix24InstallHandler.isRouteOwner(PATH))
                chai.assert(!Bitrix24InstallHandler.isRouteOwner(PATH + '1'))
            })

            it('bitrix24 install', async () => {
                const {module} = await init()

                const request = getTestInstallRequest()
                const installRequest = request.query.data
                let answer: any = await Bitrix24InstallHandlerTest.execute(request)

                chai.assert(answer.result.status === 'installed')

                testNodes.bufferTest.clearBufferForTests()
                const accountModule = await testNodes.findAccountModuleByMemberId(testModuleCode, testMemberId)
                chai.assert(!!accountModule)

                chai.assert(installRequest.state === accountModule.module.code)
                chai.assert(installRequest.DOMAIN === accountModule.account.bitrix24Referer)
                chai.assert(installRequest.AUTH_ID === accountModule.bitrix24AccessToken)
                chai.assert(installRequest.REFRESH_ID === accountModule.bitrix24RefreshToken)
                const interval = accountModule.shutdownTimeSeconds - (new Date().getTime() / 1000) - testFreePeriodDays * 86400
                chai.assert(Math.abs(interval) < 3)
                chai.assert(installRequest.member_id === accountModule.account.bitrix24MemberId)
            })

            it('bitrix24 refresh', async () => {
                const request = getTestInstallRequest()
                const installData = request.query.data
                installData.AUTH_EXPIRES = '300'
                let answer: any = await Bitrix24InstallHandlerTest.execute(request)
                chai.assert(answer.result.status === 'installed')

                testNodes.clearTestBuffer()
                const accountModule = await testNodes.findAccountModuleByMemberId(testModuleCode, testMemberId)

                chai.assert(accountModule.bitrix24AccessToken === installData.AUTH_ID)
                 await accountModule.bitrix24Refresh()
                chai.assert(accountModule.bitrix24AccessToken !== installData.AUTH_ID)
                chai.assert(accountModule.bitrix24NotArchaicToken === true)
                chai.assert(accountModule.bitrix24ShutdownTimeSec - new Date().getTime() / 1000 - 3600 <= 2)

                await clearTests()
            })

            // it('Clear tests', async () => await clearTests())
        })
    })
}

async function clearTestTokens(): Promise<void> {
    const modules = CRMDB.modulesSchema
    const sql = `DELETE FROM ${modules} WHERE ${modules}.id = ${modules}.code = '${testModuleCode}'`
    await CRMDB.query(sql)
}

async function clearTestAccounts(): Promise<void> {
    const accounts = CRMDB.accountSchema
    const bitrix24accounts = CRMDB.bitrix24AccountSchema
    const sql = `DELETE FROM ${accounts} WHERE ${accounts}.id = (SELECT id FROM ${bitrix24accounts} WHERE ${bitrix24accounts}.member_id = '${testMemberId}')`
    await CRMDB.query(sql)
}

async function getOAuthRequest(): Promise<any> {
    const path = 'C:\\Os\\OSPanel\\domains\\smart-dev\\temp\\dev\\bitrix24.json'
    return new Promise((res, rej) => fs.readFile(path, 'utf8', (err, data) => err ? rej(err) : res(JSON.parse(data))))
}