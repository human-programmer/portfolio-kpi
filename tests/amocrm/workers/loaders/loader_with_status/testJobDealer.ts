import {AmocrmExecutor, WorkerWrapper} from "../../../../../workers/amocrm/AmoAccWorkers";
import {IMainWorkers} from "../../../../../workers/main/interface";
import {TestFabric} from "../../TestFabric";
import {UsersLoader} from "../../../../../workers/amocrm/loaders/users/UsersLoader";
import {PipelinesLoader} from "../../../../../workers/amocrm/loaders/pipelines/PipelinesLoader";
import {CustomFieldsLoader} from "../../../../../workers/amocrm/loaders/custom_fields/CustomFieldsLoader";
import {EntitiesLoader} from "../../../../../workers/amocrm/loaders/entities/BasicEntitiesLoader";
import {IBasic} from "../../../../../generals/IBasic";
import {
    checkTestLoaderIsWaiting,
    TestErrorLoader,
    TestLoaderWithStatus
} from "./testLoaderWithStatus";
import WorkerTarget = IMainWorkers.LoadWorkerTarget;
import Errors = IBasic.Errors;
import WorkerStatus = IMainWorkers.WorkerStatus;
import IWorkerStatus = IMainWorkers.IWorkerStatus;
import IWorkerResult = IMainWorkers.IWorkerResult;
import {JobDealer} from "../../../../../workers/main/workers/Workers";
import {IAmocrmLoaders} from "../../../../../workers/amocrm/interface";
import IAmoJob = IAmocrmLoaders.IAmoJob;
import IAmoWorker = IAmocrmLoaders.IAmoWorker;

const chai = require('chai')

export async function testJobDealer(): Promise<void> {
    describe('JobDealer', () => {
        describe('Jobs constructor', () => {
            it('users', async () => {
                const jobDealer = await createTestJobDealer(WorkerTarget.users)
                chai.assert(jobDealer.workers.length === 1)
                await checkAs(jobDealer.workers[0], UsersLoader)
            })
            it('pipelines', async () => {
                const jobDealer = await createTestJobDealer(WorkerTarget.pipelines)
                chai.assert(jobDealer.workers.length === 1)
                await checkAs(jobDealer.workers[0], PipelinesLoader)
            })
            it('customFields', async () => {
                const jobDealer = await createTestJobDealer(WorkerTarget.customFields)
                chai.assert(jobDealer.workers.length === 1)
                await checkAs(jobDealer.workers[0], CustomFieldsLoader)
            })
            it('default', async () => {
                const jobDealer = await createTestJobDealer(WorkerTarget.default)
                chai.assert(jobDealer.workers.length === 3)
                await checkDefaultConstructor(jobDealer)
            })
            it('entities', async () => {
                const jobDealer = await createTestJobDealer(WorkerTarget.entities)
                chai.assert(jobDealer.workers.length === 1)
                await checkEntitiesConstructor(jobDealer)
            })
            it('crm', async () => {
                const jobDealer = await createTestJobDealer(WorkerTarget.crm)
                chai.assert(jobDealer.workers.length === 4)
                await checkCRMConstructor(jobDealer)
            })
            it('all', async () => {
                const jobDealer = await createTestJobDealer(WorkerTarget.all)
                chai.assert(jobDealer.workers.length === 4)
                await checkCRMConstructor(jobDealer)
            })
            it('contacts', async () => {
                try {
                    await createTestJobDealer(WorkerTarget.contacts)
                    chai.assert(false)
                } catch (error) {
                    chai.assert(error.code === Errors.invalidRequestCode)
                }
            })
            it('companies', async () => {
                try {
                    await createTestJobDealer(WorkerTarget.companies)
                    chai.assert(false)
                } catch (error) {
                    chai.assert(error.code === Errors.invalidRequestCode)
                }
            })
            it('leads', async () => {
                try {
                    await createTestJobDealer(WorkerTarget.leads)
                    chai.assert(false)
                } catch (error) {
                    chai.assert(error.code === Errors.invalidRequestCode)
                }
            })
        })
        describe('Statuses', () => {
            it('run', async () => {
                const loader = await createJobDealerWithTestLoaders()
                checkTestLoaderIsWaiting(loader)
            })
            it('completed', async () => {
                const loader = await createJobDealerWithTestLoaders()
                const result = await loader.run()
                // @ts-ignore
                checkTestCompletedAnswer(loader, result)
            })
            it('works', async () => {
                const loader = await createJobDealerWithTestLoaders()
                const resultPromise = loader.run()
                // @ts-ignore
                await checkTestLoaderIsWorks(loader)
                await resultPromise
            })
            it('canceled', async () => {
                const loader = await createJobDealerWithTestLoaders()
                const runPromise = loader.run()
                await delay(10)
                const stopPromise = loader.stop()
                // @ts-ignore
                await checkTestRunAndStopAnswers(loader, runPromise, stopPromise)
            })
            it('error', async () => {
                const loader = await createERRORJobDealerWithTestLoaders()
                const result = await loader.run()
                isTestErrorAnswer(loader, result)
            })
        })
    })
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function createTestJobDealer (target: WorkerTarget): Promise<TestJobDealer> {
    const job = await TestFabric.createLoadJob(target)
    return TestJobDealer.testCreate(job)
}

async function checkEntitiesConstructor(jobDealer: TestJobDealer): Promise<void> {
    // @ts-ignore
    const loaders = await Promise.all(jobDealer.workers.map(i => i.getLoader()))
    const entities = loaders.find(loader => loader instanceof EntitiesLoader)
    chai.assert(entities instanceof EntitiesLoader)
}

async function checkCRMConstructor(jobDealer: TestJobDealer): Promise<void> {
    // @ts-ignore
    const loaders = await Promise.all(jobDealer.workers.map(i => i.getLoader()))
    const entities = loaders.find(loader => loader instanceof EntitiesLoader)
    chai.assert(entities instanceof EntitiesLoader)
    await checkDefaultConstructor(jobDealer)
}

async function checkDefaultConstructor(jobDealer: TestJobDealer): Promise<void> {
    // @ts-ignore
    const loaders = await Promise.all(jobDealer.workers.map(i => i.getLoader()))

    const users = loaders.find(loader => loader instanceof UsersLoader)
    const pipelines = loaders.find(loader => loader instanceof PipelinesLoader)
    const customFields = loaders.find(loader => loader instanceof CustomFieldsLoader)

    chai.assert(users instanceof UsersLoader)
    chai.assert(pipelines instanceof PipelinesLoader)
    chai.assert(customFields instanceof CustomFieldsLoader)
}

async function checkAs(loaderWrapper: any, constructor: any): Promise<void> {
    const loader = await loaderWrapper.getLoader()
    chai.assert(loader instanceof constructor)
}

async function createJobDealerWithTestLoaders(target: WorkerTarget = WorkerTarget.crm): Promise<TestJobDealer> {
    const job = await TestFabric.createLoadJob(target)
    return TestJobDealer.createTestLoadersByJob(job)
}

async function createERRORJobDealerWithTestLoaders(target: WorkerTarget = WorkerTarget.crm): Promise<TestJobDealer> {
    const job = await TestFabric.createLoadJob(target)
    return TestJobDealer.createTestLoadersByJob(job, true)
}

export class TestJobDealer extends JobDealer {
    static testCreate(job: IAmoJob): TestJobDealer {
        const executor = AmocrmExecutor.create(job)
        return new TestJobDealer(executor)
    }

    static createWithTestLoaders(job: IAmoJob): TestJobDealer {
        const executor = AmocrmExecutor.create(job)
        return new TestJobDealer(executor)
    }

    static createTestLoadersByJob(job: IAmoJob, error: boolean = false): TestJobDealer {
        const executor = TestAmoExecutor.createTest(job, error)
        return new TestJobDealer(executor)
    }
}

class TestAmoExecutor extends AmocrmExecutor {
    static createTest(job: IAmoJob, error = false): AmocrmExecutor {
        const jobs = AmocrmExecutor.decompositionJob(job)
        const loaders = jobs.map(i => new TestLoaderWrapper(i, error))
        return new AmocrmExecutor(job, loaders)
    }
}

class TestLoaderWrapper extends WorkerWrapper {
    readonly errorFlag: boolean
    constructor(job: any, error?: boolean ) {
        super(job)
        this.errorFlag = !!error
    }
    protected async getLoader(): Promise<IAmoWorker> {
        if(this.loader) return this.loader
        this.loader = this.errorFlag ? new TestErrorLoader(this.job) : new TestLoaderWithStatus(this.job)
        return this.loader
    }
}


async function checkTestLoaderIsWorks(loader: TestJobDealer) {
    await new Promise(resolve => {
        setTimeout(() => {
            const result = loader.lastWorkerResult
            chai.assert(result.status_name === WorkerStatus.works);
            chai.assert(!!result.result_body.add_info);
            chai.assert(result.start_date.getTime() < new Date().getTime());
            resolve({});
        }, 50);
    });
}

async function checkTestRunAndStopAnswers(loader: TestLoaderWithStatus, runPromise: Promise<IWorkerResult>, stopPromise: Promise<IWorkerResult>): Promise<void> {
    const results = await Promise.all([runPromise, stopPromise])
    isCancelledAnswer(loader, results[0])
    isCancelledAnswer(loader, results[1])
    isCancelledStatuses(loader)
}

function isCancelledAnswer(loader: TestLoaderWithStatus, result: IWorkerResult) : void {
    chai.assert(loader.job === result.job)
    chai.assert(result.status_name === WorkerStatus.cancelled)
    chai.assert((result.start_date.getTime() - result.completion_date.getTime()) < 0)
}

function isCancelledStatuses(loader: TestLoaderWithStatus) : void {
    chai.assert(loader.statuses.length > 0)
    loader.statuses.forEach(status => isCancelledStatus(loader, status))
}

function isCancelledStatus(loader: TestLoaderWithStatus, status: IWorkerStatus) : void {
    chai.assert(status.status_name === WorkerStatus.cancelled)
}
export function isTestErrorAnswer(loader: TestJobDealer, result: IWorkerResult) {
    chai.assert(loader.job === result.job);
    const errorStatuses = loader.statuses.filter(i => i.status_name === WorkerStatus.error)
    const otherStatuses = loader.statuses.filter(i => i.status_name !== WorkerStatus.error)
    chai.assert(result.status_name === WorkerStatus.error)
    chai.assert(errorStatuses.length > 0)
}

function checkTestCompletedAnswer(loader, result) {
    chai.assert(loader.job === result.job);
    checkLoadedStatuses(loader, result.statuses);
}
function checkLoadedStatuses(testLoader, statuses) {
    statuses.forEach(status => checkLoadedStatus(testLoader, status));
}
function checkLoadedStatus(testLoader, status) {
    chai.assert(status.status_name === WorkerStatus.completed);
}