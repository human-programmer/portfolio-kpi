import {PWorkers} from "../../../server/PWorkers";
import PragmaWorkers = PWorkers.PragmaWorkers;
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAccount = Amocrm.IAccount;
import IModule = Amocrm.IModule;
import {TestAmocrmAccounts} from "../accounts/TestAmocrmAccounts";
import {TestAmocrmModules} from "../modules/TestAmocrmModules";
import {IServer} from "../../../server/intrfaces";
import IInputRequest = IServer.IInputRequest;

const chai = require('chai')

const amocrmWorker = PragmaWorkers.amocrmRequestWorker

const testAccounts = new TestAmocrmAccounts()
const testModules = new TestAmocrmModules()

let account: IAccount
let module: IModule


export async function testAmocrmWorker(): Promise<void> {
    describe('amocrmRequestWorker', () => {
        it('Accounts', async () => {
            await init()
            const filter = {amocrm_referer: account.amocrmReferer}
            const request = createRequest(filter)
            const answer = await amocrmWorker.executeRequest(request)
            chai.assert(answer.result.length === 1)
            chai.assert(answer.result[0].crm_name === 'amocrm')
            clearTests()
        })
    })
}

async function init(): Promise<void> {
    if(account && module) return;
    const accAndMod = await Promise.all([
        testAccounts.createTestDefaultAccount(),
        testModules.createTestDefaultModule()
    ])
    account = accAndMod[0]
    module = accAndMod[1]
}

function createRequest(filter = {}): IInputRequest {
    return {
        method: 'get',
        crmName: 'amocrm',
        entity: 'accounts',
        query: {
            client_module_code: module.code,
            account_referer: account.amocrmReferer,
            filter
        }
    }
}

async function clearTests(): Promise<void> {
    await testAccounts.clearAllTests()
    await testModules.clearTestAll()
}