import {IBasic} from "../../generals/IBasic";
import {IMain} from "../../crm_systems/main/interfaces/MainInterface";

export namespace IMainWorkers {
    import IError = IBasic.IError;
    import IMainNodeStruct = IMain.IMainNodeStruct;

    export enum JobStage {
        waiting_to_start = 1,
        load_default = 2,
        load_entities = 3,
        end = 4,
    }

    export enum WorkerStatus {
        waiting_to_start = 'waiting_to_start',
        works = 'works',
        cancelled = 'cancelled',
        completed = 'completed',
        error = 'error',
    }

    export interface ILoadResult {
        readonly loaded: number
        readonly total: number
    }

    export interface IWorkerResult extends IWorkerStatus{
        readonly job: IJob
        readonly statuses: IWorkerStatus[]
    }

    export interface IWorkerStatus {
        readonly full_work_name: string
        readonly status_name: WorkerStatus
        readonly start_date: Date
        readonly result_body: IWorkerResultBody
        readonly completion_date: Date
        readonly duration_ms: number
    }

    export interface IWorkerResultBody {
        readonly add_info: any|ILoadResult
        readonly error: null|IError
    }

    export interface IWorker {
        readonly statusName: WorkerStatus
        readonly statuses: IWorkerStatus[]
        readonly inWork: boolean
        readonly job: IJob
        readonly fullName: string
        readonly lastWorkerResult: IWorkerResult
        run(): Promise<IWorkerResult>
        stop(): Promise<IWorkerResult>
    }

    export interface IJob {
        readonly target: LoadWorkerTarget
        readonly work_name: WorkName
        readonly node: IMainNodeStruct
        readonly full_name: string
    }

    export enum WorkName {
        load = 'load',
        metrics = 'metrics'
    }

    export enum LoadWorkerTarget {
        users = 'users',
        pipelines = 'pipelines',
        customFields = 'customFields',//загрузить все кастомные поля
        contactsCf = 'contactsCf',//загрузить кастомные поля контактов
        companiesCf = 'companiesCf',//загрузить кастомные поля компаний
        leadsCf = 'leadsCf',//загрузить кастомные поля сделок
        contacts = 'contacts',
        companies = 'companies',
        leads = 'leads',
        default = 'default', //загрузить users, pipelines и customFields
        entities = 'entities', //зкрузить сделки, контакты и компании
        crm = 'crm', //зкрузить всё, кроме задач и звонков
        all = 'all' //зкрузить всё
    }

    export interface IJobExecutorWrapper extends IWorker{
        readonly alreadyLaunched: boolean
    }

    export interface IWorkExecutor {
        readonly job: IJob
        readonly inWork: boolean
        readonly statuses: IWorkerStatus[]
        readonly resultBody: IWorkerResultBody
        run(): Promise<void>
        stop(): Promise<void>
    }

    export interface IAccountWorkers {
        readonly pragmaAccountId: number
        runWithoutWaitingEnd(job: IJob): Promise<IWorkerResult>
        runWaitingEnd(job: IJob): Promise<IWorkerResult>
        getStatuses(): Promise<IWorkerStatus[]>
    }

    export interface IAccWorkersStorage {
        runWithoutWaitingEnd(pragmaAccountId: number, job: IJob): Promise<IWorkerResult>
        runWaitingEnd(pragmaAccountId: number, job: IJob): Promise<IWorkerResult>
        getStatuses(pragmaAccountId: number): Promise<IWorkerStatus[]>
    }
}