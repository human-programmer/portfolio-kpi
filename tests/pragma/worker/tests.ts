import {PWorkers} from "../../../server/PWorkers";
import PragmaWorkers = PWorkers.PragmaWorkers;
import {TestPragmaAccounts} from "../accounts/TestPragmaAccounts";
import {Pragma} from "../../../crm_systems/pragma/instarface/IPragma";
import IAccount = Pragma.IAccount;
import {IServer} from "../../../server/intrfaces";
import IInputRequest = IServer.IInputRequest;

const chai = require('chai')

const pragmaWorker = PragmaWorkers.pragmaCrmWorker

const testAccounts = new TestPragmaAccounts()

let account: IAccount

export async function testPragmaWorker(): Promise<void> {
    describe('pragmaWorker', () => {
        it('Accounts', async () => {
            await init()
            const filter = {pragma_account_id: account.pragmaAccountId}
            const request = createRequest( filter)
            const answer = await pragmaWorker.executeRequest(request)
            chai.assert(answer.result.length === 1)
            chai.assert(answer.result[0].crm_name === 'amocrm')
            clearTests()
        })
    })
}

async function init(): Promise<void> {
    if(account && module) return;
    const accAndMod = await Promise.all([
        testAccounts.createTestAccount('amocrm')
    ])
    account = accAndMod[0]
}

function createRequest(filter = {}): IInputRequest {
    return {
        method: 'get',
        crmName: 'pragma',
        entity: 'accounts',
        query: {
            client_module_code: 'module.code',
            filter
        }
    }
}

async function clearTests(): Promise<void> {
    await testAccounts.clearAllTest()
}