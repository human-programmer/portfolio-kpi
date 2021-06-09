import {
    CompaniesCfLoader,
    ContactsCfLoader,
    LeadsCfLoader
} from "../../../../../workers/amocrm/loaders/custom_fields/CustomFieldsLoader";
import {LoadDataSets} from "../LoadDataSets";
import {Func} from "../../../../../generals/Func";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {TestFabric} from "../../TestFabric";
import {IAmocrmLoaders} from "../../../../../workers/amocrm/interface";
import IAmocrmJob = IAmocrmLoaders.IAmoJob;

const chai = require('chai')

export async function testCustomFieldsWithDataSets(): Promise<void> {
    describe('CustomFields with DataSets', () => {
        it('run with test data sets', async () => {
            const job = await TestFabric.uniqueLoadCustomFieldsJob()
            await loadAllTestCustomFields(job)
            await checkActualCustomFields(job.node.account.pragma_account_id)
        })
    })
}

// @ts-ignore
export class TestLeadsCfLoader extends LeadsCfLoader {
    private async restQuery(): Promise<any> {
        return TestLeadsCfLoader.amocrmTestPipelinesAnswer
    }

    static get amocrmTestPipelinesAnswer(): any {
        return LoadDataSets.getFileContent('LeadsCfLoader' + '.json')
    }
}

// @ts-ignore
export class TestContactsCfLoader extends ContactsCfLoader {
    private async restQuery(): Promise<any> {
        return TestContactsCfLoader.amocrmTestPipelinesAnswer
    }

    static get amocrmTestPipelinesAnswer(): any {
        return LoadDataSets.getFileContent('ContactsCfLoader' + '.json')
    }
}

// @ts-ignore
export class TestCompaniesCfLoader extends CompaniesCfLoader {
    private async restQuery(): Promise<any> {
        return TestCompaniesCfLoader.amocrmTestPipelinesAnswer
    }

    static get amocrmTestPipelinesAnswer(): any {
        return LoadDataSets.getFileContent('CompaniesCfLoader' + '.json')
    }
}

export async function loadAllTestCustomFields(job: IAmocrmJob): Promise<void> {
    safeDeleteAllCustomFields()
    const leads = new TestLeadsCfLoader(job)
    const contacts = new TestContactsCfLoader(job)
    const companies = new TestCompaniesCfLoader(job)
    await Promise.all([
        leads.run(),
        contacts.run(),
        companies.run(),
    ])
    setTimeout(() => safeDeleteAllCustomFields(), 2000)
}

function getAmocrmLeadsCustomFields(): Array<any> {
    return TestLeadsCfLoader.amocrmTestPipelinesAnswer.body._embedded.custom_fields
}

function getAmocrmCompaniesCustomFields(): Array<any> {
    return TestCompaniesCfLoader.amocrmTestPipelinesAnswer.body._embedded.custom_fields
}

function getAmocrmContactsCustomFields(): Array<any> {
    return TestContactsCfLoader.amocrmTestPipelinesAnswer.body._embedded.custom_fields
}

async function checkActualCustomFields(pragmaAccountId: number): Promise<void> {
    const input = getPragmaCustomFieldsSets(pragmaAccountId)
    const actual = await getActualCustomFields(pragmaAccountId)
    compareCustomFields(input, actual)
}

function getPragmaCustomFieldsSets(pragmaAccountId: number): Array<any> {
    const amoFields = getAllAmoFields()
    return amoFields.map(i => formattingCf(i, pragmaAccountId))
}

function formattingCf(field: any, pragmaAccountId: number): any {
    return {
        pragmaAccountId,
        amocrmFieldId: field.id,
        amocrmEntityType: field.entity_type,
        pragmaEntityType: Func.toPragmaEntityType(field.entity_type),
        title: field.name,
        amocrmFieldType: field.type,
        pragmaFieldType: Func.toPragmaFieldType(field.type)
    }
}

function getAllAmoFields(): Array<any> {
    return [...getAmocrmLeadsCustomFields(), ...getAmocrmContactsCustomFields(), ...getAmocrmCompaniesCustomFields()]
}

async function getActualCustomFields(pragmaAccountId: number): Promise<Array<any>> {
    const pragma = CRMDB.fieldsSchema
    const amocrm = CRMDB.amocrmFieldsSchema
    const sql = `SELECT
                    ${pragma}.id as pragmaFieldId,
                    ${pragma}.account_id as pragmaAccountId,
                    ${pragma}.entity_type as pragmaEntityType,
                    ${pragma}.title as title,
                    ${pragma}.type as pragmaFieldType,
                    ${amocrm}.account_id as amocrmAccountId,
                    ${amocrm}.field_id as amocrmFieldId,
                    ${amocrm}.entity_type as amocrmEntityType,
                    ${amocrm}.field_type as amocrmFieldType
                FROM ${pragma}
                    INNER JOIN ${amocrm} ON ${amocrm}.pragma_field_id = ${pragma}.id
                WHERE ${pragma}.account_id = ${pragmaAccountId}`
    return await CRMDB.query(sql)
}

function compareCustomFields(input: Array<any>, actual: Array<any>): void {
    chai.assert(input.length === actual.length)
    input.forEach(i => compareCF(i, actual.find(a => (i.amocrmFieldId === a.amocrmFieldId))))
}

function compareCF(input: any, actual: any): void {
    chai.assert(!!actual.pragmaFieldId)
    chai.assert(input.pragmaAccountId === actual.pragmaAccountId)
    // chai.assert(input.pragmaEntityType === actual.pragmaEntityType)
    chai.assert(input.title === actual.title)
    chai.assert(input.pragmaFieldType === actual.pragmaFieldType)
    // chai.assert(input.amocrmAccountId === actual.amocrmAccountId)
    // chai.assert(input.amocrmEntityType === actual.amocrmEntityType)
    chai.assert(input.amocrmFieldType === actual.amocrmFieldType)
    chai.assert(input.amocrmFieldId === actual.amocrmFieldId)
}

async function safeDeleteAllCustomFields(): Promise<void> {
    if(process.platform === 'win32') {
        const sql = `DELETE FROM ${CRMDB.fieldsSchema} WHERE 1`
        await CRMDB.query(sql)
    }
}