import {TestFabric} from "../../../TestFabric";
import {UsersLoader} from "../../../../../../workers/amocrm/loaders/users/UsersLoader";
import {CRMDB} from "../../../../../../generals/data_base/CRMDB";
import {LoadDataSets} from "../../LoadDataSets";
import {IAmocrmLoaders} from "../../../../../../workers/amocrm/interface";
import IAmocrmJob = IAmocrmLoaders.IAmoJob;

const chai = require('chai')

export async function testUsersLoader(): Promise<void> {
    describe('UsersLoader', () => {
        it('init', async () => {
            await TestFabric.init()
            chai.assert(true)
        })
        it('first run', async () => {
            await clearTestUsersOfAccount()
            const job = await TestFabric.createLoadUsersJob()
            const loader = new UsersLoader(job)
            await loader.run()
            const usersCount = await testUsersInAccount()
            chai.assert(!!usersCount)
        })
        it('second run', async () => {
            setTimeout(() => clearTestUsersOfAccount(), 2000)
            const job = await TestFabric.createLoadUsersJob()
            const loader = new UsersLoader(job)
            await loader.run()
            const usersCount = await testUsersInAccount()
            chai.assert(!!usersCount)
        })
    })
}

async function clearTestUsersOfAccount(): Promise<void> {
    const pragma = CRMDB.usersSchema
    const links = CRMDB.usersToAccountsSchema
    const node = await TestFabric.getTestNodeStruct()
    const sql = `DELETE ${pragma}
                FROM ${pragma}
                    INNER JOIN ${links} ON ${links}.user_id = ${pragma}.id
                WHERE ${links}.account_id = ${node.account.pragma_account_id}`
    await CRMDB.query(sql)
}

async function testUsersInAccount(): Promise<number> {
    const links = CRMDB.usersToAccountsSchema
    const node = await TestFabric.getTestNodeStruct()
    const sql = `SELECT COUNT(*) as count FROM ${links} WHERE ${links}.account_id = ${node.account.pragma_account_id}`
    const answer = await CRMDB.query(sql)
    return answer[0].count
}