import {loadTestUsers} from "./testUsers";
import {Amocrm} from "../../../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {TestFabric} from "../../TestFabric";
import {IAmocrmLoaders} from "../../../../../workers/amocrm/interface";
import IAmocrmJob = IAmocrmLoaders.IAmoJob;
import {loadTestPipelines} from "./testPipelines";
import {loadAllTestCustomFields} from "./testCustomFields";
import {
    CompaniesLoader,
    ContactsLoader, EntitiesLoader,
    LeadsLoader
} from "../../../../../workers/amocrm/loaders/entities/BasicEntitiesLoader";
import {LoadDataSets} from "../LoadDataSets";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {Func} from "../../../../../generals/Func";
import {Generals} from "../../../../../generals/Interfaces";
import EntityFieldName = Generals.FieldName;
import FieldType = Generals.FieldType;
import {EntitiesValidator} from "../../../../../workers/amocrm/loaders/entities/EntitiesValidator";
import {ILoadedValue,} from "../../../../../workers/amocrm/loaders/entities/EntitiesFabric";
import FieldName = Generals.FieldName;
import {IMainWorkers} from "../../../../../workers/main/interface";
import WorkerStatus = IMainWorkers.WorkerStatus;

const chai = require('chai')

export async function testEntitiesDataSets(): Promise<void> {
    describe('LoadEntities with test data sets', () => {
        it('run with test data sets', async () => {
            await safeDeleteEntities()
            const node = await TestFabric.getTestNodeStruct()
            await loadDefault(node)
            const {workers, loader} = await loadAllEntities(node)
            const result = await loader.run()
            chai.assert(result.status_name === WorkerStatus.completed)
            await checkEntities(node.account.pragma_account_id, workers)
        })
    })
}

async function safeDeleteEntities(): Promise<void> {
    if(process.platform === 'win32') {
        const sql = `DELETE FROM ${CRMDB.entitiesSchema} WHERE 1`
        await CRMDB.query(sql)
    }
}

// @ts-ignore
class TestContactsLoader extends ContactsLoader {
    protected readonly loadersQuantity: number = 2

    protected async restQuery(): Promise<any> {
        // @ts-ignore
        this.currentPage++
        return TestContactsLoader.amocrmTestEntitiesAnswer
    }

    static get amocrmTestEntitiesAnswer(): any {
        return LoadDataSets.getFileContent('ContactsLoader' + '.json')
    }

    get expectTestEntities(): Array<any> {
        const amoEntities = TestContactsLoader.amocrmTestEntitiesAnswer.body._embedded.contacts
        return formatting(amoEntities, this)
    }
}

// @ts-ignore
class TestCompaniesLoader extends CompaniesLoader {
    protected readonly loadersQuantity: number = 2

    protected async restQuery(): Promise<any> {
        // @ts-ignore
        this.currentPage++
        return TestCompaniesLoader.amocrmTestEntitiesAnswer
    }

    static get amocrmTestEntitiesAnswer(): any {
        return LoadDataSets.getFileContent('CompaniesLoader' + '.json')
    }

    get expectTestEntities(): Array<any> {
        const amoEntities = TestCompaniesLoader.amocrmTestEntitiesAnswer.body._embedded.companies
        return formatting(amoEntities, this)
    }
}

// @ts-ignore
class TestLeadsLoader extends LeadsLoader {
    protected readonly loadersQuantity: number = 2

    protected async restQuery(): Promise<any> {
        // @ts-ignore
        this.currentPage++
        return TestLeadsLoader.amocrmTestEntitiesAnswer
    }

    static get amocrmTestEntitiesAnswer(): any {
        return LoadDataSets.getFileContent('LeadsLoader' + '.json')
    }

    get expectTestEntities(): Array<any> {
        const amoEntities = TestLeadsLoader.amocrmTestEntitiesAnswer.body._embedded.leads
        return formatting(amoEntities, this)
    }
}

function formatting(entities: Array<any>, loader: any): Array<any> {
    const validator = new EntitiesValidator(loader.buffer, loader.amocrmEntityGroup)
    return validator.formatting(entities).map(i => {
        const entity: any =  {
            amocrmEntityId: i.amocrmEntityId,
            amocrmEntityType: loader.amocrmEntityGroup,
            pragmaEntityType: Func.toPragmaEntityType(loader.amocrmEntityGroup),
            amocrmAccountId: loader.job.node.account.amocrm_account_id,
            pragmaAccountId: loader.job.node.account.pragma_account_id,
            fieldsValues: i.fieldsValues,
            otherFieldsValues: i.otherFieldsValues,
        }
        entity.values = formattingValues(entity, i.values)
        return entity
    })
}

function formattingValues(entity: any, values: Array<any>): Array<any> {
    return values.map(v => {
        return Object.assign(v, {
            amocrmEntityId: entity.amocrmEntityId,
            amocrmAccountId: entity.amocrmAccountId,
            amocrmEntityType: entity.amocrmEntityType,
        })
    })
}

async function loadDefault(node: IAmocrmNodeStruct): Promise<void> {
    const jobs = await createJobs(node)
    await Promise.all([
        loadTestUsers(jobs[0]),
        loadTestPipelines(jobs[0]),
        loadAllTestCustomFields(jobs[0]),
    ])
}

async function loadAllEntities(node: IAmocrmNodeStruct): Promise<any> {
    try {
        const {loader, buffer, workers} = await createTestEntitiesLoader(node)
        await loader.run()
        return {workers, loader}
    } catch (e) {
        throw e
    }
}

async function createTestEntitiesLoader(node: IAmocrmNodeStruct): Promise<any> {
    const jobs = await createJobs(node)
    const entitiesLoader = await EntitiesLoader.create(jobs[3])
    // @ts-ignore
    const buffer = entitiesLoader.buffer
    const loaders = [
        new TestContactsLoader(jobs[3], buffer),
        new TestCompaniesLoader(jobs[3], buffer),
        new TestLeadsLoader(jobs[3], buffer),
    ]
    // @ts-ignore
    entitiesLoader.loaders = loaders
    return {loader: entitiesLoader, buffer, workers: [].concat(loaders)}
}

async function createJobs(node: IAmocrmNodeStruct): Promise<Array<IAmocrmJob>> {
    return await Promise.all([
        TestFabric.createLoadUsersJob(node),
        TestFabric.createLoadPipelinesJob(node),
        TestFabric.createLoadCustomFieldsJob(node),
        TestFabric.createLoadEntitiesJob(node),
    ])
}

async function checkEntities(pragmaAccountId: number, workers: Array<any>): Promise<void> {
    const actual = await actualEntities(pragmaAccountId)
    const input = fetchExpectEntities(workers)
    compareEntities(actual, input)
    await checkLinks()
}

function fetchExpectEntities(workers: Array<any>): Array<any> {
    return [].concat(...workers.map(w => w.expectTestEntities))
}


async function actualEntities(pragmaAccountId: number): Promise<Array<any>> {
    const entities = await queryActualEntities(pragmaAccountId)
    return await Promise.all(entities.map(i => convertEntity(i)))
}

async function queryActualEntities(pragmaAccountId: number): Promise<Array<any>> {
    const pragma = CRMDB.entitiesSchema
    const amocrm = CRMDB.amocrmEntitiesSchema
    const sql = `SELECT
                    ${pragma}.id as pragmaEntityId,
                    ${pragma}.account_id as pragmaAccountId,
                    ${pragma}.entity_type as pragmaEntityType,
                    ${pragma}.price as price,
                    ${pragma}.title as title,
                    ${pragma}.date_create as date_create,
                    ${pragma}.date_update as date_update,
                    ${pragma}.deleted as deleted,
                    ${amocrm}.entity_id as amocrmEntityId,
                    ${amocrm}.account_id as amocrmAccountId,
                    ${amocrm}.type as amocrmEntityType
                FROM ${pragma}
                    INNER JOIN ${amocrm} ON ${amocrm}.pragma_entity_id = ${pragma}.id
                WHERE ${pragma}.account_id = ${pragmaAccountId}`
    return await CRMDB.query(sql)
}

async function convertEntity(actualEntity: any): Promise<any> {
    const fieldsValues = fetchFieldsValue(actualEntity)
    const otherFields = await otherFieldsValues(actualEntity)
    return {
        amocrmEntityId: actualEntity.amocrmEntityId,
        pragmaEntityId: actualEntity.pragmaEntityId,
        pragmaEntityType: actualEntity.pragmaEntityType,
        amocrmEntityType: actualEntity.amocrmEntityType,
        amocrmAccountId: actualEntity.amocrmAccountId,
        pragmaAccountId: actualEntity.pragmaAccountId,
        values: await actualValuesFromTables(actualEntity.pragmaEntityId),
        fieldsValues: fieldsValues,
        otherFieldsValues: [...otherFields, fieldsValues.find(i => i.pragmaFieldName === FieldName.date_update)].filter(i => i)
    }
}

async function actualValuesFromTables(pragmaEntityId: number): Promise<Array<any>> {
    const values = await queryAllValues(pragmaEntityId)
    return formattingValuesFromTables(values)
}

async function queryAllValues (pragmaEntityId: number): Promise<Array<any>> {
    const types = await Promise.all([
        queryValues(pragmaEntityId, CRMDB.stringValuesSchema, 'value'),
        queryValues(pragmaEntityId, CRMDB.enumsValuesSchema, 'option_id'),
    ])
    return [].concat(...types)
}

async function queryValues(pragmaEntityId: number, valuesSchema: string, valueFieldName: string): Promise<Array<any>> {
    const amocrmFields = CRMDB.amocrmFieldsSchema
    const amocrmEntities = CRMDB.amocrmEntitiesSchema
    const sql = `SELECT
                    ${valuesSchema}.entity_id as pragmaEntityId,
                    ${amocrmEntities}.entity_id as amocrmEntityId,
                    ${amocrmEntities}.account_id as amocrmAccountId,
                    ${valuesSchema}.field_id as pragmaFieldId,
                    ${valuesSchema}.${valueFieldName} as value,
                    ${amocrmFields}.field_id as amocrmFieldId,
                    ${amocrmFields}.account_id as amocrmFieldId,
                    ${amocrmFields}.field_type as amocrmFieldType,
                    ${amocrmFields}.entity_type as amocrmEntityType
                FROM ${valuesSchema}
                    INNER JOIN ${amocrmFields} ON ${amocrmFields}.pragma_field_id = ${valuesSchema}.field_id
                    INNER JOIN ${amocrmEntities} ON ${amocrmEntities}.pragma_entity_id = ${valuesSchema}.entity_id
                WHERE ${valuesSchema}.entity_id = ${pragmaEntityId}`
    return await CRMDB.query(sql)
}

function formattingValuesFromTables(values: Array<any>): Array<any> {
    return values.map(i => formattingValueFromTable(i))
}

function formattingValueFromTable(value: any): any {
    return Object.assign(value, {
        pragmaEntityType: Func.toPragmaEntityType(value.amocrmEntityType),
        pragmaFieldType: Func.toPragmaFieldType(value.amocrmFieldType),
    })
}


function fetchFieldsValue(actualEntity: any): Array<any> {
    return [
        fieldValue(actualEntity, EntityFieldName.date_create, FieldType.date),
        fieldValue(actualEntity, EntityFieldName.date_update, FieldType.date),
        fieldValue(actualEntity, EntityFieldName.price, FieldType.float),
        fieldValue(actualEntity, EntityFieldName.title, FieldType.string),
    ]
}

function fieldValue(actualEntity: any, fieldName: EntityFieldName, fieldType: FieldType): any {
    return {
        pragmaEntityId: actualEntity.pragmaEntityId,
        pragmaFieldId: 0,
        pragmaFieldName: fieldName,
        value: actualEntity[fieldName],
        amocrmFieldId: 0,
        amocrmFieldType: '',
        amocrmEntityType: actualEntity.amocrmEntityType,
        pragmaEntityType: actualEntity.pragmaEntityType,
        pragmaFieldType: fieldType,
    }
}

async function otherFieldsValues(actualEntity: any): Promise<Array<ILoadedValue>> {
    const values = await Promise.all([
        userValue(actualEntity.pragmaEntityId),
        statusPipelineValue(actualEntity.pragmaEntityId),
    ])
    const otherFieldsValues = values[1] ? [values[0], values[1].pipeline, values[1].status] : [values[0]]
    return otherFieldsValues.filter(i => i && i.value)
}

async function userValue(pragmaEntityId: number): Promise<ILoadedValue|null> {
    const links = await queryActualEntityUsersLinks(pragmaEntityId)
    if(!links.length) return null
    return {
        pragmaEntityId,
        pragmaFieldId: 0,
        pragmaFieldName: FieldName.responsible_user_id,
        pragmaFieldType: FieldType.user_id,
        value: links[0].user_id
    }
}

async function queryActualEntityUsersLinks(pragmaEntityId: number): Promise<Array<any>> {
    const sql = `SELECT
                    entity_id,
                    user_id
                FROM ${CRMDB.entitiesToUserSchema} 
                WHERE entity_id = ${pragmaEntityId}`
    return await CRMDB.query(sql)
}

async function statusPipelineValue(pragmaEntityId: number): Promise<any> {
    const links = await queryActualEntityStatusLinks(pragmaEntityId)
    if(!links.length) return ;
    return {
        status: {
            pragmaEntityId,
            pragmaFieldId: 0,
            pragmaFieldName: FieldName.status_id,
            pragmaFieldType: FieldType.status_id,
            value: links[0].status_id
        },
        pipeline: {
            pragmaEntityId,
            pragmaFieldId: 0,
            pragmaFieldName: FieldName.pipeline_id,
            pragmaFieldType: FieldType.pipeline_id,
            value: links[0].pipeline_id
        },
    }
}

async function queryActualEntityStatusLinks(pragmaEntityId: number): Promise<Array<any>> {
    const sql = `SELECT
                    entity_id,
                    status_id,
                    pipeline_id
                FROM ${CRMDB.entitiesToStatusSchema} 
                WHERE entity_id = ${pragmaEntityId}`
    return await CRMDB.query(sql)
}

function compareEntities(actual: Array<any>, input: Array<any>): void {
    chai.assert(actual.length === input.length)
    actual.forEach(a => compareEntity(a, input.find(i => i.amocrmEntityId == a.amocrmEntityId && i.amocrmEntityType == a.amocrmEntityType)))
}

function compareEntity(actual: any, input: any): void {
    chai.assert(actual.amocrmEntityId === input.amocrmEntityId)
    chai.assert(actual.pragmaEntityType === input.pragmaEntityType)
    chai.assert(actual.amocrmEntityType === input.amocrmEntityType)
    chai.assert(actual.amocrmAccountId === input.amocrmAccountId)
    chai.assert(actual.pragmaAccountId === input.pragmaAccountId)
    compareValues(actual, input)
}


function compareValues(actualEntity: any, inputEntity: any): void {
    compareFieldsValues(actualEntity, inputEntity)
    compareTableValues(actualEntity, inputEntity)
    compareOtherFieldsValues(actualEntity, inputEntity)
}

function compareFieldsValues(actualEntity: any, inputEntity: any): void {
    const inputFieldsValues: any = Object.values(inputEntity.fieldsValues).filter(i => typeof i === 'object')
    chai.assert(actualEntity.fieldsValues.length === inputFieldsValues.length)
    actualEntity.fieldsValues.forEach(a => compareFieldsValue(a, inputFieldsValues.find(i => i.pragmaFieldName === a.pragmaFieldName)))
}

function compareFieldsValue(actual: any, input: any): void {
    chai.assert(actual.pragmaFieldName === input.pragmaFieldName)
    chai.assert(actual.pragmaFieldType === input.pragmaFieldType)

    compareVal(actual, input)
}

function compareTableValues(actualEntity: any, inputEntity: any): void {
    chai.assert(actualEntity.values.length === inputEntity.values.length)
    actualEntity.values.forEach(a => compareTableValue(a, inputEntity.values.find(i => i.pragmaFieldId === a.pragmaFieldId)))
}

function compareTableValue(actual: any, input: any): void {
    chai.assert(actual.pragmaFieldId === input.pragmaFieldId)
    chai.assert(actual.amocrmEntityId === input.amocrmEntityId)
    chai.assert(actual.amocrmAccountId === input.amocrmAccountId)
    chai.assert(actual.pragmaFieldName === input.pragmaFieldName)
    chai.assert(actual.pragmaFieldType === input.pragmaFieldType)
}

function compareVal(actual: any, input: any): void {
    const inputValue = input.pragmaFieldType === 'date' ? input.value.getTime() : input.value
    const actualValue = (actual.pragmaFieldType === 'date' && actual.pragmaFieldName) ? actual.value.getTime() : actual.value
    chai.assert(inputValue == actualValue)
}

async function checkLinks(): Promise<void> {
    const sql = `SELECT * FROM ${CRMDB.entitiesToEntitiesSchema} WHERE 1`
    const links = await CRMDB.query(sql)
    chai.assert(links.length === 9)
}

function compareOtherFieldsValues (actualEntity: any, inputEntity: any): void {
    const actualOtherValues = actualEntity.otherFieldsValues
    const inputOtherValues: Array<any> = Object.values(inputEntity.otherFieldsValues).filter((i: any) => typeof i === 'object' && i.value)
    chai.assert(actualOtherValues.length === inputOtherValues.length)
    actualOtherValues.forEach(a => compareOtherFieldValue(a, inputOtherValues.find(i => i.pragmaFieldName === a.pragmaFieldName)))
}

function compareOtherFieldValue(actual: any, input: any): void {
    chai.assert(actual.pragmaFieldId === input.pragmaFieldId)
    chai.assert(actual.pragmaFieldName === input.pragmaFieldName)
    chai.assert(actual.pragmaFieldType === input.pragmaFieldType)
    if(input.pragmaFieldType === FieldType.date)
        chai.assert(actual.value.getTime() === input.value.getTime())
    else
        chai.assert(actual.value === input.value)
}