import {IAmocrmLoaders} from "../../../../../../workers/amocrm/interface";
import IStatus = IAmocrmLoaders.IStatus;
import {IBasic} from "../../../../../../generals/IBasic";
import randomString = IBasic.randomString;
import {StatusesFabric} from "../../../../../../workers/amocrm/loaders/pipelines/PipelinesFabric";
import {CRMDB} from "../../../../../../generals/data_base/CRMDB";

const chai = require('chai')

export async function testStatusesFabric(): Promise<void> {
    describe('StatusFabric', () => {
        it('save', async () => {
            const statuses = await saveTestUniqueStatuses()
            await checkActualStatuses(statuses)
        })
        it('update', async () => {
            const statuses = await saveTestUniqueStatuses()
            changeStatuses(statuses)
            await saveStatuses(statuses)
            await checkActualStatuses(statuses)
        })
    })
}

export async function saveTestUniqueStatuses(quantity: number = 70): Promise<Array<IStatus>> {
    const statuses = createTestUniqueStatuses(quantity)
    await saveStatuses(statuses)
    delayDeletion(statuses)
    return statuses
}

async function saveStatuses(statuses: Array<IStatus>): Promise<void> {
    await StatusesFabric.save(statuses)
}

export function createTestUniqueStatuses(quantity: number = 70): Array<IStatus> {
    const statuses = []
    for(let i = 0; i < quantity; i++)
        statuses.push(uniqueStatus())
    return statuses
}

function uniqueStatus(): IStatus {
    return {
        amocrmAccountId: random(),
        amocrmPipelineId: random(),
        amocrmStatusId: random(),
        color: randomString(5),
        pragmaPipelineId: random(),
        pragmaStatusId: 0,
        sort: Math.ceil(Math.random() + 100),
        title: randomString(10)
    }
}

function random(): number {
    return Math.ceil(Math.random() * 1000000)
}

async function delayDeletion(statuses: Array<IStatus>): Promise<void> {
    setTimeout(() => statuses.map(i => deleteStatus(i)), 2000)
}

async function deleteStatus(status: IStatus): Promise<void> {
    const schema = CRMDB.statusesSchema
    const sql = `DELETE FROM ${schema} WHERE id = ${status.pragmaStatusId}`
    await CRMDB.query(sql)
}

export async function checkActualStatuses(statuses: Array<IStatus>): Promise<void> {
    const actual = await getActualStatuses(statuses.map(i => i.pragmaStatusId))
    compareStatuses(actual, statuses)
}

async function getActualStatuses(id: Array<number>) {
    const statuses = CRMDB.statusesSchema
    const amocrm = CRMDB.amocrmStatusesSchema
    const links = CRMDB.statusesToPipelineSchema
    const condition = id.map(i => `id = ${i}`).join(' OR ')
    const sql = `SELECT 
                    ${statuses}.id as pragmaStatusId,
                    ${statuses}.name as title,
                    ${statuses}.color as color,
                    ${statuses}.sort as sort,
                    ${links}.pipeline_id as pragmaPipelineId,
                    ${amocrm}.amocrm_id as amocrmStatusId
                FROM ${statuses}
                    LEFT JOIN ${links} ON ${links}.status_id = ${statuses}.id
                    LEFT JOIN ${amocrm} ON ${amocrm}.pragma_id = ${statuses}.id
                WHERE ${condition}`
    return await CRMDB.query(sql)
}

function compareStatuses(actual: Array<any>, statuses: Array<IStatus>): void {
    // chai.assert(actual.length === statuses.length)
    actual.forEach(i => compareStatus(i, statuses.find(s => s.pragmaStatusId == i.pragmaStatusId)))
}

function compareStatus(actual: any, status: IStatus): void {
    chai.assert(actual.pragmaStatusId = status.pragmaStatusId)
    chai.assert(actual.title = status.title)
    chai.assert(actual.color = status.color)
    chai.assert(actual.sort = status.sort)
    chai.assert(actual.pragmaPipelineId = status.pragmaPipelineId)
    chai.assert(actual.amocrmStatusId = status.amocrmStatusId)
}

function changeStatuses(statuses: Array<any>): void {
    statuses.map(i => i.title = randomString(10))
}