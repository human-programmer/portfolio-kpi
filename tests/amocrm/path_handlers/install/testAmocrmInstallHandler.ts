import {TestAmocrmModules} from "../../modules/TestAmocrmModules";
import {TestAmocrmAccounts} from "../../accounts/TestAmocrmAccounts";
import {IBasic} from "../../../../generals/IBasic";
import {IServer} from "../../../../server/intrfaces";
import IRequest = IServer.IInputRequest;
import testError = IBasic.testError;
import Errors = IBasic.Errors;
import {AmocrmNodesHandler} from "../../../../crm_systems/amocrm/path_handlers/accounts_modules/AmocrmNodesHandler";
import {Amocrm} from "../../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IModule = Amocrm.IModule;
import IAccount = Amocrm.IAccount;
import {IMain} from "../../../../crm_systems/main/interfaces/MainInterface";
import IInputGatewayQuery = IMain.IInputGatewayQuery;

const chai = require('chai')

function getDefaultRequest(query: any = {}, method: string = 'install'): IRequest {
    return {
        crmName: 'amocrm',
        entity: 'nodes',
        method,
        query
    }
}

const testAccounts = new TestAmocrmAccounts()
const testModules = new TestAmocrmModules()

const testSubdomain = 'sds45645654645645654df'
const testReferer = testSubdomain + '.amocrm.ru'

const subdomainForInstall = 'pragmadev'
const refererForInstall = subdomainForInstall + '.amocrm.ru'
const clientIdForInstall = 'a22c6304-f11d-42c5-8757-ed280baa358b'
const amocrmCodeForInstall = 'testdashboard'
const secretForInstall = '5CX1QZEMTW9V9AqwVsq7kVfO0s0Fsh95325JLwHyrNSDQBakCd40jESMdTyuDOEq'
const codeForInstall = 'def5020079950e62ba85d8776d24a6dd66c07b52c514d07a7560180aed5a5c8397ce8c8558b8a3225f52f37232930c72f24fefc879dcd44e0086c61e35329b98eaea70b7319b27a646792a115a0f3f2c64c99a2e8deb2e8ac34e59271e1ce864b20824c1bf9c241c57ea5cad259c5b6e408710479876008b02ef8a0a409b523267d56d04aaf9ffa208e1ff68a1e8a95f6589b5992e263559ed058347ed0e152f2304919e4ef7b0344b1e30ee321694742c67215b29d12932f494f3699e9164875f52a35b58083430b8c3bb20028c4565fcc96e6d73d51ca255745f5d9b995753ef4838b91e343c79b26057053436e74b6708368f94da4ac9d13d7a7e76c3e22cb581158bab0182c43f2182475670085ff8204ab3e00ebfcac70f8f08b9405773717fd208770eb6e7c9431a184031c5d72aa210012d57e27ce15fd02674ad7667e4cac3703a0602a5ad157eb532388f43a5a870607eac176fe6eb6d652b3a381c10cdf0377c40a3e777f96333cf6ad2e2366f76a80def6b1103eca7d0d7904459778c48603bc73035196f9ccbfa40e5ded2d87e0d14f1aa1aace4bee65e8b42af0858423f801549244f4968ce12598845573d3f9ed2f3c657909b8af3bd08a16e1049f14b71f554e51ba264bf0e7d231a0d7f50111ec329615321cb622f424175'

const installAccounts = new TestAmocrmAccounts()
const installModules = new TestAmocrmModules()

let installedModule: IModule
let installedAccount: IAccount

export async function testAmocrmInstallHandler(): Promise<void> {
    describe('AmocrmNodesHandler', () => {
        describe('Errors', async () => {
            // it('Authorization error', async () => {
            //     const {account, module} = await initInstall()
            //
            //     const invalid_code = 'def50200dea24b1e514f92324f8050a1e6c7166fd1123df5e16b2a2e51f6a5a6a6bceb91bc22163dcf40edffcb992132f480c4208e75e69daef9718ec086c04c7d5a4e9e2ccf53cb13d28631b62b692426cfefea178482ea20dc49885e3f54c81e6908133a5957100b0b839fe27ec0ae2caf07bc4ac5babc22547853f371a0730ee99bcaea86c56d0eb9edff10195117f72f39c4f8778039a150d85b55d3c543b7e92153c2dcb7ba2d2c2799de79ad321220f3add4d15df62cb59a7235a85542e74054dfaea96a74e31146df535bf4cf568c712275e79db89a14c1c7fde9a4859678ce0f28587ed60ec07eb5126e4ab79628e2b6fc09c1f0e6ac39be27765ba332a5cfd7d55a7428d4d9be6af93ebb6cc0d6b01af231235479555793dc14733f41c61a26e647eba44626977cca8cd7cfc4d41ab18ad0b942c9f5d4f67c85c496ab155c4de460681603f11abac2b98a45da1805eeb1a61da647c1547b9f52cea9015b5ad50e431c3b095bdc5a9c915b3aa4b385af9a08b855add22a07873e1af7384f905f30f5e33f41d8d5d2a922335e7bfcb68749b580b8ed0093c3d5d5558e2548dc9fbdfc63cdae0d092b12e31fcfa1ddead85c559229520ec6fbddf764e51eaf81aaf8d0916a778b6e686dfc05a96392dfd09bea134ea238fa80e994892c'
            //
            //     const data = {code: invalid_code, referer: account.amocrmReferer, client_id: module.amocrmIntegrationId}
            //     const request = getDefaultRequest(data)
            //     const answer = await AmocrmNodesHandler.execute(request)
            //     testError(answer.result, Errors.invalidRestAnswerCode, 'Invalid REST answer')
            // })
            it('Wrong path', async () => {
                await testAccounts.clearAllTests()

                const request = getDefaultRequest({}, 'itir')
                const answer = await AmocrmNodesHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode)
            })

            it('query.code field is missing', async () => {
                const request = getDefaultRequest({})
                const answer = await AmocrmNodesHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode, 'query.code field is missing')
            })
            it('query.referer field is missing', async () => {
                const data = {code: 'wrwer'}
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode, 'query.referer field is missing')
            })
            it('query.client_id field is missing', async () => {
                await testAccounts.createTestDefaultAccount(testSubdomain)

                const data = {code: 'wrwer', referer: testReferer}
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode, 'query.client_id field is missing')

                await testAccounts.clearAllTests()
            })
            it('Module not found', async () => {
                await testAccounts.clearAllTests()
                await testAccounts.createTestDefaultAccount(testSubdomain)

                const data = {code: 'wrwer', referer: testReferer, client_id: 'wwerwerwer'}
                const request = getDefaultRequest(data)
                const answer = await AmocrmNodesHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode)
            })
            it('Clear Tests', async () => await clearAll())
        })
        // describe('Methods' , () => {
        //     it('Install', async () => {
        //         const {account, module} = await initInstall()
        //
        //         const data = {code: codeForInstall, referer: refererForInstall, client_id: clientIdForInstall}
        //         const request = getDefaultRequest(data)
        //         const answer = await AmocrmNodesHandler.execute(request)
        //         chai.assert(answer.result.length === 1)
        //         chai.assert(answer.result[0].module.pragma_module_id === module.pragmaModuleId)
        //         chai.assert(answer.result[0].account.pragma_account_id === account.pragmaAccountId)
        //     })
        //     it('rest.query', async () => {
        //         const query = await getRestQuery("/api/v4/account")
        //         const request = getDefaultRequest(query, 'rest.gateway')
        //         const answer = await AmocrmNodesHandler.execute(request)
        //         chai.assert(!answer.result.error)
        //         chai.assert(answer.result.info.statusCode === 200)
        //         chai.assert(answer.result.body.id === 28967662)
        //     })
        //     it('Widget settings', async () => {
        //         const query = await getRestQuery("/api/v4/widgets/" + amocrmCodeForInstall)
        //         const request = getDefaultRequest(query, 'rest.gateway')
        //         const answer = await AmocrmNodesHandler.execute(request)
        //         chai.assert("api_key" in answer.result.body.settings)
        //     })
        //     it('Check filter', async () => {
        //         setTimeout(() => clearTestInstall(), 2000)
        //         const query = await getRestQuery("/api/v4/users")
        //         // @ts-ignore
        //         query.data.body = {
        //             limit: 1,
        //             page: 1
        //         }
        //         const request = getDefaultRequest(query, 'rest.gateway')
        //         const answer = await AmocrmNodesHandler.execute(request)
        //         chai.assert(answer.result.body._embedded.users.length === 1)
        //     })
        // })
    })
}

async function getRestQuery(uri: string): Promise<IInputGatewayQuery> {
    const {account, module} = await initInstall()
    return {
        client_module_code: module.code,
        account_referer: account.amocrmReferer,
        data: {
            body: undefined,
            method: "GET",
            uri
        }
    }
}

async function clearTestInstall(): Promise<void> {
    await Promise.all([
        installAccounts.clearAllTests(),
        installModules.clearTestAll()
    ])
}

async function initInstall(): Promise<any> {
    const res = await Promise.all([initInstalledModule(), initInstalledAccount()])
    return {
        module: res[0],
        account: res[1],
    }
}

async function initInstalledAccount(): Promise<IAccount> {
    if(installedAccount) return installedAccount
    installedAccount = await installAccounts.createTestDefaultAccount(subdomainForInstall)
    return installedAccount
}

async function initInstalledModule(): Promise<IModule> {
    if(installedModule) return installedModule
    installedModule = await installModules.createTestModule('dfg' + new Date().getTime(), 223, amocrmCodeForInstall, clientIdForInstall, secretForInstall)
    return installedModule
}

async function clearAll(): Promise<void> {
    await Promise.all([
        testAccounts.clearAllTests(),
        testModules.clearTestAll()
    ])
}