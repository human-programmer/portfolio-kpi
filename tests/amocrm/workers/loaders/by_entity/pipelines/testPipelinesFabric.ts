import {IAmocrmLoaders} from "../../../../../../workers/amocrm/interface";
import {checkActualStatuses, createTestUniqueStatuses} from "./testStatusesFabric";
import IPipeline = IAmocrmLoaders.IPipeline;
import {IBasic} from "../../../../../../generals/IBasic";
import randomString = IBasic.randomString;
import {PipelinesFabric} from "../../../../../../workers/amocrm/loaders/pipelines/PipelinesFabric";
import {CRMDB} from "../../../../../../generals/data_base/CRMDB";

const chai = require('chai')

export async function testPipelinesFabric(): Promise<void> {
    describe('PipelinesFabric', () => {
        it('save', async () => {
            const pipelines = await saveTestUniquePipelines()
            await checkActualPipelines(pipelines)
        })
        it('update', async () => {
            const pipelines = await saveTestUniquePipelines()
            addRandom(pipelines)
            await save(pipelines)
            await checkActualPipelines(pipelines)
        })
    })
}

export async function saveTestUniquePipelines(quantity: number = 70): Promise<Array<IPipeline>> {
    const pipelines = uniquePipelines(quantity)
    await save(pipelines)
    delayDeletion(pipelines)
    return pipelines
}

async function save(pipelines: Array<IPipeline>): Promise<void> {
    await PipelinesFabric.save(pipelines)
}

function uniquePipelines(quantity: number = 70): Array<IPipeline> {
    const pipelines = []
    const accountId = random()
    for(let i = 0; i < quantity; i++)
        pipelines.push(uniquePipeline(accountId))
    return pipelines
}

function uniquePipeline(pragmaAccountId?: number): IPipeline {
    return {
        amocrmAccountId: random(),
        amocrmPipelineId: random(),
        pragmaAccountId: pragmaAccountId || random(),
        pragmaPipelineId: 0,
        sort: Math.ceil(Math.random() + 100),
        statuses: createTestUniqueStatuses(2),
        title: randomString(10)
    }
}

function random(): number {
    return Math.ceil(Math.random() * 1000000)
}

async function delayDeletion(pipelines: Array<IPipeline>): Promise<void> {
    setTimeout(() => pipelines.map(i => deletePipeline(i)), 2000)
}

async function deletePipeline(pipeline: IPipeline): Promise<void> {
    const schema = CRMDB.pipelinesSchema
    const sql = `DELETE FROM ${schema} WHERE id = ${pipeline.pragmaPipelineId}`
    await CRMDB.query(sql)
}

export async function checkActualPipelines(pipelines: Array<IPipeline>): Promise<void> {
    const actual = await getActualPipelines(pipelines.map(i => i.pragmaPipelineId))
    comparePipelines(actual, pipelines)
    const statuses = [].concat(...pipelines.map(i => i.statuses))
    await checkActualStatuses(statuses)
}

async function getActualPipelines(id: Array<number>) {
    const pipelines = CRMDB.pipelinesSchema
    const amocrm = CRMDB.amocrmPipelinesSchema
    const condition = id.map(i => `id = ${i}`).join(' OR ')
    const sql = `SELECT 
                    ${pipelines}.id as pragmaPipelineId,
                    ${pipelines}.account_id as pragmaAccountId,
                    ${pipelines}.name as title,
                    ${pipelines}.sort as sort,
                    ${amocrm}.amocrm_id as amocrmPipelineId
                FROM ${pipelines}
                    LEFT JOIN ${amocrm} ON ${amocrm}.pragma_id = ${pipelines}.id
                WHERE ${condition}`
    return await CRMDB.query(sql)
}

function comparePipelines(actual: Array<any>, pipeline: Array<IPipeline>): void {
    chai.assert(actual.length === pipeline.length)
    actual.forEach(i => comparePipeline(i, pipeline.find(s => s.pragmaPipelineId == i.pragmaPipelineId)))
}

function comparePipeline(actual: any, status: IPipeline): void {
    chai.assert(actual.pragmaPipelineId = status.pragmaPipelineId)
    chai.assert(actual.pragmaAccountId = status.pragmaAccountId)
    chai.assert(actual.title = status.title)
    chai.assert(actual.sort = status.sort)
    chai.assert(actual.amocrmPipelineId = status.amocrmPipelineId)
}

function addRandom(pipelines: Array<any>): void {
    pipelines.forEach(i => {
        i.title = randomString(50)
        i.sort = Math.ceil(Math.random() * 100)
    })
}