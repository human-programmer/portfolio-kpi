import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAccount = Amocrm.IAccount;
import {TestAmocrmAccounts} from "../accounts/TestAmocrmAccounts";
import {TestAmocrmModules} from "../modules/TestAmocrmModules";
import {TestAmocrmNodes} from "../accounts_modules/TestAmocrmNodes";
import IModule = Amocrm.IModule;
import IDataInstall = Amocrm.IDataInstall;
import {IServer} from "../../../server/intrfaces";
import IInputRequest = IServer.IInputRequest;
import {AMOCRM_NODES_ROUTE} from "../../../crm_systems/amocrm/AMOCRM_CONSTANTS";
import {AmocrmNodesHandler} from "../../../crm_systems/amocrm/path_handlers/accounts_modules/AmocrmNodesHandler";

const chai = require('chai')

const TEST_MODULE_CODE = 'TEST_INSTALL2'
const TEST_AMOCRM_MODULE_CODE = 'testinstall2'
const TEST_SECRET_KEY = 'cCko2KDuj4TzqEiGOE8SQFAm9z0fPHB1UpdzEapCRV2P6DYJMvNyq1aqSY8s8pgw'
const TEST_INTEGRATION_ID = 'e9387bc7-e737-4d7d-b739-48b2810de830'
const TEST_INSTALL_CODE = 'def50200944300828ea1182f42ef1da3102725b25f30849b8c9df489831e0de29c1e162c80c0b71d48c02fc42c73e4510f4f4042158a8ba0808369f3acf54ad99d0269d47c12630d335481c0f935b35d257b3d63a3b65e53aec95bb57568dcd07c7ddf4b03092f0f96f5764499bfab36c77b5b0d2e3ab297549381332c1b6499af48825ccb3f814c4f8f2b29df8216fdd49fd8a719273c4b567f6f1e5c3b2bc85b20f5dc3deba64d2adca1a6fc2418e3b83203152f56259a403ecfef57e344dbc744464d2c426aede83f9f3eb69644d40d8ce574d68424e662bca7dbe675478de57b7cfca8102a9f5a85b081a4a5de196616ba1798efa38db99bbccd952739c7b297c42cc0208698bcb8291bc8429290f9820ef1276faa268be23e04bdeae9cca2bfe8d0e9b7fd95e7c5b027b7653ee529a91866dbded9459f1aa19b6f2d2ff49341d0fb756f0d02aaeae4da52bce3d93d323e84dbb69528c134a5778cd4aadfe9f06f87766bc3e615584a7fda2bd6e7c1a495ed389e308fd56c6afb1f1781b8d0a977895b37ec9b846d9cd92739cf24b218f63331bcb6b52d0c13c97773edbf32df431697d640167fb7c23faf6f02073c55882b4ed17e27ccc350cbe0f60d6f4699d6f0d23ea0516debc1ec1cb117aeaabcfd9bf69b48a75964cc87e2e1effb'
const TEST_FREE_PERIOD = 100

const TEST_SUBDOMAIN = 'pragmadev'
const TEST_REFERER = TEST_SUBDOMAIN + '.amocrm.ru'
const TEST_AMOCRM_ID = 28967662

const testAccounts = new TestAmocrmAccounts()
const testModules = new TestAmocrmModules()
const testNodes = new TestAmocrmNodes(testModules, testAccounts)


async function getTestModule(): Promise<IModule> {
    return testModules.createTestModule(TEST_MODULE_CODE, TEST_FREE_PERIOD, TEST_AMOCRM_MODULE_CODE, TEST_INTEGRATION_ID, TEST_SECRET_KEY)
}

function compareAccounts(acc1: IAccount, acc2: IAccount): void {
    chai.assert(acc1.amocrmReferer === acc2.amocrmReferer)
    chai.assert(acc1.pragmaAccountId === acc2.pragmaAccountId)
    chai.assert(acc1.amocrmAccountId === acc2.amocrmAccountId)
    chai.assert(acc1.amocrmCountry === acc2.amocrmCountry)
    chai.assert(acc1.amocrmCreatedAt === acc2.amocrmCreatedAt)
    chai.assert(acc1.amocrmCreatedBy === acc2.amocrmCreatedBy)
    chai.assert(acc1.amocrmCurrency === acc2.amocrmCurrency)
    chai.assert(acc1.amocrmCurrencySymbol === acc2.amocrmCurrencySymbol)
    chai.assert(acc1.amocrmIsTechnical === acc2.amocrmIsTechnical)
    chai.assert(acc1.amocrmName === acc2.amocrmName)
}

export async function testAmocrmInstall(): Promise<void> {

    describe('testAmocrmInstall', () => {
        it('install', async () => {
            setTimeout(() => testNodes.clearTest(), 2000)

            const promises = await Promise.all([
                getTestModule(),
                testAccounts.createTestDefaultAccount(TEST_SUBDOMAIN),
            ])

            const testModule = promises[0]

            const dataInstall: IDataInstall|any = {
                code: TEST_INSTALL_CODE,
                referer: TEST_REFERER,
                client_id: TEST_INTEGRATION_ID
            }

            // @ts-ignore
            const request: IInputRequest = {
                crmName: "amocrm",
                entity: "nodes",
                method: "install",
                query: dataInstall
            };

            const result = await AmocrmNodesHandler.execute(request)
            chai.assert(result.result.length === 1)

            testAccounts.clearBufferTest()
            const acc1 = await testAccounts.findByAmocrmSubdomain(TEST_SUBDOMAIN)

            chai.assert(acc1.amocrmName !== 'TEST_CRM')

            const node = await testNodes.findAccountModule(testModule.amocrmIntegrationId, TEST_SUBDOMAIN)
            chai.assert(!!node)

            const timeSec = Math.ceil(new Date().getTime() / 1000)

            chai.assert(node.isOnceInstalled === true)
            chai.assert(node.amocrmEnable === true)
            chai.assert(!!node.amocrmAccessToken)
            chai.assert(!!node.amocrmRefreshToken)
            chai.assert(node.amocrmIsNotArchaicToken === true)
            chai.assert(Math.abs(node.amocrmShutdownTime - timeSec - 86400) < 3)

            chai.assert(acc1.amocrmAccountId === TEST_AMOCRM_ID)

            testAccounts.clearBufferTest()
            const acc2 = await testAccounts.findByAmocrmId(acc1.amocrmAccountId)
            chai.assert(acc1 !== acc2)
            compareAccounts(acc1, acc2)
            await testNodes.clearTest()
        })
    })
}
