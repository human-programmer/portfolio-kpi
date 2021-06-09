import {AmocrmRestGateway} from "../AmocrmRestGateway";
import {IAmocrmLoaders} from "../interface";
import IAmoJob = IAmocrmLoaders.IAmoJob;
import {IBasic} from "../../../generals/IBasic";
import Errors = IBasic.Errors;
import {IMainWorkers} from "../../main/interface";
import ILoader = IMainWorkers.IWorker;
import IWorkerStatus = IMainWorkers.IWorkerStatus;
import ILoadResult = IMainWorkers.ILoadResult;
import WorkerStatus = IMainWorkers.WorkerStatus;
import IJob = IMainWorkers.IJob;
import IWorkerResult = IMainWorkers.IWorkerResult;
import IWorkerResultBody = IMainWorkers.IWorkerResultBody;
import {AWorker} from "../../main/workers/Workers";

abstract class Loader extends AWorker{
    readonly job: IAmoJob
    protected readonly loadersQuantity: number = 1

    protected readonly limit: number = 200
    private currentPage: number = 1
    private stopped: boolean = false
    private workersStatuses: Array<boolean> = []
    private resolve: any
    private reject: any
    protected readonly queryParams: any = {}

    protected abstract readonly route: string
    protected abstract saveEntities(entities: Array<any>): Promise<void>
    protected abstract fetchEntities(body: any): Array<any>
    protected abstract updateGeneralStatus(entities: Array<any>): void

    constructor(job: IAmoJob) {
        super(job)
        this.job = job
    }

    get pragmaAccountId(): number {
        return this.job.node.account.pragma_account_id
    }

    get amocrmAccountId(): number {
        return this.job.node.account.amocrm_account_id
    }

    async run(): Promise<any> {
        if(this.resolve || this.reject)
            throw Errors.internalError("reject or resolve callbacks already exists")

        setTimeout(this.createLoadWorkers)

        return new Promise(((resolve, reject) => {
            this.resolve = resolve
            this.reject = reject
        }))
    }

    private createLoadWorkers = (): void => {
        for (let i = 0; i < this.loadersQuantity; ++i)
            this.createAndRunWorker()
    }

    private createAndRunWorker(): void {
        const id = this.workersStatuses.length
        this.workersStatuses[id] = true
        this.runWorker(id)
    }

    private runWorker = async (id: number): Promise<void> => {
        try {
            return await this._runWorker(id)
        } catch (e) {
            this.stopByError(id)
            this.rejectTrigger(e)
        }
    }

    private _runWorker = async (id: number): Promise<void> => {
        this.updateWorkerStatus(id)
        if(!this.checkStatus()) return;
        const entities = await this.getEntities(id)
        await this.saveEntities(entities)
        this.runWorker(id)
    }

    private async getEntities(workerId: number): Promise<Array<any>> {
        try {
            return await this._getEntities(workerId)
        } catch (e) {
            this.stopByError(workerId)
            throw e
        }
    }

    private async _getEntities(workerId: number): Promise<Array<any>> {
        if(this.stopped) return []
        const  {body, info} = await this.restQuery()
        const entities = this.fetchEntities(body)
        this.updateStatus(workerId, info, entities)
        return entities
    }

    protected async restQuery(): Promise<any> {
        // console.log(this.route)
        return await AmocrmRestGateway.get(this.job.node, this.route, this.requestParams)
    }

    private get requestParams(): any {
        return Object.assign(this.queryParams, {
            limit: this.limit,
            page: this.currentPage++
        })
    }

    private stopByError (workerId: number): void {
        this.setStopped()
        this.updateWorkerStatus(workerId)
    }

    private updateStatus(workerId: number, info: any, entities: any): void {
        if(info.statusCode === 204 || !Array.isArray(entities) || !entities.length || entities.length < this.limit)
            this.setStopped()
        // this.updateWorkerStatus(workerId)
        this.updateGeneralStatus(entities)
    }

    private setStopped(): void {
        // console.log('setStopped', this.workersStatuses)
        this.stopped = true
    }

    private updateWorkerStatus(workerId: number): void {
        this.workersStatuses[workerId] = !this.stopped
    }

    private checkStatus(): boolean {
        this.allWorkersStopped && this.resolveTrigger()
        return this.isRun
    }

    protected get allWorkersStopped(): boolean {
        return !this.workersStatuses.find(i => i)
    }

    private get isRun(): boolean {
        return !this.stopped
    }

    private resolveTrigger(): void {
        const resolve = this.resolve
        this.reset()
        typeof resolve === 'function' && resolve()
    }

    private rejectTrigger(error: any): void {
        const reject = this.reject
        this.reset()
        typeof reject === 'function' && reject(error)
    }

    protected reset(): void {
        this.reject = null
        this.resolve = null
    }

    stop(): void {
        this.stopped = true
    }
}

export abstract class AmocrmLoader extends Loader implements ILoader{
    private loadedEntities: number = 0
    private completedStatus: IWorkerStatus[]
    private stopResolve: any

    constructor(job: IAmoJob) {
        super(job)
        this.init()
    }

    private init(): void {
        this.loadedEntities = 0
        this.completedStatus = []
    }

    get inWork(): boolean {
        return this.statusName === WorkerStatus.works || !this.allWorkersStopped
    }

    get fullName(): string {
        return this.job.full_name
    }

    async run(): Promise<IWorkerResult> {
        try {
            return await this._run()
        } catch (e) {
            this.setError(e)
            this.stopTrigger()
            return this.lastWorkerResult
        }
    }

    async _run(): Promise<IWorkerResult> {
        if(this.statusName === WorkerStatus.cancelled)
            return this.lastWorkerResult
        this.setStarted()
        await super.run()
        this.setEnded(WorkerStatus.completed)
        this.stopTrigger()
        return this.lastWorkerResult
    }

    get lastWorkerResult(): IWorkerResult {
        return {
            duration_ms: this.durationMs,
            full_work_name: this.job.full_name,
            job: this.job,
            completion_date: this.completionDate,
            start_date: this.startDate,
            status_name: this.statusName,
            statuses: this.statuses,
            result_body: this.resultBody
        }
    }

    get statuses(): IWorkerStatus[] {
        return this.completedStatus.length ? this.completedStatus : this.loadStatus
    }

    private get loadStatus(): IWorkerStatus[] {
        return [{
            duration_ms: this.durationMs,
            full_work_name: this.job.full_name,
            result_body: this.resultBody,
            completion_date: this.completionDate,
            start_date: this.startDate,
            status_name: this.statusName
        }]
    }

    private get addInfo(): ILoadResult {
        return {loaded: this.loadedEntities, total: -1}
    }

    async stop(): Promise<IWorkerResult> {
        this.setEnded(WorkerStatus.cancelled)
        if(!this.inWork)
            return this.lastWorkerResult
        const answerPromise: Promise<IWorkerResult> = new Promise(resolve => this.stopResolve = resolve)
        super.stop()
        return await answerPromise
    }

    private stopTrigger(): void {
        if(typeof this.stopResolve === 'function')
            setTimeout(() => this.stopResolve(this.lastWorkerResult))
    }

    protected setEnded(statusName: WorkerStatus, data: any = null): void {
        super.setEnded(statusName, data)
        this.setCompletedStatus()
    }

    private setCompletedStatus(): void {
        this.completedStatus.push({
            full_work_name: this.job.full_name,
            result_body: this.resultBody,
            completion_date: this.completionDate,
            start_date: this.startDate,
            status_name: this.statusName,
            duration_ms: this.durationMs,
        })
    }

    private get resultBody(): IWorkerResultBody {
        return {
            add_info: this.addInfo,
            error: this.error,
        }
    }

    protected updateGeneralStatus(entities: Array<any>): void {
        entities = Array.isArray(entities) ? entities : []
        this.loadedEntities += entities.length
    }
}

export abstract class PackLoaders extends AWorker implements ILoader{
    protected abstract concurrentlyRun: boolean
    protected loaders: Array<ILoader>
    private currentWorker: number = 0

    constructor(job: IJob, loaders: Array<ILoader>) {
        super(job)
        this.loaders = loaders
    }

    async run(): Promise<IWorkerResult> {
        try {
            this.setStarted()
            this.concurrentlyRun ? await this.concurrently() : await this.queue()
            this.setEnded(WorkerStatus.completed)
        } catch (error) {
            this.setError(error)
        } finally {
            return this.lastWorkerResult
        }
    }

    private async concurrently(): Promise<any>{
        try {
            await Promise.all(this.loaders.map(loader => loader.run()))
        } catch (e) {
            this.setError(e)
        } finally {
            this.checkResults()
        }
    }

    async queue(): Promise<any> {
        try {
            let loader
            while (loader = this.nextLoader)
                await loader.run()
        } catch (e) {
            this.setError(e)
        } finally {
            this.checkResults()
        }
    }

    private get nextLoader(): ILoader|null {
        return this.isAvailableNext ? this.loaders[this.currentWorker++] : null
    }

    private get isAvailableNext(): boolean {
        return this.statusName !== WorkerStatus.error && this.statusName !== WorkerStatus.cancelled
    }

    get lastWorkerResult(): IWorkerResult {
        return Object.assign(this.mainStatus, {
            job: this.job,
            statuses: this.statuses
        })
    }

    get mainStatus(): IWorkerStatus {
        return {
            full_work_name: this.job.full_name,
            completion_date: this.completionDate,
            start_date: this.startDate,
            status_name: this.statusName,
            result_body: this.mainResultBody,
            duration_ms: this.durationMs
        }
    }

    private get mainResultBody(): IWorkerResultBody {
        return {add_info: this.addInfo, error: this.findError}
    }

    private get addInfo(): any {
        const inf = this.statuses.map(status => status.result_body.add_info)
        const numbers = inf.map(i => i ? (i.loaded || 0) : 0)
        const loaded = numbers.reduce((res, val) => res + val)
        const total = -1
        return {loaded, total}
    }

    private checkResults(): void {
        if(this.error && this.statusName === WorkerStatus.error) return;
        const errorStatus = this.findErrorStatus
        if(!errorStatus) return;
        this.setError(errorStatus.result_body.error)
    }

    private get findError(): any|null {
        if(this.error)
            return this.error
        const errorStatus = this.findErrorStatus
        return errorStatus ? errorStatus.result_body.error : null
    }

    private get findErrorStatus(): IWorkerStatus|null {
        return this.statuses.find(status => status.status_name === WorkerStatus.error || status.result_body.error)
    }

    get statuses(): IWorkerStatus[] {
        return [].concat(...this.loaders.map(i => i.statuses))
    }

    get inWork(): boolean {
        return !!this.loaders.find(i => i.inWork)
    }

    get fullName(): string {
        return this.job.full_name
    }

    async stop(): Promise<IWorkerResult> {
        this.setEnded(WorkerStatus.cancelled)
        await Promise.all(this.loaders.map(i => i.stop()))
        const startUpWorker = this.startUpWorker
        startUpWorker && await startUpWorker.stop()
        return this.lastWorkerResult
    }

    get startUpWorker(): ILoader|null {
        return this.loaders.find(i => i.statuses[0].status_name === WorkerStatus.works)
    }
}