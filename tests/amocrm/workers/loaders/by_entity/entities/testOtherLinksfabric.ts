import {saveTestUniqueStatuses} from "../pipelines/testStatusesFabric";
import {saveTestUniqueUsers} from "../users/testUsersFabric";
import {CRMDB} from "../../../../../../generals/data_base/CRMDB";
import {ILoadedValue, IOtherFieldsValues} from "../../../../../../workers/amocrm/loaders/entities/EntitiesFabric";
import {Generals} from "../../../../../../generals/Interfaces";
import FieldName = Generals.FieldName;
import FieldType = Generals.FieldType;
import {testUniquesEntitiesId} from "./values/testStringValuesFabric";
import {OthersFieldsValuesFabric} from "../../../../../../workers/amocrm/loaders/entities/OtherFieldsValues";

const chai = require('chai')

export async function testOtherLinksFabric(): Promise<void> {
    describe('OthersLinksFabric', () => {
        it('save', async () => {
            const testEntities = await createTestEntities()
            const values = await saveOtherValues(testEntities)
            await save(values)
            await checkActualValues(values)
        })
    })
}

async function safeDelete(): Promise<void> {
    if(process.platform === 'win32') {
        const sql = `DELETE FROM ${CRMDB.statusDurationSchema} WHERE 1`
        await CRMDB.query(sql)
    }
}
async function createTestEntities(): Promise<Array<Array<number>>> {
    await safeDelete()
    return await getTestEntities()
}

async function getTestEntities(quantity: number = 101): Promise<Array<Array<number>>> {
    return await Promise.all([
        testUniquesEntitiesId(quantity),
        testUniquesPipelines(quantity),
        testUniquesStatuses(quantity),
        testUniquesUsers(quantity),
    ])
}

async function testUniquesPipelines(quantity: number): Promise<Array<number>> {
    let promises = []
    for(let i = 0; i < quantity; i++)
        promises.push(insertPipeline())

    const ids = await Promise.all(promises)
    delayPipelinesDeletion(ids)
    return ids
}

async function insertPipeline(): Promise<number> {
    const sql = `INSERT INTO ${CRMDB.pipelinesSchema} (account_id, name, sort)
                VALUES (1,'2',3)`
    const answer = await CRMDB.query(sql)
    return answer['insertId']
}
function delayPipelinesDeletion(ids: Array<number>): void {
    const condition = ids.map(i => `id = ${i}`).join(',')
    const sql = `DELETE FROM ${CRMDB.pipelinesSchema} WHERE ${condition}`
    setTimeout(() => CRMDB.query(sql), 2000)
}

async function testUniquesStatuses(quantity: number): Promise<Array<number>> {
    const statuses = await saveTestUniqueStatuses(quantity)
    return statuses.map(i => i.pragmaStatusId)
}

async function testUniquesUsers(quantity: number): Promise<Array<number>> {
    const users = await saveTestUniqueUsers(quantity)
    return users.map(i => i.pragmaUserId)
}

async function saveOtherValues(entities: Array<Array<number>>): Promise<Array<IOtherFieldsValues>> {
    const otherValues = createOtherValues(entities)
    await save(otherValues)
    return otherValues
}

async function save(otherValues: Array<IOtherFieldsValues>): Promise<void> {
    await OthersFieldsValuesFabric.save(otherValues)
}

function createOtherValues(entities: Array<Array<number>>): Array<IOtherFieldsValues> {
    return entities[0].map((i, index) => createOtherFieldValue(entities, index))
}

function createOtherFieldValue(entities: Array<Array<number>>, index: number): IOtherFieldsValues {
    const {entity_id, pipeline_id, status_id, user_id} = fetchValues(entities, index)

    const user = index % 2 ? createValue(entity_id, user_id, FieldName.responsible_user_id, FieldType.user_id) : undefined
    const pipeline = createValue(entity_id, pipeline_id, FieldName.pipeline_id, FieldType.pipeline_id)
    const status = createValue(entity_id, status_id, FieldName.status_id, FieldType.status_id)

    return {
        pragmaEntityId: entity_id,
        pipeline,
        status,
        user,
    }
}

function fetchValues (entities: Array<Array<number>>, index): any {
    return {
        entity_id: entities[0][index],
        pipeline_id: entities[1][index],
        status_id: entities[2][index],
        user_id: entities[3][index],
    }
}

function createValue(entity_id: number, value: number, name: FieldName, type: FieldType): ILoadedValue {
    return {
        pragmaEntityId: entity_id,
        pragmaFieldId: 0,
        pragmaFieldName: FieldName.status_id,
        pragmaFieldType: type,
        value
    }
}

async function checkActualValues(expectValues: Array<IOtherFieldsValues>): Promise<void> {
    await Promise.all([
        checkDurationValues(expectValues),
        checkUsersValues(expectValues),
        checkStatusValues(expectValues),
    ])
}

async function checkDurationValues(expectValues: Array<IOtherFieldsValues>): Promise<void> {
    const actual = await queryActualValues(expectValues.map(i => i.pragmaEntityId))
    chai.assert(actual.length === expectValues.length)
    actual.forEach(a => compareValues(a, expectValues.find(i => i.pragmaEntityId == a.entity_id)))
}

async function queryActualValues(entities_id: Array<number>): Promise<Array<any>> {
    const condition = entities_id.map(id => `entity_id = ${id}`).join(' OR ')
    const sql = `SELECT
                    status_id,
                    entity_id,
                    pipeline_id,
                    user_id
                FROM ${CRMDB.statusDurationSchema} 
                WHERE ${condition}`
    return await CRMDB.query(sql)
}

function compareValues(actual: any, expect: IOtherFieldsValues): void {
    chai.assert(actual.entity_id == expect.pragmaEntityId)
    chai.assert(actual.status_id == expect.status.value)
    chai.assert(actual.pipeline_id == expect.pipeline.value)
    if(expect.user)
        chai.assert(actual.user_id == expect.user.value)
    else
        chai.assert(!actual.user_id)
}

async function checkUsersValues(expectValues: Array<IOtherFieldsValues>): Promise<void> {
    const actualLinks = await queryEntitiesToUserLinks(expectValues)
    expectValues = expectValues.filter(i => i.user)
    chai.assert(actualLinks.length === expectValues.length)
    actualLinks.forEach(a => compareUsersLink(a, expectValues.find(e => e.pragmaEntityId === a.entity_id)))
}

async function queryEntitiesToUserLinks(expectValues: Array<IOtherFieldsValues>): Promise<Array<any>> {
    const condition = expectValues.map(i => `entity_id = ${i.pragmaEntityId}`).join(' OR ')
    const sql = `SELECT
                    entity_id,
                    user_id
                FROM ${CRMDB.entitiesToUserSchema} 
                WHERE ${condition}`
    return await CRMDB.query(sql)
}

function compareUsersLink(actualLink: any, expectValue: IOtherFieldsValues): void {
    chai.assert(actualLink.user_id == expectValue.user.value)
    chai.assert(actualLink.entity_id == expectValue.pragmaEntityId)
}

async function checkStatusValues(expectValues: Array<IOtherFieldsValues>): Promise<void> {
    const actualLinks = await queryEntitiesToStatusLinks(expectValues)
    expectValues = expectValues.filter(i => i.status && i.pipeline)
    chai.assert(actualLinks.length === expectValues.length)
    actualLinks.forEach(a => compareStatusLink(a, expectValues.find(e => e.pragmaEntityId === a.entity_id)))
}

async function queryEntitiesToStatusLinks(expectValues: Array<IOtherFieldsValues>): Promise<Array<any>> {
    const condition = expectValues.map(i => `entity_id = ${i.pragmaEntityId}`).join(' OR ')
    const sql = `SELECT
                    entity_id,
                    pipeline_id,
                    status_id
                FROM ${CRMDB.entitiesToStatusSchema} 
                WHERE ${condition}`
    return await CRMDB.query(sql)
}

function compareStatusLink(actualLink: any, expectValue: IOtherFieldsValues): void {
    chai.assert(actualLink.status_id == expectValue.status.value)
    chai.assert(actualLink.pipeline_id == expectValue.pipeline.value)
    chai.assert(actualLink.entity_id == expectValue.pragmaEntityId)
}