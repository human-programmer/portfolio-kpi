import {IAmocrmLoaders} from "../../../../../../workers/amocrm/interface";
import IAmocrmEnum = IAmocrmLoaders.IAmocrmEnum;
import {IBasic} from "../../../../../../generals/IBasic";
import randomString = IBasic.randomString;
import {CRMDB} from "../../../../../../generals/data_base/CRMDB";
import {EnumsFabric} from "../../../../../../workers/amocrm/loaders/custom_fields/CustomFieldsFabric";

const chai = require('chai')

export async function testEnumsFabric(): Promise<void> {
    describe('EnumsFabric', () => {
        it('save', async () => {
            const enums = await saveTestUniqueEnums()
            await checkActualEnums(enums)
        })
        it('update', async () => {
            const enums = await saveTestUniqueEnums()
            addRandom(enums)
            await save(enums)
            await checkActualEnums(enums)
        })
    })
}

export async function saveTestUniqueEnums(): Promise<Array<IAmocrmEnum>> {
    const enums = uniqueEnums()
    await save(enums)
    return enums
}

async function save(enums: Array<IAmocrmEnum>): Promise<void> {
    await EnumsFabric.save(enums)
}

function uniqueEnums(quantity: number = 101): Array<IAmocrmEnum> {
    const enums: Array<IAmocrmEnum> = []
    const pragmaAccountId = random()
    for(let i = 0; i < quantity; i++)
        enums.push(uniqueEnum(pragmaAccountId))
    delayDeletion(pragmaAccountId)
    // @ts-ignore
    return enums
}

function uniqueEnum(pragmaAccountId: number): IAmocrmEnum {
    return {
        amocrmEnumId: random(),
        pragmaAccountId,
        pragmaFieldId: random(),
        sort: Math.ceil(Math.random() * 100),
        value: randomString(256)
    }
}

function random(): number {
    return Math.ceil(Math.random() * 1000000)
}

function delayDeletion(pragmaAccountId: number): void {
    const enums = CRMDB.enumsSchema
    const amocrm = CRMDB.amocrmEnumsSchema
    const sql = `DELETE ${enums}
                FROM ${enums}
                    INNER JOIN ${amocrm} ON ${amocrm}.pragma_id = ${enums}.id
                WHERE ${amocrm}.pragma_account_id = ${pragmaAccountId}`
    setTimeout(() => CRMDB.query(sql), 2000)
}

async function checkActualEnums(enums: Array<IAmocrmEnum>): Promise<void> {
    const actual = await getActualEnums(enums.map(en => en.pragmaEnumId))
    compareEnums(actual, enums)
}

async function getActualEnums(ids: Array<number>): Promise<Array<any>> {
    const condition = ids.map(id => `id = ${id}`).join(' OR ')
    const pragma = CRMDB.enumsSchema
    const amocrm = CRMDB.amocrmEnumsSchema
    const sql = `SELECT
                    ${pragma}.id AS pragmaEnumId,
                    ${pragma}.field_id AS pragmaFieldId,
                    ${pragma}.sort AS sort,
                    ${pragma}.value AS value,
                    ${amocrm}.pragma_account_id AS pragmaAccountId,
                    ${amocrm}.amocrm_id AS amocrmEnumId
                FROM ${pragma}
                    INNER JOIN ${amocrm} ON ${amocrm}.pragma_id = ${pragma}.id
                WHERE ${condition}`
    return CRMDB.query(sql)
}

function compareEnums (actual: Array<any>, enums: Array<IAmocrmEnum>): void {
    chai.assert(actual.length === enums.length)
    const f = enums.filter(i => actual.find(act => i.pragmaEnumId == act.pragmaEnumId && i.pragmaFieldId != act.pragmaFieldId))
    actual.forEach(act => compare(act, enums.find(i => i.pragmaEnumId == act.pragmaEnumId)))
}

function compare(actual: any, targetEnum: IAmocrmEnum): void {
    chai.assert(actual.pragmaEnumId === targetEnum.pragmaEnumId)
    chai.assert(actual.pragmaFieldId === targetEnum.pragmaFieldId)
    chai.assert(actual.sort === targetEnum.sort)
    chai.assert(actual.value === targetEnum.value)
    chai.assert(actual.pragmaAccountId === targetEnum.pragmaAccountId)
    chai.assert(actual.amocrmEnumId === targetEnum.amocrmEnumId)
}

function addRandom(enums: Array<any>): void {
    enums.forEach(en => {
        en.pragmaAccountId = random()
        en.value = randomString(256)
        en.sort = Math.ceil(Math.random() * 100)
        en.amocrmEnumId = random()
    })
}