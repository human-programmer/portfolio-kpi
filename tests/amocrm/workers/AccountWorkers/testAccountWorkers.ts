import {AmoAccWorkers} from "../../../../workers/amocrm/AmoAccWorkers";
import {IMainWorkers} from "../../../../workers/main/interface";
import IJobExecutor = IMainWorkers.IJobExecutorWrapper;
import {TestFabric} from "../TestFabric";
import {Amocrm} from "../../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAccountModule = Amocrm.IAccountModule;
import {TestJobDealer} from "../loaders/loader_with_status/testJobDealer";
import IWorkerResult = IMainWorkers.IWorkerResult;
import WorkerStatus = IMainWorkers.WorkerStatus;
import IWorkerStatus = IMainWorkers.IWorkerStatus;
import {checkTESTAndGetActualStatuses, compareTestWorkerStatuses} from "../workers_fabric/testWorkersFabric";
import {IAmocrmLoaders} from "../../../../workers/amocrm/interface";
import IAmoJob = IAmocrmLoaders.IAmoJob;

const chai = require('chai')

export async function testAmoAccWorkers(): Promise<void> {
    describe('AmoAccWorkers', () => {
        it('createJobDealer', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const amoAccWorkers = new TestAmoAccWorkers(job.node.account.pragma_account_id)
            await amoAccWorkers.createJobDealer(job)
            await amoAccWorkers.createJobDealer(job)
            chai.assert(amoAccWorkers.jobDealers.length === 2)
        })
        it('getJobDealer', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const amoAccWorkers = new TestAmoAccWorkers(job.node.account.pragma_account_id)
            const jobDealer0 = await amoAccWorkers.getJobDealer(job)
            const jobDealer1 = await amoAccWorkers.getJobDealer(job)
            chai.assert(amoAccWorkers.jobDealers.length === 1)
            chai.assert(jobDealer0 === jobDealer1)
            chai.assert(jobDealer0.fullName === job.full_name)
            chai.assert(jobDealer1.fullName === job.full_name)
        })
        it('findJobDealerInBuffer', async () => {
            const node = await TestFabric.uniqueNode()
            const jobs = await createJobs(node)
            const amoAccWorkers = new TestAmoAccWorkers(jobs[0].node.account.pragma_account_id)
            const jobDealers = await createJobDealers(amoAccWorkers, jobs)
            chai.assert(jobDealers.length === jobs.length)
            chai.assert(jobDealers.length === amoAccWorkers.jobDealers.length)
            const jobDealer0 = amoAccWorkers.findJobDealerInBuffer(jobs[0])
            chai.assert(jobs[0].full_name === jobDealer0.fullName)
        })
        it('runWithoutWaitingEnd', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const workers = new TestWorkersWithPlugs(job.node.account.pragma_account_id)
            const result = await workers.runWithoutWaitingEnd(job)
            checkTestResultIsWaitingToStart(result)
        })
        it('runWithoutWaitingEnd check end', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const workers = new TestWorkersWithPlugs(job.node.account.pragma_account_id)
            workers.runWithoutWaitingEnd(job)
            await delay(500)
            const completedStatuses = await workers.getStatuses()
            checkTestStatusesIsCompleted(completedStatuses)
        })
        it('runWaitingEnd', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const workers = new TestWorkersWithPlugs(job.node.account.pragma_account_id)
            const result = await workers.runWaitingEnd(job)
            checkTestResultIsCompleted(result)
            await checkTESTAndGetActualStatuses(result)
        })
        it('statuses', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const workers = new TestWorkersWithPlugs(job.node.account.pragma_account_id)
            const result = await workers.runWithoutWaitingEnd(job)
            compareTestWorkerStatuses(result.statuses, await workers.getStatuses())
        })
    })
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function createJobDealers(amoAccWorkers: TestAmoAccWorkers, jobs: IAmoJob[]): Promise<IJobExecutor[]> {
    return Promise.all(jobs.map(i => amoAccWorkers.getJobDealer(i)))
}

async function createJobs(node: IAccountModule): Promise<IAmoJob[]> {
    return await Promise.all([
        await TestFabric.createLoadEntitiesJob(node.publicModel),
        await TestFabric.createLoadCustomFieldsJob(node.publicModel),
        await TestFabric.createLoadPipelinesJob(node.publicModel),
        await TestFabric.createLoadUsersJob(node.publicModel),
    ])
}

class TestAmoAccWorkers extends AmoAccWorkers {
    readonly jobDealers: IJobExecutor[] = []
    async getJobDealer(job: IAmoJob): Promise<IJobExecutor> {
        return super.getJobDealer(job)
    }
    findJobDealerInBuffer(job: IAmoJob): IJobExecutor|null {
        return super.findJobDealerInBuffer(job)
    }
    async createJobDealer(job: IAmoJob): Promise<IJobExecutor> {
        return super.createJobDealer(job)
    }
}

export class TestWorkersWithPlugs extends TestAmoAccWorkers {
    async createJobDealer(job: IAmoJob): Promise<IJobExecutor> {
        const jobDealer = TestJobDealer.createTestLoadersByJob(job)
        this.jobDealers.push(jobDealer)
        return jobDealer
    }
}

export function checkTestResultIsWaitingToStart(result: IWorkerResult): void {
    chai.assert(result.status_name === WorkerStatus.works)
    chai.assert(!!result.start_date)
    chai.assert(!result.completion_date)
    result.statuses.forEach(status => {
        if(status.full_work_name !== 'load:entities') {
            chai.assert(status.status_name === WorkerStatus.works)
            chai.assert(!!status.start_date)
        } else {
            chai.assert(status.status_name === WorkerStatus.waiting_to_start)
            chai.assert(!status.start_date)
        }
        chai.assert(!status.completion_date)
    })
}

export function checkTestResultIsCompleted(result: IWorkerResult): void {
    chai.assert(result.status_name === WorkerStatus.completed)
    chai.assert(!!result.start_date)
    chai.assert(!!result.completion_date)
    chai.assert((result.completion_date.getTime() - result.start_date.getTime()) > 0)
    checkTestStatusesIsCompleted(result.statuses)
}

export function checkTestStatusesIsCompleted(statuses: IWorkerStatus[]): void {
    statuses.forEach(status => {
        chai.assert(status.status_name === WorkerStatus.completed)
        chai.assert(!!status.start_date)
        chai.assert(!!status.completion_date)
        if(status.full_work_name !== 'load:crm')
            chai.assert(status.result_body.add_info.loaded > 0)
        chai.assert(status.result_body.add_info.total === -1)
        chai.assert(!status.result_body.error)
        const diff = status.completion_date.getTime() - status.start_date.getTime()
        chai.assert(diff > 0)
    })
}