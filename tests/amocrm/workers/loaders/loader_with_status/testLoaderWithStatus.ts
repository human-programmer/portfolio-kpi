import {AmocrmLoader} from "../../../../../workers/amocrm/loaders/AmocrmLoader";
import {IMainWorkers} from "../../../../../workers/main/interface";
import {TestFabric} from "../../TestFabric";
import IJob = IMainWorkers.IJob;
import IWorkerResult = IMainWorkers.IWorkerResult;
import ILoadResult = IMainWorkers.ILoadResult;
import IWorkerStatus = IMainWorkers.IWorkerStatus;
import WorkerStatus = IMainWorkers.WorkerStatus;
import {IBasic} from "../../../../../generals/IBasic";
import Errors = IBasic.Errors;
import ILoader = IMainWorkers.IWorker;
import {IAmocrmLoaders} from "../../../../../workers/amocrm/interface";
import IAmoJob = IAmocrmLoaders.IAmoJob;

const chai = require('chai')

export async function testLoaderWithStatus(): Promise<void> {
    describe('LoaderWithStatus', () => {
        it('waiting_to_start', async () => {
            const loader = await getLoaderForTestRun()
            checkTestLoaderIsWaiting(loader)
            const result = await loader.run()
            checkTestCompletedAnswer(loader, result)
            checkTestLoaderIsCompleted(loader)
        })
        it('completed', async () => {
            const loader = await getLoaderForTestRun()
            const result = await loader.run()
            checkTestCompletedAnswer(loader, result)
            checkTestLoaderIsCompleted(loader)
        })
        it('works', async () => {
            const loader = await getLoaderForTestRun()
            const resultPromise = loader.run()
            await checkTestLoaderIsWorks(loader)
            await resultPromise
        })
        it('canceled', async () => {
            const loader = await getLoaderForTestRun()
            const runPromise = loader.run()
            await delay(50)
            const stopPromise = loader.stop()
            await checkTestRunAndStopAnswers(loader, runPromise, stopPromise)
        })
        it('error', async () => {
            const loader = await getErrorLoader()
            const errorResult = await loader.run()
            isTestErrorAnswer(loader, errorResult)
        })
    })
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export async function checkTestRunAndStopAnswers(loader: TestLoaderWithStatus, runPromise: Promise<IWorkerResult>, stopPromise: Promise<IWorkerResult>): Promise<void> {
    const results = await Promise.all([runPromise, stopPromise])
    isCancelledAnswer(loader, results[0])
    isCancelledAnswer(loader, results[1])
    compareStatuses(results[0].statuses[0], results[1].statuses[0])
}

function isCancelledAnswer(loader: TestLoaderWithStatus, result: IWorkerResult) : void {
    chai.assert(loader.job === result.job)
    chai.assert(result.result_body.add_info.loaded > 0)
    chai.assert(result.result_body.add_info.loaded < loader.testQuantity)
    chai.assert(result.status_name === WorkerStatus.cancelled)
    chai.assert((result.start_date.getTime() - result.completion_date.getTime()) < 0)
    const status = result.statuses[0]
    isCancelledStatus(loader, status)
}

function isCancelledStatus(loader: TestLoaderWithStatus, status: IWorkerStatus) : void {
    chai.assert(status.status_name === WorkerStatus.cancelled)
    chai.assert(status.result_body.add_info.loaded > 0)
    chai.assert(status.result_body.add_info.loaded < loader.testQuantity)
    chai.assert(status.completion_date.getTime() - status.start_date.getTime() > 0)
}

export function isTestErrorAnswer(loader: TestLoaderWithStatus, result: IWorkerResult) : void {
    chai.assert(loader.job === result.job)
    chai.assert(result.result_body.add_info.loaded > 0)
    chai.assert(result.result_body.add_info.loaded < loader.testQuantity)
    const status = result.statuses[0]
    isErrorStatus(loader, status)
}

function isErrorStatus(loader: TestLoaderWithStatus, status: IWorkerStatus) : void {
    chai.assert(status.status_name === WorkerStatus.error)
    const {add_info, error} = status.result_body
    chai.assert(add_info.loaded > 0)
    chai.assert(add_info.loaded < loader.testQuantity)
    chai.assert(error.error === true)
    chai.assert(error.code === Errors.internalErrorCode)
    chai.assert(status.completion_date.getTime() - status.start_date.getTime() > 0)
}

function compareStatuses(s0: IWorkerStatus, s1: IWorkerStatus): void {
    chai.assert(s0.status_name === s1.status_name)
    chai.assert(s0.start_date.getTime() === s1.start_date.getTime())
    chai.assert(s0.completion_date.getTime() === s1.completion_date.getTime())
    chai.assert(s0.result_body.add_info.loaded == s1.result_body.add_info.loaded)
    chai.assert(s0.result_body.add_info.total == s1.result_body.add_info.total)
}

async function getLoaderForTestRun(): Promise<TestLoaderWithStatus> {
    const job = await TestFabric.createLoadEntitiesJob()
    return new TestLoaderWithStatus(job)
}

async function getErrorLoader(): Promise<TestErrorLoader> {
    const job = await TestFabric.createLoadEntitiesJob()
    return new TestErrorLoader(job)
}

export function checkTestLoaderIsWaiting(loader: ILoader): void {
    const status = loader.statuses[0]
    chai.assert(status.status_name === WorkerStatus.waiting_to_start)
    checkLoadResult(status.result_body.add_info, 0)
}

function checkTestLoaderIsCompleted(loader: TestLoaderWithStatus): void {
    const status = loader.statuses[0]
    chai.assert(status.status_name === WorkerStatus.completed)
    checkLoadResult(status.result_body.add_info, loader.testQuantity)
}

export async function checkTestLoaderIsWorks(loader: TestLoaderWithStatus): Promise<void> {
    await new Promise(resolve => {
        setTimeout(() => {
            const status = loader.statuses[0]
            chai.assert(status.status_name === WorkerStatus.works)
            chai.assert(status.result_body.add_info.loaded > 0)
            chai.assert(status.result_body.add_info.loaded < loader.testQuantity)
            chai.assert(status.start_date.getTime() < new Date().getTime())
            resolve({})
        }, 50)
    })
}

export function checkTestCompletedAnswer(loader: TestLoaderWithStatus, result: IWorkerResult): void {
    chai.assert(loader.job === result.job)
    checkLoadedStatus(loader, result.statuses)
}

function checkLoadedStatus(testLoader: TestLoaderWithStatus, statuses: IWorkerStatus[]): void {
    const status = statuses[0]
    checkLoadResult(status.result_body.add_info, testLoader.testQuantity)
    chai.assert(status.status_name === WorkerStatus.completed)
}

function checkLoadResult(result: ILoadResult, expectLoaded: number): void {
    chai.assert(result.loaded === expectLoaded)
    chai.assert(result.total === -1)
}

// @ts-ignore
export class TestLoaderWithStatus extends AmocrmLoader {
    protected readonly route: string = 'test'
    readonly testQuantity = 999
    protected readonly testDataSets: Array<any>
    protected readonly loadersQuantity: number = 3
    protected readonly limit: number = 100


    constructor(job: IAmoJob) {
        super(job)
        this.testDataSets = []
        this.initDataSets()
    }

    private initDataSets(): void {
        for(let i = 0; i < this.testQuantity; ++i)
            this.testDataSets.push({})
    }

    protected async restQuery(): Promise<any> {
        return new Promise(resolve => setTimeout(() => resolve(this.restAnswer), 30))
    }

    protected get restAnswer(): any {
        return {
            info: {statusCode: 200},
            body: {}
        }
    }

    protected fetchEntities(body: any): Array<any> {
        return this.nextTestDataSets()
    }

    protected nextTestDataSets(): Array<any> {
        return this.testDataSets.splice(0, this.limit)
    }

    protected saveEntities(entities: Array<any>): Promise<void> {
        return Promise.resolve(undefined);
    }
}

export class TestErrorLoader extends TestLoaderWithStatus {
    readonly testQuantity = 999
    protected readonly limit: number = 100



    protected async restQuery(): Promise<any> {
        return new Promise((resolve, reject) => setTimeout(() => {
            if(this.testDataSets.length < 700)
                reject(Errors.internalError())
            else
                resolve(this.restAnswer)
        }, 30))
    }

    protected get restAnswer(): any {
        return {info: {statusCode: 200}, body: {}}
    }
}