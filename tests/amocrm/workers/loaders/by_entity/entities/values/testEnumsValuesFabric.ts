import {CRMDB} from "../../../../../../../generals/data_base/CRMDB";
import {
    EnumsValuesFabric,
    ILoadedValue,
} from "../../../../../../../workers/amocrm/loaders/entities/EntitiesFabric";
import {saveTestUniqueCF} from "../../customFields/testCustomFieldsFabric";
import {compareTestValues, testUniquesEntitiesId} from "./testStringValuesFabric";

const chai = require('chai')

export async function testEnumsValuesFabric(): Promise<void> {
    describe('EnumsValuesFabric', () => {
        it('save', async () => {
            const values = await saveUniqueEnumsValues()
            await checkTestActualEnumsValues(values)
        })
        it('update', async () => {
            const values = await saveUniqueEnumsValues()
            await addRandom(values)
            await saveValues(values)
            await checkTestActualEnumsValues(values)
        })
    })
}

export async function createTestEnumsValuesToSave(entityId: number, fieldsIds: Array<number>): Promise<Array<ILoadedValue>> {
    const promises = fieldsIds.map(fieldId => valueToCreate(entityId, fieldId))
    setTimeout(() => delayDeletion(fieldsIds), 2000)
    return await Promise.all(promises)
}

async function saveUniqueEnumsValues(): Promise<Array<ILoadedValue>> {
    const valuesToSave = await valuesToCreate()
    await saveValues(valuesToSave)
    return valuesToSave
}

async function saveValues(values: Array<ILoadedValue>): Promise<void> {
    await EnumsValuesFabric.save(values)
}

async function valuesToCreate(quantity: number = 100): Promise<Array<ILoadedValue>> {
    const {entities, fields} = await ids(quantity)

    const groups = entities.map(entityId => {
        return fields.map(fieldId => valueToCreate(entityId, fieldId))
    })

    setTimeout(() => delayDeletion(fields), 2000)
    const promises = [].concat(...groups)

    return await Promise.all(promises)
}

async function ids(quantity: number): Promise<any> {
    const tests = await Promise.all([
        testUniquesEntitiesId(quantity),
        saveTestUniqueCF(Math.ceil(quantity / 50))
    ])
    return {entities: tests[0], fields: tests[1].map(i => i.pragmaFieldId)}
}

async function valueToCreate(entityId: number, fieldId: number): Promise<ILoadedValue> {
    const enumId = await randomTestEnumId(fieldId)

    return {
        pragmaEntityId: entityId,
        pragmaFieldId: fieldId,
        pragmaFieldName: undefined,
        pragmaFieldType: undefined,
        value: enumId
    }
}

async function delayDeletion(fieldsIds: Array<number>): Promise<void> {
    const condition = fieldsIds.map(id => `field_id = ${id}`).join(' OR ')
    const sql = `DELETE FROM ${CRMDB.enumsValuesSchema} WHERE ${condition}`
    await CRMDB.query(sql)
}

export async function randomTestEnumId(fieldId: number): Promise<number> {
    const sql = `INSERT INTO ${CRMDB.enumsSchema} (field_id, sort, value) VALUES (${fieldId}, 1, 'werrwer')`
    const result = await CRMDB.query(sql)
    const id = Number.parseInt(result['insertId'])
    delayDeletionEnum(id)
    return id
}

function delayDeletionEnum(enumId: number): void {
    const sql = `DELETE FROM ${CRMDB.enumsSchema} WHERE id = ${enumId}`
    setTimeout(() => CRMDB.query(sql), 2000)
}

export async function checkTestActualEnumsValues(values: Array<ILoadedValue>): Promise<void> {
    let fieldsIds = values.map(i => i.pragmaFieldId)
    fieldsIds = fieldsIds.filter((id, index) => fieldsIds.indexOf(id) === index)
    const actualValues = await getActualValues(fieldsIds)
    compareTestValues(actualValues, values)
}

async function getActualValues(ids: Array<number>): Promise<Array<any>> {
    const condition = ids.map(i => `field_id = ${i}`).join(' OR ')
    const sql = `SELECT
                    field_id AS pragmaFieldId,
                    entity_id AS pragmaEntityId,
                    option_id AS value
                FROM ${CRMDB.enumsValuesSchema} 
                WHERE ${condition}`
    return await CRMDB.query(sql)
}

async function addRandom(values: Array<any>): Promise<void> {
    const promises = values.map(async val => {
        val.value = await randomTestEnumId(val.pragmaFieldId)
    })
    await Promise.all(promises)
}