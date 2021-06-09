import {IMainWorkers} from "../interface";
import {IBasic} from "../../../generals/IBasic";
import {WorkersFabric} from "./WorkersFabric";
import IWorker = IMainWorkers.IWorker;
import WorkerStatus = IMainWorkers.WorkerStatus;
import IJobExecutor = IMainWorkers.IJobExecutorWrapper;
import IJob = IMainWorkers.IJob;
import IAccountWorkers = IMainWorkers.IAccountWorkers;
import IWorkerResult = IMainWorkers.IWorkerResult;
import Errors = IBasic.Errors;
import IWorkerResultBody = IMainWorkers.IWorkerResultBody;
import IWorkExecutor = IMainWorkers.IWorkExecutor;
import IWorkerStatus = IMainWorkers.IWorkerStatus;
import IAccWorkersStorage = IMainWorkers.IAccWorkersStorage;
import Error = IBasic.Error;

// @ts-ignore
export abstract class AWorker implements IWorker{
    readonly job: IMainWorkers.IJob
    private _statusName: WorkerStatus = WorkerStatus.waiting_to_start
    protected startDate: Date
    protected completionDate: Date
    protected error: any
    private _inWork: boolean = false
    constructor(job: IJob) {
        this.job = job
    }

    protected get durationMs(): number {
        return AWorker.durationMs(this.startDate, this.completionDate)
    }

    protected static durationMs (startDate: any|Date, endDate: any|Date): number {
        if(!(startDate instanceof Date)) return 0
        const end = endDate instanceof Date ? endDate : new Date()
        return Math.abs(end.getTime() - startDate.getTime())
    }

    protected leaveOldStatus(newStatus: WorkerStatus): boolean {
        return (this.statusName === WorkerStatus.cancelled && newStatus !== WorkerStatus.error) ||
            this.statusName === WorkerStatus.error
    }

    protected setStarted(): void {
        this._inWork = true
        this._statusName = WorkerStatus.works
        this.startDate = new Date()
    }

    protected setError(e: any): void {
        const error = e instanceof Error ? e : Errors.internalError(e)
        this.setEnded(WorkerStatus.error, error)
    }

    protected setCompleted(): void {
        this.setEnded(WorkerStatus.completed)
    }

    protected setCancelled(): void {
        this.setEnded(WorkerStatus.cancelled)
    }

    protected setEnded(statusName: WorkerStatus, data: any = null): void {
        this._inWork = false
        if(statusName === WorkerStatus.error)
            this.error = data
        this._statusName = this.leaveOldStatus(statusName) ? this.statusName : statusName
        this.completionDate = new Date()
    }

    get statusName(): WorkerStatus {
        return this._statusName
    }

    get inWork(): boolean {
        return this._inWork
    }
}

class JobExecutor extends AWorker{
    private readonly executor: IWorkExecutor

    constructor(executor: IWorkExecutor) {
        super(executor.job)
        this.executor = executor
    }

    async run(): Promise<IWorkerResult> {
        try {
            this.setStarted()
            await this.executor.run()
            this.setEnded(WorkerStatus.completed)
        } catch (error) {
            this.setError(error)
        } finally {
            return this.lastWorkerResult
        }
    }

    async stop(): Promise<IWorkerResult> {
        try {
            this.setEnded(WorkerStatus.cancelled)
            await this.executor.stop()
        } catch (error) {
            this.setError(error)
        } finally {
            return this.lastWorkerResult
        }
    }

    get inWork(): boolean {
        return !!this.executor.inWork
    }

    get lastWorkerResult(): IWorkerResult {
        const statuses = this.statuses
        return Object.assign(this.mainStatus, {
            job: this.job,
            statuses: statuses
        })
    }

    get statuses(): IWorkerStatus[] {
        const statuses: IWorkerStatus[] = this.executor.statuses
        const targetStatus = statuses.find(i => i.full_work_name === this.fullName)
        const index = targetStatus ? statuses.indexOf(targetStatus) : statuses.length
        statuses.splice(index, 1, this.mainStatus)
        return statuses
    }

    get fullName(): string {
        return this.job.full_name
    }

    get mainStatus(): IWorkerStatus {
        return {
            duration_ms: this.durationMs,
            full_work_name: this.job.full_name,
            completion_date: this.completionDate,
            start_date: this.startDate,
            status_name: this.statusName,
            result_body: this.resultBody
        }
    }

    private get resultBody(): IWorkerResultBody{
        const body: any = this.executor.resultBody
        if(this.error) body.error = this.error
        return body
    }
}

export class JobDealer extends JobExecutor implements IJobExecutor{
    private runResolveClients: any[] = []
    private stopResolveClients: any[] = []
    private _alreadyLaunched: boolean = false
    private alreadyStopped: boolean = false

    static create(executor: IWorkExecutor): IJobExecutor {
        return new JobDealer(executor)
    }

    get alreadyLaunched(): boolean {
        return this._alreadyLaunched
    }

    async run(): Promise<IWorkerResult> {
        this.safeRun()
        return new Promise(resolve => this.runResolveClients.push(resolve))
    }

    private async safeRun(): Promise<void> {
        if(this._alreadyLaunched) return;
        this._alreadyLaunched = true
        const result = await super.run()
        this.executedClientsTrigger(result)
    }

    private executedClientsTrigger(result: IWorkerResult): void {
        this.runResolveClients.map(func => {
            typeof func === 'function' && setTimeout(() => func(result))
        })
    }

    async stop(): Promise<IWorkerResult> {
        this.safeStop()
        return new Promise(resolve => this.stopResolveClients.push(resolve))
    }

    private async safeStop(): Promise<void> {
        if(this.alreadyStopped) return;
        this.alreadyStopped = true
        const result = await super.stop()
        this.stopClientsTrigger(result)
    }

    private stopClientsTrigger(result: IWorkerResult): void {
        this.stopResolveClients.map(func => {
            typeof func === 'function' && setTimeout(() => func(result))
        })
    }
}

export abstract class AccWorkers implements IAccountWorkers {
    abstract createWorkExecutor(job: IJob): Promise<IWorkExecutor>
    readonly pragmaAccountId: number
    protected readonly jobDealers: IJobExecutor[] = []

    constructor(pragmaAccountId: number) {
        this.pragmaAccountId = pragmaAccountId
    }

    async runWithoutWaitingEnd(job: IJob): Promise<IWorkerResult> {
        const jobDealer = await this.getJobDealer(job)
        AccWorkers.executeJob(jobDealer)
        return new Promise(res => setTimeout(() => res(jobDealer.lastWorkerResult)))
    }

    async runWaitingEnd(job: IMainWorkers.IJob): Promise<IMainWorkers.IWorkerResult> {
        const jobDealer = await this.getJobDealer(job)
        await AccWorkers.executeJob(jobDealer)
        return jobDealer.lastWorkerResult
    }

    protected async getJobDealer(job: IJob): Promise<IJobExecutor> {
        return this.findJobDealerInBuffer(job) || await this.createJobDealer(job)
    }

    protected findJobDealerInBuffer(job: IJob): IJobExecutor|null {
        return this.jobDealers.find(loader => loader.fullName === job.full_name)
    }

    protected async createJobDealer(job: IJob): Promise<IJobExecutor> {
        const workExecutor = await this.createWorkExecutor(job)
        const jobDealer = JobDealer.create(workExecutor)
        this.jobDealers.push(jobDealer)
        return jobDealer
    }

    private static async executeJob(jobDealer: IJobExecutor): Promise<void> {
        const alreadyLaunched = !!jobDealer.alreadyLaunched
        await jobDealer.run()
        alreadyLaunched || await AccWorkers.saveResult(jobDealer)
    }

    private static async saveResult(jobDealer: IWorker): Promise<void> {
        await WorkersFabric.save(jobDealer.lastWorkerResult)
    }

    async getStatuses(): Promise<IWorkerStatus[]> {
        const fromBuffer = this.statusesFromBuffer()
        const fromDb = await WorkersFabric.getStatuses(this.pragmaAccountId)
        return AccWorkers.mergeStatuses(fromBuffer, fromDb)
    }

    private statusesFromBuffer(): IWorkerStatus[] {
        const statuses = [].concat(...this.jobDealers.map(i => i.statuses))
        return statuses
            .sort((status0, status1) => {
                const date0 = status0.start_date || new Date()
                const date1 = status1.start_date || new Date()
                if(date0.getTime() > date1.getTime())
                    return -1
                if(date0.getTime() < date1.getTime())
                    return 1
                return 0
            })
            .filter((i, index) => {
                const stat = statuses.find(status => status.full_work_name === i.full_work_name)
                return statuses.indexOf(stat) === index
            })
    }

    private static mergeStatuses(fromBuffer: IWorkerStatus[], fromDb: IWorkerStatus[]): IWorkerStatus[] {
        const filterFromDb = fromDb.filter(db => !fromBuffer.find(bf => bf.full_work_name === db.full_work_name))
        return [].concat(fromBuffer, filterFromDb)
    }
}

interface ITimeOut {
    pragma_account_id: number
    timeout: any
}

export abstract class AccWorkersStorage implements IAccWorkersStorage {
    protected abstract create(pragmaAccountId: number): Promise<IAccountWorkers>

    protected static inst: IAccWorkersStorage
    protected readonly accWorkers: IAccountWorkers[] = []
    protected readonly timeouts: ITimeOut[] = []
    protected readonly delayDeletionFromBuffer: number = 10800000

    protected constructor() {}

    async getStatuses(pragmaAccountId: number): Promise<IWorkerStatus[]> {
        const workers = this.findInBuffer(pragmaAccountId) || await this.create(pragmaAccountId)
        return await workers.getStatuses()
    }

    async runWaitingEnd(pragmaAccountId: number, job: IJob): Promise<IWorkerResult> {
        const workers = await this.getWorkerForRun(pragmaAccountId)
        return await this.runWaitingWorkers(workers, job)
    }

    async runWithoutWaitingEnd(pragmaAccountId: number, job: IJob): Promise<IWorkerResult> {
        const workers = await this.getWorkerForRun(pragmaAccountId)
        return await this.runWithoutWaitingWorkers(workers, job)
    }

    protected async getWorkerForRun(pragmaAccountId: number): Promise<IAccountWorkers> {
        return this.findInBuffer(pragmaAccountId) || await this.createWorkerForRun(pragmaAccountId)
    }

    protected async createWorkerForRun(pragmaAccountId: number): Promise<IAccountWorkers> {
        const workers = await this.create(pragmaAccountId)
        this.accWorkers.push(workers)
        this.setDelayDeletionFromBuffer(workers)
        return workers
    }

    private setDelayDeletionFromBuffer(workers: IAccountWorkers): void {
        const timeout: ITimeOut = {
            pragma_account_id: workers.pragmaAccountId,
            timeout: setTimeout(() => this.removeFromBuffer(workers), this.delayDeletionFromBuffer)
        }
        this.timeouts.push(timeout)
    }

    private removeFromBuffer(workers: IAccountWorkers): void {
        const index = this.accWorkers.indexOf(workers)
        this.accWorkers.splice(index, 1)
        this.removeTimeOut(workers.pragmaAccountId)
    }

    private removeTimeOut(pragmaAccountId: number): void {
        const timeout = this.timeouts.find(i => i.pragma_account_id == pragmaAccountId)
        const index = this.timeouts.indexOf(timeout)
        if (index === -1) return;
        this.timeouts.splice(index, 1)
    }

    protected findInBuffer(pragmaAccountId: number): IAccountWorkers | null {
        return this.accWorkers.find(i => i.pragmaAccountId == pragmaAccountId)
    }

    private async runWithoutWaitingWorkers(workers: IAccountWorkers, job: IJob): Promise<IWorkerResult> {
        let result
        try {
            result = await workers.runWithoutWaitingEnd(job)
            this.runWaitingWorkers(workers, job)
        } catch (error) {
            throw Errors.internalError(error)
        } finally {
            return result
        }
    }

    private async runWaitingWorkers(workers: IAccountWorkers, job: IJob): Promise<IWorkerResult> {
        let result
        try {
            result = await workers.runWaitingEnd(job)
        } catch (error) {
            throw Errors.internalError(error)
        } finally {
            console.log('CLOSE LOADER')
            this.removeFromBuffer(workers)
            return result
        }
    }
}