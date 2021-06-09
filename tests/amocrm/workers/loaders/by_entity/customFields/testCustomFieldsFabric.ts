import {IAmocrmLoaders} from "../../../../../../workers/amocrm/interface";
import {IBasic} from "../../../../../../generals/IBasic";
import {CustomFieldsFabric} from "../../../../../../workers/amocrm/loaders/custom_fields/CustomFieldsFabric";
import {CRMDB} from "../../../../../../generals/data_base/CRMDB";
import IAmocrmCustomField = IAmocrmLoaders.IAmocrmCustomField;
import randomString = IBasic.randomString;
import {Generals} from "../../../../../../generals/Interfaces";
import FieldType = Generals.FieldType;


const chai = require('chai')


export async function testCustomFieldsFabric(): Promise<void> {
    describe('CustomFieldsFabric', () => {
        it('save', async () => {
            const cf = await saveTestUniqueCF()
            await checkActualCF(cf)
        })
        it('update', async () => {
            const cf = await saveTestUniqueCF()
            changeRandom(cf)
            await saveCustomFields(cf)
            await checkActualCF(cf)
        })
    })
}

export async function saveTestUniqueCF(quantity: number = 70): Promise<Array<IAmocrmCustomField>> {
    const customFields = await uniqueCustomFields(quantity)
    await saveCustomFields(customFields)
    return customFields
}

async function saveCustomFields(cf: Array<IAmocrmCustomField>): Promise<void> {
    await CustomFieldsFabric.save(cf)
}

function uniqueCustomFields(quantity: number): Promise<Array<IAmocrmCustomField>> {
    const cf: Array<IAmocrmCustomField> = []
    const pragmaAccountId = random()
    for(let i = 0; i < quantity; i++)
        cf.push(uniqueCustomField(pragmaAccountId))
    delayDeletion(pragmaAccountId)
    // @ts-ignore
    return cf
}

function uniqueCustomField(pragmaAccountId: number): IAmocrmCustomField {
    return {
        enums: [],
        amocrmAccountId: random(),
        amocrmEntityType: "leads",
        amocrmFieldId: random(),
        amocrmFieldType: randomString(5),
        pragmaAccountId,
        pragmaEntityType: randomEntityType(),
        pragmaFieldId: 0,
        title: randomString(15),
        pragmaFieldType: randomType()
    }
}

function random(): number {
    return Math.ceil(Math.random() * 1000000)
}

function randomType(): FieldType {
    const n = Math.ceil(Math.random() * 10)
    switch (n) {
        case 0: return FieldType.date
        case 1: return FieldType.enums
        case 2: return FieldType.float
        case 3: return FieldType.multienums
        case 4: return FieldType.string
        default: return FieldType.unknown
    }
}

function randomEntityType(): number {
    const n = Math.ceil(Math.random() * 10) / 2
    return Math.ceil(n)
}

function delayDeletion(pragmaAccountId: number): void {
    const sql = `DELETE FROM ${CRMDB.fieldsSchema} WHERE account_id = ${pragmaAccountId}`
    setTimeout(() => CRMDB.query(sql), 2000)
}

async function checkActualCF(cf: Array<IAmocrmCustomField>): Promise<void> {
    const actual = await actualCustomFields(cf[0].pragmaAccountId)
    compareFields(actual, cf)
}

async function actualCustomFields(pragmaAccountId: number): Promise<Array<any>> {
    const pragma = CRMDB.fieldsSchema
    const amocrm = CRMDB.amocrmFieldsSchema
    const sql = `SELECT 
                    ${pragma}.id as pragmaFieldId,
                    ${pragma}.account_id as pragmaAccountId,
                    ${pragma}.entity_type as pragmaEntityType,
                    ${pragma}.title as title,
                    ${pragma}.type as pragmaFieldType,
                    ${amocrm}.field_id as amocrmFieldId,
                    ${amocrm}.account_id as amocrmAccountId,
                    ${amocrm}.entity_type as amocrmEntityType,
                    ${amocrm}.field_type as amocrmFieldType
                FROM ${pragma}
                    INNER JOIN ${amocrm} ON ${amocrm}.pragma_field_id = ${pragma}.id
                WHERE ${pragma}.account_id = ${pragmaAccountId}`
    return await CRMDB.query(sql)
}

function compareFields(actual: Array<IAmocrmCustomField>, fields: Array<IAmocrmCustomField>): void {
    chai.assert(actual.length === fields.length)
    actual.filter(a => compare(a, fields.find(f => a.pragmaFieldId == f.pragmaFieldId)))
}

function compare(actual: IAmocrmCustomField, field: IAmocrmCustomField): void {
    chai.assert(actual.amocrmFieldId === field.amocrmFieldId)
    chai.assert(actual.amocrmAccountId === field.amocrmAccountId)
    chai.assert(actual.amocrmEntityType === field.amocrmEntityType)
    chai.assert(actual.amocrmFieldType === field.amocrmFieldType)
    chai.assert(actual.pragmaFieldId === field.pragmaFieldId)
    chai.assert(actual.pragmaAccountId === field.pragmaAccountId)
    chai.assert(actual.pragmaEntityType === field.pragmaEntityType)
    chai.assert(actual.title === field.title)
    chai.assert(actual.pragmaFieldType === field.pragmaFieldType)
}

function changeRandom(cfs: Array<any>): void {
    cfs.forEach(cf => {
        cf.amocrmFieldType = randomString(5)
        cf.title = randomString(5)
        cf.pragmaFieldType = randomType()
    })
}