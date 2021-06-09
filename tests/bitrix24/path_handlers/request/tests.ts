import {IBasic} from "../../../../generals/IBasic";
const testError = IBasic.testError

const chai = require('chai')
import {Bitrix24} from "../../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IAccount = Bitrix24.IAccount;
import {TestBitrix24QueryHandler} from "./TestBitrix24QueryHandler";
import {TestBitrix24Accounts} from "../../accounts/TestAccounts";
import {TestBitrix24Modules} from "../../modules/TestBitrix24Modules";
import IModule = Bitrix24.IModule;
import {Bitrix24QueryHandler} from "../../../../crm_systems/bitrix24/path_handlers/request/Bitrix24QueryHandler";
import Errors = IBasic.Errors;
import {BITRIX24_QUERY_ROUTE} from "../../../../crm_systems/bitrix24/BITIX24_CRONSTANTS";

const PATH = BITRIX24_QUERY_ROUTE
const testClientCode = 'testClientCode'
const testMemberId = 'testMemberId'

const testModules = new TestBitrix24Modules()
const testAccounts = new TestBitrix24Accounts()

function testRequest(): any {
    return {
        basePath: PATH,
        query: {
            client_module_code: testClientCode,
            member_id: testMemberId,
            data: {
                method: 'profile',
                params: {}
            }
        }
    }
}

async function createTest(): Promise<void> {
    await Promise.all([
        createTestModule(),
        createTestAccount()
    ])
}

async function createTestAccount(): Promise<IAccount> {
    return testAccounts.getTestAccount(testMemberId, 'sdfsdfsdfsdfwwe', 'ewe')
}

async function createTestModule(): Promise<IModule> {
    return testModules.getTestModule(testClientCode, 356, 'dfh4hsrhwhrt', 'fgh4fh5h', 'g5d5g4s5dfgh')
}

async function clearTests(): Promise<void> {
    await Promise.all([
        testModules.clearTestModules(),
        testAccounts.clearTestAccounts()
    ])
}

export async function testBitrix24QueryHandler(): Promise<void> {
    describe('bitrix24 query handler', () => {
        describe('error queries', () => {
            it('wrong route', async () => {
                await createTest()

                const request = testRequest()
                request.basePath = PATH + '1'
                let answer = await TestBitrix24QueryHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode)
            })

            it('client module code is undefined', async () => {
                await createTest()

                const request = testRequest()
                request.query.client_module_code = undefined
                let answer = await TestBitrix24QueryHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode)
            })

            it('module not found', async () => {
                await createTest()

                const request = testRequest()
                request.query.client_module_code = 'kgkgkgkggk'
                let answer = await TestBitrix24QueryHandler.execute(request)
                testError(answer.result, Errors.notFoundCode)
            })

            it('member_id is undefined', async () => {
                await createTest()

                const request = testRequest()
                request.query.member_id = undefined
                let answer = await TestBitrix24QueryHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode)
            })

            it('account not found', async () => {
                await createTest()

                const request = testRequest()
                request.query.member_id = 'kkjkjkkjkjkjkjkjkjkjk'
                let answer = await TestBitrix24QueryHandler.execute(request)
                testError(answer.result, Errors.notFoundCode)
            })

            it('data is undefined', async () => {
                await createTest()

                const request = testRequest()
                request.query.data = undefined
                let answer = await TestBitrix24QueryHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode)
            })

            it('data.method is undefined', async () => {
                await createTest()

                const request = testRequest()
                request.query.data.method = undefined
                let answer = await TestBitrix24QueryHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode)
            })

            it('data.params is undefined', async () => {
                await createTest()

                const request = testRequest()
                request.query.member_id = undefined
                let answer = await TestBitrix24QueryHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode)
            })

            afterEach(() => clearTests())
        })

        it('Correct query', async () => {
            await createTest()

            const request = testRequest()
            let answer = await TestBitrix24QueryHandler.executeTest(request, TestBitrix24QueryHandler)
            chai.assert(answer.result === 'success')
        })

        it('correct PATH', () => {
            it('routeOwner', () => {
                chai.assert(Bitrix24QueryHandler.isRouteOwner(PATH))
                chai.assert(!Bitrix24QueryHandler.isRouteOwner(PATH + '1'))
            })
        })

        afterEach(() => clearTests())
    })
}