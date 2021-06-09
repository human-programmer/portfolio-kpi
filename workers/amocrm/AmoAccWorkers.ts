import {IMainWorkers} from "../main/interface";
import {IBasic} from "../../generals/IBasic";
import {UsersLoader} from "./loaders/users/UsersLoader";
import {PipelinesLoader} from "./loaders/pipelines/PipelinesLoader";
import {CustomFieldsLoader} from "./loaders/custom_fields/CustomFieldsLoader";
import {EntitiesLoader} from "./loaders/entities/BasicEntitiesLoader";
import IAccountWorkers = IMainWorkers.IAccountWorkers;
import WorkerTarget = IMainWorkers.LoadWorkerTarget;
import WorkName = IMainWorkers.WorkName;
import Errors = IBasic.Errors;
import WorkerStatus = IMainWorkers.WorkerStatus;
import IAccWorkersStorage = IMainWorkers.IAccWorkersStorage;
import {AccWorkers, AccWorkersStorage, AWorker} from "../main/workers/Workers";
import IWorkExecutor = IMainWorkers.IWorkExecutor;
import {IAmocrmLoaders} from "./interface";
import IAmoJob = IAmocrmLoaders.IAmoJob;
import IAmoWorker = IAmocrmLoaders.IAmoWorker;
import IWorkerResultBody = IMainWorkers.IWorkerResultBody;
import IWorkerStatus = IMainWorkers.IWorkerStatus;
import IWorkerResult = IMainWorkers.IWorkerResult;
import IWorker = IMainWorkers.IWorker;

enum JobStage {
    waiting_to_start = 0,
    load_default = 1,
    load_entities = 2,
    end = 3,
}

export class WorkerWrapper extends AWorker implements IAmoWorker {
    protected loader: IAmoWorker
    readonly job: IAmoJob

    constructor(job: IAmoJob) {
        super(job)
    }

    get fullName(): string {
        return this.job.full_name
    }
    get inWork(): boolean {
        return this.loader ? this.loader.inWork : false
    }

    async run(): Promise<IWorkerResult> {
        try {
            await this._run()
        } catch (error) {
            this.setEnded(WorkerStatus.error, error)
        } finally {
            return this.lastWorkerResult
        }
    }

    private async _run(): Promise<void> {
        if(this.statusName === WorkerStatus.cancelled)
            return;
        const loader = await this.getLoader()
        this.setStarted()
        await loader.run()
        this.setEnded(WorkerStatus.completed)
    }

    protected async getLoader(): Promise<IAmoWorker> {
        if(this.loader) return this.loader
        this.loader = await WorkerWrapper.createLoader(this.job)
        return this.loader
    }

    async stop(): Promise<IWorkerResult> {
        this.setEnded(WorkerStatus.cancelled)
        this.loader && await this.loader.stop()
        return this.lastWorkerResult
    }

    get lastWorkerResult(): IWorkerResult {
        return Object.assign(this.defaultStatus, {
            job: this.job,
            statuses: this.statuses,
        })
    }

    get statuses(): IWorkerStatus[] {
        return this.loader ? this.loader.statuses : [this.defaultStatus]
    }

    private get defaultStatus(): IWorkerStatus {
        return {
            duration_ms: this.durationMs,
            full_work_name: this.job.full_name,
            completion_date: undefined,
            result_body: this.resultBody,
            start_date: undefined,
            status_name: this.statusName
        }
    }

    private get resultBody(): IWorkerResultBody{
        return this.loader ? this.loader.lastWorkerResult.result_body : this.defaultResultBody
    }

    private get defaultResultBody(): IWorkerResultBody{
        return {
            add_info: {loaded: 0, total: -1},
            error: this.error
        }
    }

    get statusName(): WorkerStatus {
        return this.loader ? this.loader.statusName : super.statusName
    }

    private static async createLoader (job: IAmoJob): Promise<IAmoWorker> {
        switch (job.target) {
            case WorkerTarget.users:
                return new UsersLoader(job)

            case WorkerTarget.pipelines:
                return new PipelinesLoader(job)

            case WorkerTarget.customFields:
                return await CustomFieldsLoader.create(job)

            case WorkerTarget.entities:

                return await EntitiesLoader.create(job)
            default:
                throw Errors.invalidRequest('Unknown job "' + job.full_name + '" LoaderWrapper -> createLoaders')
        }
    }
}

export class AmocrmExecutor implements IWorkExecutor{
    private stage: JobStage = JobStage.waiting_to_start
    readonly job: IAmoJob;
    readonly workers: IAmoWorker[];
    private stopResolveFunc: any

    static create(job: IAmoJob): AmocrmExecutor {
        const loaders = AmocrmExecutor.createLoadersByJob(job)
        return new AmocrmExecutor(job, loaders)
    }

    constructor(job: IAmoJob, workers: IAmoWorker[]) {
        this.job = job
        this.workers = workers
    }

    get statuses(): IWorkerStatus[] {
        return [].concat(...this.workers.map(loader => loader && loader.statuses))
    }

    get resultBody(): IWorkerResultBody {
        const namesakeLoader = this.workers.find(i => i.fullName === this.job.full_name)
        if(namesakeLoader)
            return namesakeLoader.lastWorkerResult.result_body
        return {add_info: {total: -1, loaded: 0}, error: undefined}
    }

    get inWork(): boolean {
        return !!this.workers.find(worker => worker.inWork)
    }

    async run(): Promise<any> {
        while (await this.executeNextLoaders()){}
        this.stopTrigger()
    }

    private async executeNextLoaders(): Promise<boolean> {
        const loaders = this.nextLoaders()
        if(this.stage === JobStage.end)
            return false
        const result = await Promise.all(loaders.map(loader => loader.run()))
        const errorResult = result.find(res => res.status_name === WorkerStatus.error)
        if(errorResult)
            throw errorResult.result_body.error
        return true
    }

    private nextLoaders(): IAmoWorker[]|null {
        this.setNextStage()
        if(this.stage === JobStage.end)
            return null
        return this.getLoadersOfCurrentStage()
    }

    private setNextStage(): void {
        switch (this.stage) {
            case JobStage.waiting_to_start:
                this.stage = JobStage.load_default
                break
            case JobStage.load_default:
                this.stage = JobStage.load_entities
                break
            case JobStage.load_entities:
                this.stage = JobStage.end
                break
            default:
                throw Errors.internalError('Invalid executor stage: "' + this.stage + '" AmocrmExecutor -> setNextStage')
        }
    }

    private getLoadersOfCurrentStage(): IAmoWorker[] {
        switch (this.stage) {
            case JobStage.waiting_to_start:
                return []

            case JobStage.load_default:
                return this.workers.filter(loader => AmocrmExecutor.isDefaultJob(loader.job))

            case JobStage.load_entities:
                const entitiesJob = this.workers.find(loader => loader.job.target === WorkerTarget.entities && WorkName.load)
                return entitiesJob ? [entitiesJob] : []

            case JobStage.end:
                return []

            default:
                throw Errors.internalError('Invalid executor stage: "' + this.stage + '" AmocrmExecutor -> getJobsOfCurrentStage')
        }
    }

    private static isDefaultJob (job: IAmoJob): boolean {
        switch (job.target) {
            case WorkerTarget.users:
            case WorkerTarget.pipelines:
            case WorkerTarget.customFields:
                return true
            default:
                return false
        }
    }

    async stop(): Promise<any> {
        const promise = new Promise(resolve => this.stopResolveFunc = resolve)
        Promise.all(this.workers.map(loader => loader.stop()))
        return promise
    }

    private stopTrigger(): void {
        setTimeout(() => typeof this.stopResolveFunc === 'function' && this.stopResolveFunc())
    }

    protected static createLoadersByJob(job: IAmoJob): IAmoWorker[] {
        const jobs = AmocrmExecutor.decompositionJob(job)
        return AmocrmExecutor.createLoadersByJobs(jobs)
    }

    protected static decompositionJob (job: IAmoJob): IAmoJob[] {
        const jobs: IAmoJob[] = []
        switch (job.target) {
            case WorkerTarget.all:
            case WorkerTarget.crm:
                jobs.push(this.createLoadJob(job, WorkerTarget.entities))

            case WorkerTarget.entities:
                jobs.push(this.createLoadJob(job, WorkerTarget.entities))
                if(job.target === WorkerTarget.entities) break

            case WorkerTarget.default:
            case WorkerTarget.users:
                jobs.push(this.createLoadJob(job, WorkerTarget.users))
                if(job.target === WorkerTarget.users) break

            case WorkerTarget.pipelines:
                jobs.push(this.createLoadJob(job, WorkerTarget.pipelines))
                if(job.target === WorkerTarget.pipelines) break

            case WorkerTarget.customFields:
                jobs.push(this.createLoadJob(job, WorkerTarget.customFields))
                if(job.target === WorkerTarget.customFields) break
                break
            default:
                throw Errors.invalidRequest('Unknown job "' + job.full_name + '"')
        }
        return AmocrmExecutor.filterUniqueJobs(jobs)
    }

    private static createLoadJob(mainJob: IAmoJob, target: WorkerTarget): IAmoJob {
        return {
            full_name: mainJob.work_name + ":" + target,
            node: mainJob.node,
            target,
            work_name: mainJob.work_name
        }
    }

    private static filterUniqueJobs(jobs: IAmoJob[]): IAmoJob[] {
        return jobs.filter((i, index) => {
            const job = jobs.find(job => job.full_name === i.full_name)
            return jobs.indexOf(job) === index
        })
    }

    private static createLoadersByJobs (jobs: IAmoJob[]): IAmoWorker[] {
        return jobs.map(job => new WorkerWrapper(job))
    }
}

export class AmoAccWorkers extends AccWorkers{
    async createWorkExecutor(job: IAmoJob): Promise<IWorkExecutor> {
        return AmocrmExecutor.create(job)
    }
}


export class AmoAccWorkersStorage extends AccWorkersStorage implements IAccWorkersStorage {
    static get self(): IAccWorkersStorage {
        if(AmoAccWorkersStorage.inst) return AmoAccWorkersStorage.inst
        AmoAccWorkersStorage.inst = new AmoAccWorkersStorage()
        return AmoAccWorkersStorage.inst
    }

    protected async create(pragmaAccountId: number): Promise<IAccountWorkers> {
        return new AmoAccWorkers(pragmaAccountId)
    }
}