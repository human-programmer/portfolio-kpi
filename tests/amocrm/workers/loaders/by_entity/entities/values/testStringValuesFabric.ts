import {CRMDB} from "../../../../../../../generals/data_base/CRMDB";
import {IBasic} from "../../../../../../../generals/IBasic";
import randomString = IBasic.randomString;
import {saveTestUniqueCF} from "../../customFields/testCustomFieldsFabric";
import {ILoadedValue, StringValuesFabric} from "../../../../../../../workers/amocrm/loaders/entities/EntitiesFabric";

const chai = require('chai')

export async function testStringValuesFabric(): Promise<void> {
    describe('StringValuesFabric', () => {
        it('save', async () => {
            const values = await saveTestUniqueStringValues()
            await checkTestActualStringValues(values)
        })
        it('update', async () => {
            const values = await saveTestUniqueStringValues()
            addRandom(values)
            await saveValues(values)
            await checkTestActualStringValues(values)
        })
    })
}

export async function createTestStringValuesToSave(entityId: number, fieldsIds: Array<number>): Promise<Array<ILoadedValue>> {
    const structs = fieldsIds.map(fieldId => valueToCreate(entityId, fieldId))
    setTimeout(() => delayDeletion(fieldsIds), 2000)
    return structs
}

async function saveTestUniqueStringValues(): Promise<Array<ILoadedValue>> {
    const valuesToSave = await valuesToCreate()
    await saveValues(valuesToSave)
    return valuesToSave
}

async function saveValues(values: Array<ILoadedValue>): Promise<void> {
    await StringValuesFabric.save(values)
}

async function valuesToCreate(quantity: number = 100): Promise<Array<ILoadedValue>> {
    const {entities, fields} = await ids(quantity)

    const groups = entities.map(entityId => {
        return fields.map(fieldId => valueToCreate(entityId, fieldId))
    })

    setTimeout(() => delayDeletion(fields), 2000)

    return [].concat(...groups)
}

function valueToCreate(entityId: number, fieldId: number): ILoadedValue {
    return {
        pragmaEntityId: entityId,
        pragmaFieldId: fieldId,
        pragmaFieldName: undefined,
        pragmaFieldType: undefined,
        value: randomString(256)
    }
}

async function ids(quantity: number): Promise<any> {
    const tests = await Promise.all([
        testUniquesEntitiesId(quantity),
        saveTestUniqueCF(Math.ceil(quantity / 50))
    ])
    return {entities: tests[0], fields: tests[1].map(i => i.pragmaFieldId)}
}

export async function testUniquesEntitiesId(quantity: number): Promise<Array<number>> {
    let promises = []
    const accountId = await testUniqueAccountId()
    for (let i = 0; i < quantity; i++)
        promises.push(testUniqueEntityId(accountId))
    const ids = await Promise.all(promises)
    delayEntitiesDeletion(ids)
    return ids
}

async function testUniqueEntityId(accountId: number): Promise<number> {
    const sql = `INSERT INTO ${CRMDB.entitiesSchema} (account_id, entity_type) VALUES (${accountId}, 1)`
    const result = await CRMDB.query(sql)
    return Number.parseInt(result['insertId'])
}

export async function testUniqueAccountId(): Promise<number> {
    const sql = `INSERT INTO ${CRMDB.accountSchema} (crm) VALUES (1)`
    const result = await CRMDB.query(sql)
    const id = Number.parseInt(result['insertId'])
    delayDeletionAccount(id)
    return id
}


function delayDeletionAccount(accountId: number): void {
    const sql = `DELETE FROM ${CRMDB.accountSchema} WHERE account_id = ${accountId}`
    setTimeout(() => CRMDB.query(sql), 2000)
}

async function delayDeletion(fieldsIds: Array<number>): Promise<void> {
    const condition = fieldsIds.map(id => `field_id = ${id}`).join(' OR ')
    const sql = `DELETE FROM ${CRMDB.stringValuesSchema} WHERE ${condition}`
    await CRMDB.query(sql)
}

function delayEntitiesDeletion(ids: Array<number>): void {
    const condition = ids.map(i => `id = ${i}`).join(' OR ')
    const sql = `DELETE FROM ${CRMDB.entitiesSchema} WHERE ${condition}`
    setTimeout(() => CRMDB.query(sql), 2000)
}

export async function checkTestActualStringValues(values: Array<ILoadedValue>): Promise<void> {
    let fieldsIds = values.map(i => i.pragmaFieldId)
    fieldsIds = fieldsIds.filter((id, index) => fieldsIds.indexOf(id) === index)
    const actualValues = await getValues(fieldsIds)
    compareTestValues(actualValues, values)
}

async function getValues(ids: Array<number>): Promise<Array<any>> {
    const condition = ids.map(i => `field_id = ${i}`).join(' OR ')
    const sql = `SELECT
                    field_id AS pragmaFieldId,
                    entity_id AS pragmaEntityId,
                    value 
                FROM ${CRMDB.stringValuesSchema} 
                WHERE ${condition}`
    return await CRMDB.query(sql)
}

export function compareTestValues(actual: Array<any>, values: Array<ILoadedValue>): void{
    chai.assert(actual.length === values.length)
    actual.forEach(i => compareValue(i, values.find(val => val.pragmaEntityId == i.pragmaEntityId && val.pragmaFieldId == i.pragmaFieldId)))
}

function compareValue(actual: any, value: ILoadedValue): void {
    chai.assert(actual.pragmaFieldId == value.pragmaFieldId)
    chai.assert(actual.pragmaEntityId == value.pragmaEntityId)
    chai.assert(actual.value == value.value)
}

function addRandom(values: Array<any>): void{
    values.forEach(i => i.value = randomString(256))
}