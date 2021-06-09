import {IMainWorkers} from "../../../../workers/main/interface";
import IWorkerResult = IMainWorkers.IWorkerResult;
import {TestFabric} from "../TestFabric";
import {Amocrm} from "../../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import WorkerStatus = IMainWorkers.WorkerStatus;
import IWorkerResultBody = IMainWorkers.IWorkerResultBody;
import IWorkerStatus = IMainWorkers.IWorkerStatus;
import {WorkersFabric} from "../../../../workers/main/workers/WorkersFabric";
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;
import IError = IBasic.IError;
import testError = IBasic.testError;
import {CRMDB} from "../../../../generals/data_base/CRMDB";

const chai = require('chai')

export async function testWorkersFabric(): Promise<void> {
    describe('WorkersFabric', () => {
        it('full result without error', async () => {
            const testResult = await fullResult()
            await saveResult(testResult)
            const actualStatuses = await checkTESTAndGetActualStatuses(testResult)
            isNotErrorStatuses(actualStatuses)
        })
        it('result without completion_date', async () => {
            const testResult = await resultWithoutCompletionDate()
            await saveResult(testResult)
            const actualStatuses = await getActualStatuses(testResult)
            chai.assert(actualStatuses.length === testResult.statuses.length)
            actualStatuses.forEach(status => chai.assert(!!status.completion_date))
        })
        it('result without add_info', async () => {
            const testResult = await resultWithoutAddInfo()
            await saveResult(testResult)
            const actualStatuses = await getActualStatuses(testResult)
            chai.assert(actualStatuses.length === testResult.statuses.length)
            actualStatuses.forEach(status => {
                chai.assert(status.result_body.add_info.loaded === 0)
                chai.assert(status.result_body.add_info.total === -1)
                chai.assert(!status.result_body.error)
            })
        })
        it('result with JSON error', async () => {
            const error = Errors.internalError()
            const testResult = await fullResult(error)
            await saveResult(testResult)
            const actualStatuses = await getActualStatuses(testResult)
            chai.assert(actualStatuses.length === testResult.statuses.length)
            isErrorStatuses(actualStatuses, error)
        })
    })
}

async function saveResult(result: IWorkerResult): Promise<void> {
    await WorkersFabric.save(result)
    delayDeletion(result)
}

function delayDeletion(result: IWorkerResult): void {
    const condition = result.statuses.map(i => `account_id = ${result.job.node.account.pragma_account_id} AND job_name = '${i.full_work_name}'`).join(' OR ')
    const sql = `DELETE FROM ${CRMDB.workResultsSchema} where ${condition}`
    setTimeout(() => CRMDB.query(sql), 2000)
}

async function fullResult(error?: any): Promise<IWorkerResult> {
    const node = await uniqueNodeStruct()
    const job = await TestFabric.createLoadEntitiesJob(node)
    return {
        completion_date: new Date(),
        full_work_name: job.full_name,
        job,
        result_body: getResultBody(error),
        start_date: new Date(new Date().getTime() - 60000 * 30),
        status_name: error ? WorkerStatus.error : WorkerStatus.completed,
        duration_ms: 10,
        statuses: [
            createStatus(error ? WorkerStatus.error : WorkerStatus.completed, "load:users", error),
            createStatus(error ? WorkerStatus.error : WorkerStatus.completed, "load:pipelines", error),
            createStatus(error ? WorkerStatus.error : WorkerStatus.completed, "load:customFields", error),
            createStatus(error ? WorkerStatus.error : WorkerStatus.completed, "load:entities", error),
        ]
    }
}

function createStatus(status_name: WorkerStatus = WorkerStatus.completed, work_name: string = "load:entities", error?: any): IWorkerStatus {
    return {
        completion_date: new Date(),
        full_work_name: work_name,
        result_body: getResultBody(error),
        duration_ms: 10,
        start_date: new Date(new Date().getTime() - 60000 * 30),
        status_name
    }
}

async function resultWithoutCompletionDate(error?: any): Promise<IWorkerResult> {
    const node = await uniqueNodeStruct()
    const job = await TestFabric.createLoadEntitiesJob(node)
    return {
        completion_date: undefined,
        full_work_name: job.full_name,
        job,
        result_body: getResultBody(),
        duration_ms: 10,
        start_date: new Date(new Date().getTime() - 60000 * 30),
        status_name: WorkerStatus.completed,
        statuses: [
            createStatusWithoutCompletionDate(WorkerStatus.completed, "load:users"),
            createStatusWithoutCompletionDate(WorkerStatus.completed, "load:pipelines"),
            createStatusWithoutCompletionDate(WorkerStatus.completed, "load:customFields"),
            createStatusWithoutCompletionDate(WorkerStatus.completed, "load:entities"),
        ]
    }
}

function createStatusWithoutCompletionDate(status_name: WorkerStatus = WorkerStatus.completed, work_name: string = "load:entities"): IWorkerStatus {
    return {
        completion_date: undefined,
        full_work_name: work_name,
        result_body: getResultBody(),
        start_date: new Date(new Date().getTime() - 60000 * 30),
        duration_ms: 10,
        status_name
    }
}

async function resultWithoutAddInfo(error?: any): Promise<IWorkerResult> {
    const node = await uniqueNodeStruct()
    const job = await TestFabric.createLoadEntitiesJob(node)
    return {
        completion_date: undefined,
        full_work_name: job.full_name,
        job,
        result_body: getResultBody(),
        duration_ms: 10,
        start_date: new Date(new Date().getTime() - 60000 * 30),
        status_name: WorkerStatus.completed,
        statuses: [
            createStatusWithoutAddInfo(WorkerStatus.completed, "load:users"),
            createStatusWithoutAddInfo(WorkerStatus.completed, "load:pipelines"),
            createStatusWithoutAddInfo(WorkerStatus.completed, "load:customFields"),
            createStatusWithoutAddInfo(WorkerStatus.completed, "load:entities"),
        ]
    }
}

function createStatusWithoutAddInfo(status_name: WorkerStatus = WorkerStatus.completed, work_name: string = "load:entities"): IWorkerStatus {
    return {
        completion_date: undefined,
        full_work_name: work_name,
        result_body: undefined,
        start_date: new Date(new Date().getTime() - 60000 * 30),
        duration_ms: 10,
        status_name
    }
}

function getResultBody(error?: any): IWorkerResultBody {
    return {add_info: {loaded: 100, total: -1}, error}
}

async function uniqueNodeStruct(): Promise<IAmocrmNodeStruct> {
    const node = await TestFabric.uniqueNode()
    return node.publicModel
}

export async function checkTESTAndGetActualStatuses(expectResult: IWorkerResult): Promise<IWorkerStatus[]> {
    const expectStatuses = expectResult.statuses
    const actualStatuses = await getActualStatuses(expectResult)
    compareTestWorkerStatuses(actualStatuses, expectStatuses)
    return actualStatuses
}

export function compareTestWorkerStatuses(actual: IWorkerStatus[], expect: IWorkerStatus[]): void {
    chai.assert(expect.length === actual.length)
    actual.forEach(a => compareStatuses(a, expect.find(i => i.full_work_name === a.full_work_name)))
}

async function getActualStatuses(expectResult: IWorkerResult): Promise<Array<IWorkerStatus>> {
    return await WorkersFabric.getStatuses(expectResult.job.node.account.pragma_account_id)
}

function isNotErrorStatuses(statuses: IWorkerStatus[]): void {
    return statuses.forEach(status => {
        chai.assert(status.status_name !== WorkerStatus.error)
        chai.assert(!status.result_body.error)
    })
}

function isErrorStatuses(statuses: IWorkerStatus[], error: IError): void {
    return statuses.forEach(status => {
        chai.assert(status.status_name === WorkerStatus.error)
        chai.assert(!!status.result_body.error)
        chai.assert(typeof status.result_body.error === 'object')
        testError(status.result_body.error, error.code)
    })
}

function compareStatuses(actual: IWorkerStatus, expect: IWorkerStatus): void {
    chai.assert(actual.full_work_name === expect.full_work_name)
    chai.assert(actual.status_name === expect.status_name)
    comparisonDatesWithError(actual.start_date, expect.start_date)
    comparisonDatesWithError(actual.completion_date, expect.completion_date)
    compareResultBody(actual.result_body, expect.result_body)
}

function compareResultBody(actual: IWorkerResultBody, expect: IWorkerResultBody): void {
    chai.assert(!!actual.error === !!expect.error)
    if(actual.error || expect.error)
        chai.assert(actual.error === expect.error)
    chai.assert(actual.add_info.loaded === expect.add_info.loaded)
    chai.assert(actual.add_info.total === expect.add_info.total)
}

function comparisonDatesWithError(date0: Date, date1: Date, error_ms: number = 3000): void {
    if(date0 || date1) {
        const time0 = date0.getTime()
        const time1 = date1.getTime()
        const diff_time = Math.abs(time0 - time1)
        chai.assert(diff_time <= error_ms)
    } else {
        chai.assert(!date0)
        chai.assert(!date1)
    }
}