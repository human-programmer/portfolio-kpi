import {CRMDB} from "../../../../../../generals/data_base/CRMDB";
import {TestFabric} from "../../../TestFabric";
import {PipelinesLoader} from "../../../../../../workers/amocrm/loaders/pipelines/PipelinesLoader";

const chai = require('chai')

export async function testPipelinesLoader(): Promise<void> {
    describe('PipelinesLoader', () => {
        it('init', async () => {
            await TestFabric.init()
            chai.assert(true)
        })
        it('first run', async () => {
            await clearPipelinesOfAccount()
            const job = await TestFabric.createLoadPipelinesJob()
            const loader = new PipelinesLoader(job)
            await loader.run()
            const pipelinesCount = await pipelinesInAccount()
            chai.assert(!!pipelinesCount)
        })
        it('second run', async () => {
            setTimeout(() => clearPipelinesOfAccount(), 2000)
            const job = await TestFabric.createLoadPipelinesJob()
            const loader = new PipelinesLoader(job)
            await loader.run()
            const pipelinesCount = await pipelinesInAccount()
            chai.assert(!!pipelinesCount)
        })
    })
}

async function clearPipelinesOfAccount(): Promise<void> {
    const pragma = CRMDB.pipelinesSchema
    const node = await TestFabric.getTestNodeStruct()
    const sql = `DELETE FROM ${pragma}
                WHERE account_id = ${node.account.pragma_account_id}`
    await CRMDB.query(sql)
}

async function pipelinesInAccount(): Promise<number> {
    const pipelines = CRMDB.pipelinesSchema
    const node = await TestFabric.getTestNodeStruct()
    const sql = `SELECT COUNT(*) as count FROM ${pipelines} WHERE ${pipelines}.account_id = ${node.account.pragma_account_id}`
    const answer = await CRMDB.query(sql)
    return answer[0].count
}