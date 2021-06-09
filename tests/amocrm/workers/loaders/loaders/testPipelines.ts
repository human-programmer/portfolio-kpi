import {LoadDataSets} from "../LoadDataSets";
import {TestFabric} from "../../TestFabric";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {IAmocrmLoaders} from "../../../../../workers/amocrm/interface";
import IPipeline = IAmocrmLoaders.IPipeline;
import {PipelinesLoader} from "../../../../../workers/amocrm/loaders/pipelines/PipelinesLoader";
import IAmocrmJob = IAmocrmLoaders.IAmoJob;

const chai = require('chai')

export async function testSetsPipelines(): Promise<void> {
    describe('PipelinesLoader with data sets', () => {
        it('run with test data sets', async () => {
            const job = await TestFabric.uniqueLoadPipelinesJob()
            await loadTestPipelines(job)
            await checkActualPipelines(job.node.account.pragma_account_id)
        })
    })
}

// @ts-ignore
export class TestPipelinesLoader extends PipelinesLoader {
    private async restQuery(): Promise<any> {
        return TestPipelinesLoader.amocrmTestPipelinesAnswer
    }

    static get pragmaTestPipelines(): Array<any> {
        const amoPipelines = TestPipelinesLoader.amocrmTestPipelines
        return amoPipelines.map(i => {
            return {
                amocrmAccountId: i.account_id,
                amocrmPipelineId: i.id,
                title: i.name,
                sort: i.sort,
                statuses: TestPipelinesLoader.fetchStatuses(i)
            }
        })
    }

    private static fetchStatuses(pipeline: any): any {
        return pipeline._embedded.statuses.map(i => TestPipelinesLoader.formattingStatus(i.id, i))
    }

    private static formattingStatus(pipeline_id: number, status: any): any {
        return {
            amocrmAccountId: status.account_id,
            amocrmStatusId: status.id,
            color: status.color,
            title: status.name,
            amocrmPipelineId: pipeline_id,
            sort: status.sort,
        }
    }

    static get amocrmTestPipelines(): Array<any> {
        return TestPipelinesLoader.amocrmTestPipelinesAnswer.body._embedded.pipelines
    }

    static get amocrmTestPipelinesAnswer(): any {
        return LoadDataSets.getFileContent('PipelinesLoader' + '.json')
    }
}

export async function loadTestPipelines(job: IAmocrmJob): Promise<any> {
    await safeClearAllPipelines()
    const usersLoader = new TestPipelinesLoader(job)
    await usersLoader.run()
    setTimeout(() => safeClearAllPipelines(), 2000)
}

async function safeClearAllPipelines(): Promise<void> {
    if(process.platform === 'win32') {
        const sql = `DELETE FROM ${CRMDB.pipelinesSchema} WHERE 1`
        await CRMDB.query(sql)
    }
}

export async function checkActualPipelines(pragmaAccountId: number): Promise<void> {
    const actual = await getActualPipelines(pragmaAccountId)
    const pipelines = TestPipelinesLoader.pragmaTestPipelines
    await comparePipelines(actual, pipelines)
    const statuses = [].concat(...pipelines.map(i => i.statuses))
    const actualStatuses = [].concat(...actual.map(i => i.statuses))
    compareActualStatuses(actualStatuses, statuses)
}

async function getActualPipelines(pragmaAccountId: number): Promise<Array<any>> {
    const pipelines = await queryPipelines(pragmaAccountId)
    return await Promise.all(pipelines.map(i => addStatuses(i)))
}

async function queryPipelines(pragmaAccountId: number): Promise<Array<any>> {
    const pipelines = CRMDB.pipelinesSchema
    const amocrm = CRMDB.amocrmPipelinesSchema
    const sql = `SELECT 
                    ${pipelines}.id as pragmaPipelineId,
                    ${pipelines}.account_id as pragmaAccountId,
                    ${pipelines}.name as title,
                    ${pipelines}.sort as sort,
                    ${amocrm}.amocrm_id as amocrmPipelineId
                FROM ${pipelines}
                    LEFT JOIN ${amocrm} ON ${amocrm}.pragma_id = ${pipelines}.id
                WHERE account_id = ${pragmaAccountId}`
    return await CRMDB.query(sql)
}

async function addStatuses(pipeline: any): Promise<void> {
    pipeline.statuses = await queryStatuses(pipeline.pragmaPipelineId)
    return pipeline
}

async function queryStatuses(pipelineId: number) {
    const pragma = CRMDB.statusesSchema
    const amocrm = CRMDB.amocrmStatusesSchema
    const links = CRMDB.statusesToPipelineSchema
    const sql = `SELECT 
                    ${pragma}.id as pragmaStatusId,
                    ${pragma}.name as title,
                    ${pragma}.sort as sort,
                    ${pragma}.color as color,
                    ${amocrm}.amocrm_id as amocrmStatusId
                FROM ${links}
                    LEFT JOIN ${pragma} ON ${pragma}.id = ${links}.status_id
                    LEFT JOIN ${amocrm} ON ${amocrm}.pragma_id = ${links}.status_id
                WHERE ${links}.pipeline_id = ${pipelineId}`
    return await CRMDB.query(sql)
}

function comparePipelines(actual: Array<any>, pipelines: Array<IPipeline>): void {
    chai.assert(actual.length === pipelines.length)
    actual.forEach(i => comparePipeline(i, pipelines.find(s => s.amocrmPipelineId == i.amocrmPipelineId)))
}

function comparePipeline(actual: any, pipeline: IPipeline): void {
    chai.assert(actual.title = pipeline.title)
    chai.assert(actual.sort = pipeline.sort)
    chai.assert(actual.amocrmPipelineId = pipeline.amocrmPipelineId)
}

function compareActualStatuses(actual: Array<any>, statuses: Array<any>): void {
    chai.assert(actual.length === statuses.length)
    actual.forEach(i => checkActualStatus(i, statuses.find(s => s.amocrmStatusId == i.amocrmStatusId)))
}

function checkActualStatus(actual: any, status: any): void {
    chai.assert(actual.title = status.title)
    chai.assert(actual.sort = status.sort)
    chai.assert(actual.color = status.color)
    chai.assert(actual.amocrmStatusId = status.amocrmStatusId)
}