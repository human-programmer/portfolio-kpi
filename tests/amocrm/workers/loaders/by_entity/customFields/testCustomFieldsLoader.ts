import {TestFabric} from "../../../TestFabric";
import {CRMDB} from "../../../../../../generals/data_base/CRMDB";
import {CustomFieldsLoader} from "../../../../../../workers/amocrm/loaders/custom_fields/CustomFieldsLoader";

const chai = require('chai')

export async function testCustomFieldsLoader(): Promise<void> {
    describe('CustomFieldsLoader', () => {
        it('init', async () => {
            await TestFabric.init()
            chai.assert(true)
        })
        it('first run', async () => {
            await clearTests()
            const job = await TestFabric.createLoadCustomFieldsJob()
            const loader = CustomFieldsLoader.create(job)
            await loader.run()
            const groupsQuantity = await fieldGroupsInAccount()
            chai.assert(groupsQuantity === 3)
        })
        it('second run', async () => {
            setTimeout(() => clearTests(), 2000)
            const job = await TestFabric.createLoadCustomFieldsJob()
            const loader = CustomFieldsLoader.create(job)
            await loader.run()
            const groupsQuantity = await fieldGroupsInAccount()
            chai.assert(groupsQuantity === 3)
        })
    })
}

async function clearTests(): Promise<void> {
    const node = await TestFabric.getTestNodeStruct()
    await clearEnums(node.account.pragma_account_id)
    clearFields(node.account.pragma_account_id)
}

async function clearEnums(pragmaAccountId: number): Promise<void> {
    const enums = CRMDB.enumsSchema
    const fields = CRMDB.fieldsSchema
    const sql = `DELETE ${enums}
                FROM ${enums}
                    INNER JOIN ${fields} ON ${fields}.id = ${enums}.field_id
                WHERE ${fields}.account_id = ${pragmaAccountId}`
    await CRMDB.query(sql)
}

async function clearFields(pragmaAccountId): Promise<void> {
    const pragma = CRMDB.fieldsSchema
    const sql = `DELETE FROM ${pragma}
                WHERE account_id = ${pragmaAccountId}`
    await CRMDB.query(sql)
}

async function fieldGroupsInAccount(): Promise<number> {
    const fields = CRMDB.fieldsSchema
    const node = await TestFabric.getTestNodeStruct()
    const sql = `SELECT COUNT(*) as count FROM (SELECT * 
                FROM ${fields} 
                WHERE ${fields}.account_id = ${node.account.pragma_account_id} 
                GROUP BY entity_type) as groups WHERE 1`
    const answer = await CRMDB.query(sql)
    return answer[0].count
}