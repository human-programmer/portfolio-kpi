import {TestAmocrmAccounts} from "../../amocrm/accounts/TestAmocrmAccounts";
import {TestAmocrmModules} from "../../amocrm/modules/TestAmocrmModules";
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import {AMOCRM_ACCOUNTS_ROUTE} from "../../../crm_systems/amocrm/AMOCRM_CONSTANTS";
import {Conductor} from "../../../server/Conductor";
import {TestUsers} from "../../pragma/users/TestUsers";
import {Pragma} from "../../../crm_systems/pragma/instarface/IPragma";
import IPragmaUser = Pragma.IPragmaUser;
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import {createUniqueTestUsers} from "../../pragma/users/tests";
import IUsersRequest = IMain.IUsersRequest;
import IUsersFilter = IMain.IUsersFilter;
const chai = require('chai')

const testAccounts = new TestAmocrmAccounts()
const testModules = new TestAmocrmModules()

let amocrmAccount: Amocrm.IAccount
let amocrmModule: Amocrm.IModule

export async function testConductor(): Promise<void> {
    describe('Conductor', () => {
        describe('Amocrm', () => {
            it('Accounts', async () => {
                await amocrmInit()
                const filter = {referer: amocrmAccount.amocrmReferer}
                const request = createRequest(AMOCRM_ACCOUNTS_ROUTE + '/get', filter)
                const answer = await Conductor.executeRequest(request)
                chai.assert(answer.result.length === 1)
                chai.assert(answer.result[0].crm_name === 'amocrm')
                clearAmocrmTests()
            })
            it('Users', async () => {
                const {user0, user1, user2, user3} = await createUniqueTestUsers()
                const filter = {
                    pragma_user_id: user0.pragmaUserId,
                    email: user1.email,
                    phone: user2.phone,
                }
                const request = createRequest('/pragma/users/get', filter)
                const answer = await Conductor.executeRequest(request)
                chai.assert(answer.result.length === 3)
            })
        })
    })
}

async function amocrmInit(): Promise<void> {
    if(amocrmAccount && amocrmModule) return;
    const accAndMod = await Promise.all([
        testAccounts.createTestDefaultAccount(),
        testModules.createTestDefaultModule()
    ])
    amocrmAccount = accAndMod[0]
    amocrmModule = accAndMod[1]
}

function createRequest(originalUrl, filter = {}) {
    return {
        originalUrl,
        query: {
            client_module_code: amocrmModule.code,
            account_referer: amocrmAccount.amocrmReferer,
            filter
        }
    }
}

async function clearAmocrmTests(): Promise<void> {
    await testAccounts.clearAllTests()
    await testModules.clearTestAll()
}

async function getUserRequest(filter: IUsersFilter, method: string): Promise<IUsersRequest> {
    const testModules = new TestAmocrmModules()
    setTimeout(() => testModules.clearTestAll(), 2000)
    const module = await testModules.createTestDefaultModule()
    const query = {filter, client_module_code: module.code}
    return request(query, method)
}

function request(query: any, method: any): IUsersRequest{
    return {
        method: method,
        crmName: 'amocrm',
        entity: 'users',
        query
    }
}