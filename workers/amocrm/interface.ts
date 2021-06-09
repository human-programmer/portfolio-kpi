import {IMainWorkers} from "../main/interface";
import {Generals} from "../../generals/Interfaces";
import {IServer} from "../../server/intrfaces";
import {Amocrm} from "../../crm_systems/amocrm/interface/AmocrmInterfaces";

export namespace IAmocrmLoaders {
    import IJob = IMainWorkers.IJob;
    import FieldType = Generals.FieldType;
    import IInputRequest = IServer.IInputRequest;
    import RequestCrmName = IServer.RequestCrmName;
    import RequestEntity = IServer.RequestEntity;
    import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
    import IInputQuery = IServer.IInputQuery;
    import IWorker = IMainWorkers.IWorker;

    export enum AmoNoteType {
        call_in = 'call_in',
        call_out = 'call_out',
    }

    export enum WorkerMethods {
        install_module_event = 'install.module.event',
        new_work = 'new.work',
    }

    export interface IWorkQuery extends IInputQuery{
        readonly node: IAmocrmNodeStruct
        readonly full_work_name: string
    }

    export interface IInstallEventQuery extends IInputQuery{
        readonly data?: IAmocrmNodeStruct
    }

    export interface IWorkersRequest extends IInputRequest {
        readonly crmName: RequestCrmName.amocrm
        readonly entity: RequestEntity.workers
        readonly method: WorkerMethods
        readonly query: any
    }

    export interface IInstallEventRequest extends IWorkersRequest {
        readonly crmName: RequestCrmName.amocrm
        readonly entity: RequestEntity.workers
        readonly method: WorkerMethods.install_module_event
        readonly query: IInstallEventQuery
    }

    export function createInstallEventRequest(node: IAmocrmNodeStruct): IInstallEventRequest {
        return {
            crmName: RequestCrmName.amocrm,
            entity: RequestEntity.workers,
            method: WorkerMethods.install_module_event,
            query: {data: node}
        }
    }

    export interface IAmoJob extends IJob {
        readonly node: IAmocrmNodeStruct
    }

    export interface ILoadedUser {
        readonly pragmaAccountId: number
        pragmaUserId?: number
        readonly amocrmUserId: number
        readonly email: string
        readonly name: string
        readonly lang: string
        readonly isAdmin: boolean
    }

    export interface IRestUser {
        readonly id: number
        readonly email: string
        readonly name: string
        readonly lang: string
        readonly rights: {
            readonly is_admin: boolean
        }
    }

    export interface IPipeline {
        pragmaAccountId?: number
        readonly amocrmAccountId: number
        readonly amocrmPipelineId: number
        pragmaPipelineId?: number
        readonly title: string
        readonly sort: number
        readonly statuses: Array<IStatus>
    }

    export interface IStatus {
        readonly amocrmAccountId: number
        readonly amocrmStatusId: number
        pragmaStatusId?: number
        readonly color: string
        readonly title: string
        readonly amocrmPipelineId: number
        pragmaPipelineId?: number
        readonly sort: number
    }

    export interface IAmocrmCustomField extends ICustomField{
        readonly amocrmFieldId: number
        readonly amocrmAccountId: number
        readonly amocrmEntityType: string
        readonly amocrmFieldType: string
    }

    export interface ICustomField {
        pragmaFieldId?: number
        readonly pragmaAccountId: number
        readonly pragmaEntityType: number
        readonly pragmaFieldType: FieldType
        readonly title: string
        readonly enums: Array<IAmocrmEnum>
    }

    export interface IAmocrmEnum extends IEnum{
        readonly amocrmEnumId: number
    }

    export interface IEnum {
        pragmaEnumId?: number
        pragmaFieldId?: number
        readonly sort: number
        readonly value: string
        readonly pragmaAccountId: number
    }

    export interface IAmoWorker extends IWorker {
        readonly job: IAmoJob
    }
}