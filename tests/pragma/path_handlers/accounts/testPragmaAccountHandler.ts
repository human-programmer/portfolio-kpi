import {TestPragmaAccounts} from "../../accounts/TestPragmaAccounts";
import {PragmaAccountsHandler} from "../../../../crm_systems/pragma/path_handlers/accounts/PragmaAccountsHandler";
import {Pragma} from "../../../../crm_systems/pragma/instarface/IPragma";
import IAccountsRequest = Pragma.IAccountsRequest;
import {IMain} from "../../../../crm_systems/main/interfaces/MainInterface";
import IMainAccountStruct = IMain.IMainAccountStruct;
import IAccount = Pragma.IAccount;
import {IBasic} from "../../../../generals/IBasic";
import testError = IBasic.testError;
import Errors = IBasic.Errors;

const chai = require('chai')


const testAccounts = new TestPragmaAccounts()
let account0, account1, account2, account3

export async function testPragmaAccountsHandler(): Promise<void> {
    describe('PragmaAccountsHandler', () => {
        describe('Errors', () => {
            it('Null request', async () => {
                await init()
                const answer = await PragmaAccountsHandler.execute(null)
                testError(answer.result, Errors.invalidRequestCode, )
            })
            it('Method "getAllAccounts" is not implemented', async () => {
                await init()
                const request = createRequest(null)
                const answer = await PragmaAccountsHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode, 'Method "getAllAccounts" is not implemented')
            })

            it('Invalid method "testInvalid"', async () => {
                await init()
                const request = createRequest(null, 'testInvalid')
                const answer = await PragmaAccountsHandler.execute(request)
                testError(answer.result, Errors.invalidRequestCode, 'Invalid method "testInvalid"')
            })
        })

        describe('Valid requests', () => {
            it('get single', async () => {
                const request = createRequest(account1.pragmaAccountId)
                const answer = await PragmaAccountsHandler.execute(request)
                chai.assert(answer.result.length === 1)
                compareAccountAndModel(answer.result[0], account1)
            })
            it('get second', async () => {
                const request = createRequest([account1.pragmaAccountId, account2.pragmaAccountId])
                const answer = await PragmaAccountsHandler.execute(request)
                chai.assert(answer.result.length === 2)
                compareAccountsAcnModels(answer.result, [account1, account2])
            })
            it('get three', async () => {
                const request = createRequest([account1.pragmaAccountId, account2.pragmaAccountId, account3.pragmaAccountId])
                const answer = await PragmaAccountsHandler.execute(request)
                chai.assert(answer.result.length === 3)
                compareAccountsAcnModels(answer.result, [account1, account2, account3])
            })
        })
    })
}

async function init(): Promise<any> {
    if(account0) return;
    const all = await Promise.all([
        testAccounts.createTestAccount('amocrm'),
        testAccounts.createTestAccount('amocrm'),
        testAccounts.createTestAccount('bitrix24'),
        testAccounts.createTestAccount('bitrix24'),
    ])
    account0 = all[0]
    account1 = all[1]
    account2 = all[2]
    account3 = all[3]
}

function createRequest(pragmaAccountId: any, method: string = 'get'): IAccountsRequest {
    return {
        crmName: "pragma",
        entity: "accounts",
        method,
        query: {
            filter: {pragma_account_id: pragmaAccountId}
        }
    }
}

function compareAccountsAcnModels(models: Array<IMainAccountStruct>, accounts: Array<IAccount>): void {
    chai.assert(models.length === accounts.length)
    models.forEach(model => compareAccountAndModel(model, accounts.find(acc => acc.pragmaAccountId === model.pragma_account_id)))
}

function compareAccountAndModel(model: IMainAccountStruct, account: IAccount): void {
    chai.assert(model.pragma_account_id === account.pragmaAccountId)
    chai.assert(model.crm_name === account.crmName)
    chai.assert(model.pragma_time_create - account.timeCreateSeconds < 2)
}