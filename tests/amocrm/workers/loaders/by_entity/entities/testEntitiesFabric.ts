import {
    CompaniesFabric,
    ContactsFabric, IAmoEntityLinks, IFieldsValues,
    ILoadedEntity,
    ILoadedValue, LeadsFabric
} from "../../../../../../workers/amocrm/loaders/entities/EntitiesFabric";
import {IBasic} from "../../../../../../generals/IBasic";
import {saveTestUniqueCF} from "../customFields/testCustomFieldsFabric";
import {
    checkTestActualEnumsValues,
    createTestEnumsValuesToSave,
    randomTestEnumId
} from "./values/testEnumsValuesFabric";
import {
    checkTestActualStringValues,
    createTestStringValuesToSave,
    testUniqueAccountId
} from "./values/testStringValuesFabric";
import {Generals} from "../../../../../../generals/Interfaces";
import {CRMDB} from "../../../../../../generals/data_base/CRMDB";
import randomString = IBasic.randomString;
import EntityGroup = Generals.EntityGroup;
import FieldType = Generals.FieldType;
import EntityFieldName = Generals.FieldName;
import AmocrmEntityGroup = Generals.AmocrmEntityGroup;

const chai = require('chai')

export async function testEntitiesFabric(): Promise<void> {
    describe('EntitiesFabric', () => {
        describe('Contacts', () => {
            it('save', async () => {
                const entities = await saveTestContacts()
                await checkContactsEntities(entities)
            })
            it('update', async () => {
                const entities = await saveTestContacts()
                await addRandom(entities)
                await checkContactsEntities(entities)
            })
        })
        describe('Companies', () => {
            it('save', async () => {
                const entities = await saveTestCompanies()
                await checkCompaniesEntities(entities)
            })
            it('update', async () => {
                const entities = await saveTestCompanies()
                await addRandom(entities)
                await checkCompaniesEntities(entities)
            })
        })
        describe('Leads', () => {
            it('save', async () => {
                const entities = await saveTestLeads()
                await checkLeadsEntities(entities)
            })
            it('update', async () => {
                const entities = await saveTestLeads()
                await addRandom(entities)
                await checkLeadsEntities(entities)
            })
        })
    })
}

export async function saveTestContacts(quantity: number = 51, pragmaAccountId: number = 0): Promise<Array<ILoadedEntity>> {
    const entities = await createTestUniqueEntitiesToSave(quantity)
    await saveAsContacts(entities, pragmaAccountId)
    return entities
}

export async function saveTestCompanies(quantity: number = 51, pragmaAccountId: number = 0): Promise<Array<ILoadedEntity>> {
    const entities = await createTestUniqueEntitiesToSave(quantity)
    await saveAsCompanies(entities, pragmaAccountId)
    return entities
}

export async function saveTestLeads(quantity: number = 51, pragmaAccountId: number = 0): Promise<Array<ILoadedEntity>> {
    const entities = await createTestUniqueEntitiesToSave(quantity)
    await saveAsLeads(entities, pragmaAccountId)
    return entities
}

async function saveAsContacts(entities: Array<ILoadedEntity>, pragmaAccountId: number = 0): Promise<void> {
    pragmaAccountId = pragmaAccountId || await testUniqueAccountId()
    const contact = new ContactsFabric(pragmaAccountId, random())
    await contact.save(entities)
}

async function saveAsCompanies(entities: Array<ILoadedEntity>, pragmaAccountId: number = 0): Promise<void> {
    pragmaAccountId = pragmaAccountId || await testUniqueAccountId()
    const contact = new CompaniesFabric(pragmaAccountId, random())
    await contact.save(entities)
}

async function saveAsLeads(entities: Array<ILoadedEntity>, pragmaAccountId: number = 0): Promise<void> {
    pragmaAccountId = pragmaAccountId || await testUniqueAccountId()
    const contact = new LeadsFabric(pragmaAccountId, random())
    await contact.save(entities)
}

async function createTestUniqueEntitiesToSave(quantity: number = 51): Promise<Array<ILoadedEntity>> {
    const promises = []
    const fieldsIds = await getUniqueFieldsIds()
    for (let i = 0; i < quantity; i ++)
        promises.push(entityToCrete(fieldsIds))
    return await Promise.all(promises)
}

async function entityToCrete(fieldsIds: Array<number>): Promise<ILoadedEntity> {
    try {
        return await _entityToCreate(fieldsIds)
    } catch (e) {
        throw e
    }
}

async function _entityToCreate(fieldsIds: Array<number>): Promise<ILoadedEntity> {
    const groups = fieldsIds.map(async (id, index) => {
        if(index % 2 > 0)
            return await createTestEnumsValuesToSave(0, [id])
        return createTestStringValuesToSave(0, [id])
    })
    const promises = [].concat(...groups)
    const values = await Promise.all(promises)
    const links: any = []
    const otherFieldsValues: any = []
    return {
        fieldsValues: createFieldsValues(),
        otherFieldsValues,
        links,
        amocrmEntityId: random(),
        pragmaEntityId: 0,
        values,
    }
}

function createFieldsValues(): IFieldsValues {
    return {
        pragmaEntityId: 0,
        date_create: createFieldValue(EntityFieldName.date_create),
        date_update: createFieldValue(EntityFieldName.date_update),
        price: createFieldValue(EntityFieldName.price),
        title: createFieldValue(EntityFieldName.title)
    }
}

function createFieldValue(name: EntityFieldName): ILoadedValue {
    return {
        pragmaFieldId: 0,
        pragmaFieldName: name,
        pragmaFieldType: getFieldType(name),
        value: getRandomValue(name)
    }
}

function getRandomValue(name: EntityFieldName): string|number|Date {
    switch (name) {
        case EntityFieldName.costs:
        case EntityFieldName.price:
            return random()
        case EntityFieldName.title:
            return randomString(256)
        case EntityFieldName.date_create:
        case EntityFieldName.date_update: {
            const randomTime = Math.ceil(Math.random() * 99999999) * 1000
            return new Date(randomTime)
        }
    }
}

function getFieldType(name: EntityFieldName): FieldType {
    switch (name) {
        case EntityFieldName.costs:
        case EntityFieldName.price:
            return FieldType.float
        case EntityFieldName.title:
            return FieldType.string
        case EntityFieldName.date_create:
        case EntityFieldName.date_update: {
            return FieldType.date
        }
    }
}

function random(): number {
    return Math.ceil(Math.random() * 1000000000)
}

async function getUniqueFieldsIds(): Promise<Array<number>> {
    const fields = await saveTestUniqueCF(5)
    return fields.map(i => i.pragmaFieldId)
}

async function checkContactsEntities(entities: Array<ILoadedEntity>): Promise<void> {
    await checkEntities(entities, AmocrmEntityGroup.contacts, EntityGroup.contacts)
}

async function checkCompaniesEntities(entities: Array<ILoadedEntity>): Promise<void> {
    await checkEntities(entities, AmocrmEntityGroup.companies, EntityGroup.companies)
}

async function checkLeadsEntities(entities: Array<ILoadedEntity>): Promise<void> {
    await checkEntities(entities, AmocrmEntityGroup.leads, EntityGroup.leads)
}

async function checkEntities(entities: Array<ILoadedEntity>, amocrmEntityType: AmocrmEntityGroup, pragmaEntityType: EntityGroup): Promise<void> {
    const actualEntities = await getActualEntities(entities)
    checkEntitiesTypes(actualEntities, amocrmEntityType, pragmaEntityType)
    checkActualValues(actualEntities, entities)
}

async function getActualEntities(entities: Array<ILoadedEntity>): Promise<Array<any>> {
    const amocrm = CRMDB.amocrmEntitiesSchema
    const pragma = CRMDB.entitiesSchema
    const condition = entities.map(i => `id = ${i.pragmaEntityId}`).join(' OR ')
    const sql = `SELECT
                    ${pragma}.id AS pragmaEntityId,
                    ${pragma}.account_id AS pragmaAccountId,
                    ${pragma}.entity_type AS pragmaEntityType,
                    ${pragma}.price AS price,
                    ${pragma}.costs AS costs,
                    ${pragma}.title AS title,
                    ${pragma}.date_create AS date_create,
                    ${pragma}.date_update AS date_update,
                    
                    ${amocrm}.entity_id AS amocrmEntityId,
                    ${amocrm}.type AS amocrmEntityType
                FROM ${pragma} 
                    INNER JOIN ${amocrm} ON ${amocrm}.pragma_entity_id = ${pragma}.id
                WHERE ${condition}`
    return await CRMDB.query(sql)
}

function checkEntitiesTypes(actual: Array<any>, amocrmEntityType: AmocrmEntityGroup, pragmaEntityType: EntityGroup): void {
    actual.forEach(i => {
        chai.assert(i.pragmaEntityType === pragmaEntityType)
        chai.assert(i.amocrmEntityType === amocrmEntityType)
    })
}

async function checkActualValues(actualEntities: Array<any>, entities: Array<ILoadedEntity>): Promise<void> {
    checkActualFieldsValues(actualEntities, entities)
    await checkValues(entities)
}

async function checkValues(entities: Array<ILoadedEntity>): Promise<void> {
    await Promise.all(entities.map(i => checkActualEntityValues(i)))
}

async function checkActualEntityValues(entity: ILoadedEntity): Promise<void> {
    const values = entity.values.filter(val => !val.pragmaFieldName)
    const enumValues = values.filter(val => val.pragmaFieldType === 'enums')
    const stringValues = values.filter(val => val.pragmaFieldType !== 'enums')
    await Promise.all([
        checkTestActualEnumsValues(enumValues),
        checkTestActualStringValues(stringValues)
    ])
}

function checkActualFieldsValues(actualEntities: Array<any>, entities: Array<ILoadedEntity>): void {
    actualEntities.forEach(actual => {
        const entity = entities.find(en => en.pragmaEntityId == actual.pragmaEntityId)
        const fieldsValues = entity.values.filter(val => val.pragmaFieldName)
        fieldsValues.forEach(value => {
            const actualValue = actual[value.pragmaFieldName]
            compareValues(actualValue, value)
        })
    })
}

function compareValues(actual: any, value: any): void {
    if(value instanceof Date)
        chai.assert(value.getTime() === actual.getTime())
    else
        chai.assert(value == actual)
}

async function addRandom(entities: Array<ILoadedEntity>): Promise<void> {
    await Promise.all(entities.map(i => addRandomToValues(i.values)))
}

async function addRandomToValues(values: Array<ILoadedValue>): Promise<void> {
    await Promise.all(values.map(val => addRandomToValue(val)))
}

async function addRandomToValue(value: any): Promise<void> {
    if (value.pragmaFieldType === 'string')
        value.value = randomString(256)
    else if (value.pragmaFieldType === 'enums') {
        value.value = await randomTestEnumId(value.pragmaFieldId)
    }
}