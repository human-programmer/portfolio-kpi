import {AmocrmLoader, PackLoaders} from "../../../../../workers/amocrm/loaders/AmocrmLoader";
import {IMainWorkers} from "../../../../../workers/main/interface";
import ILoader = IMainWorkers.IWorker;
import {
    checkTestLoaderIsWaiting,
    checkTestLoaderIsWorks,
    checkTestRunAndStopAnswers, isTestErrorAnswer, TestErrorLoader,
    TestLoaderWithStatus
} from "./testLoaderWithStatus";
import {Amocrm} from "../../../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {TestFabric} from "../../TestFabric";
import ILoadResult = IMainWorkers.ILoadResult;
import IWorkerResult = IMainWorkers.IWorkerResult;
import IWorkerStatus = IMainWorkers.IWorkerStatus;
import WorkerStatus = IMainWorkers.WorkerStatus;
import {IAmocrmLoaders} from "../../../../../workers/amocrm/interface";
import IAmoJob = IAmocrmLoaders.IAmoJob;

const chai = require('chai')

export async function testPackLoadersWithStatus(): Promise<void> {
    describe('PackLoadersWithStatus', () => {
        describe('concurrently', () => {
            it('waiting_to_start', async () => {
                const mainLoader = await createPackLoader(true)
                checkTestLoaderIsWaiting(mainLoader)
            })
            it('completed', async () => {
                const mainLoader = await createPackLoader(true)
                const result = await mainLoader.run()
                // @ts-ignore
                checkTestCompletedAnswer(mainLoader, result)
            })
            it('works', async () => {
                const loader = await createPackLoader(true)
                const resultPromise = loader.run()
                // @ts-ignore
                await checkTestLoaderIsWorks(loader)
                await resultPromise
            })
            it('canceled', async () => {
                const loader = await createPackLoader(true)
                const runPromise = loader.run()
                await delay(50)
                const stopPromise = loader.stop()
                // @ts-ignore
                await checkTestRunAndStopAnswers(loader, runPromise, stopPromise)
            })
            it('error', async () => {
                const loader = await createPackErrorLoader(true)
                const errorResult = await loader.run()
                // @ts-ignore
                isTestErrorAnswer(loader, errorResult)
            })
        })
        describe('queue', () => {
            it('waiting_to_start', async () => {
                const mainLoader = await createPackLoader(false)
                checkTestLoaderIsWaiting(mainLoader)
            })
            it('completed', async () => {
                const mainLoader = await createPackLoader(false)
                const result = await mainLoader.run()
                // @ts-ignore
                checkTestCompletedAnswer(mainLoader, result)
            })
            it('works', async () => {
                const loader = await createPackLoader(false)
                const resultPromise = loader.run()
                // @ts-ignore
                await checkTestLoaderIsWorks(loader)
                await resultPromise
            })
            it('canceled', async () => {
                const loader = await createPackLoader(false)
                const runPromise = loader.run()
                await delay(50)
                const stopPromise = loader.stop()
                // @ts-ignore
                await checkTestRunAndStopAnswers(loader, runPromise, stopPromise)
            })
            it('error', async () => {
                const loader = await createPackErrorLoader(false)
                const errorResult = await loader.run()
                // @ts-ignore
                isTestErrorAnswer(loader, errorResult)
            })
        })
    })
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function checkTestCompletedAnswer(loader: TestLoaderWithStatus, result: IWorkerResult): void {
    chai.assert(loader.job === result.job)
    checkLoadedStatuses(loader, result.statuses)
}

function checkLoadedStatuses(testLoader: TestLoaderWithStatus, statuses: IWorkerStatus[]): void {
    statuses.forEach(status => checkLoadedStatus(testLoader, status))
    checkLoadResult(testLoader.lastWorkerResult.result_body.add_info, testLoader.testQuantity)
}

function checkLoadedStatus(testLoader: TestLoaderWithStatus, status: IWorkerStatus): void {
    chai.assert(status.status_name === WorkerStatus.completed)
}

function checkLoadResult(result: ILoadResult, expectLoaded: number): void {
    chai.assert(result.loaded === expectLoaded)
    chai.assert(result.total === -1)
}

async function createPackLoader(concurrentlyLoader: boolean): Promise<TestPackLoader> {
    const {node, jobs, loaders} = await getTest(false)
    return getPackLoader(jobs[0], loaders, concurrentlyLoader)
}

async function createPackErrorLoader(concurrentlyRun: boolean): Promise<TestPackLoader> {
    const {node, jobs, loaders} = await getTest(true)
    return getPackLoader(jobs[0], loaders, concurrentlyRun)
}

async function getTest(errorLoaders: boolean): Promise<any> {
    const node = await TestFabric.getTestNodeStruct()
    const jobs = await getPackJobs(node)
    const loaders = getPackLoaders(jobs, errorLoaders)
    return {node, jobs, loaders}
}

function getPackLoader(job: IAmoJob, loaders: ILoader[], concurrentlyRun: boolean): TestPackLoader {
    return new TestPackLoader(job, loaders, concurrentlyRun)
}

async function getPackJobs(node: IAmocrmNodeStruct): Promise<IAmoJob[]> {
    return await Promise.all([
        TestFabric.createLoadPipelinesJob(node),
        TestFabric.createLoadUsersJob(node),
        TestFabric.createLoadCustomFieldsJob(node),
    ])
}

function getPackLoaders(jobs: IAmoJob[], errorLoaders: boolean): ILoader[] {
    return jobs.map(job => errorLoaders ? new TestErrorLoader(job) : new TestLoaderWithStatus(job))
}

class TestPackLoader extends PackLoaders {
    protected concurrentlyRun: boolean = true
    constructor(job: IAmoJob, loaders: ILoader[], concurrentlyRun: boolean) {
        super(job, loaders)
        this.concurrentlyRun = concurrentlyRun
    }

    get testQuantity(): number {
        // @ts-ignore
        return this.loaders.map(i => i.testQuantity).reduce((res, val) => res + val)
    }
}