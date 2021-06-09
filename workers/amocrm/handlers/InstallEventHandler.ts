import {IMainWorkers} from "../../main/interface";
import IJob = IMainWorkers.IJob;
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import WorkerTarget = IMainWorkers.LoadWorkerTarget;
import WorkName = IMainWorkers.WorkName;
import {IAmocrmLoaders} from "../interface";
import IInstallEventRequest = IAmocrmLoaders.IInstallEventRequest;
import {IServer} from "../../../server/intrfaces";
import IResult = IServer.IResult;
import {BasicWorkersHandler} from "./BasicWorkersHandler";
import Result = IServer.Result;
import {IBasic} from "../../../generals/IBasic";
import Error = IBasic.Error;
import Errors = IBasic.Errors;
import {AmoAccWorkersStorage} from "../AmoAccWorkers";
import IAccWorkersStorage = IMainWorkers.IAccWorkersStorage;
import {Configs} from "../../../generals/Configs";
import {AmocrmRestGateway} from "../AmocrmRestGateway";
import {LogJson} from "../../../generals/LogWriter";

class JobCreator {
    static createJob(node: IAmocrmNodeStruct): IJob {
        switch (node.module.code) {
            case 'Dashboard':
            case 'TEST_ALL':
                return JobCreator.create(node, WorkerTarget.all)
            case 'PragmaCalculator':
            case 'PragmaStorage':
                return JobCreator.create(node, WorkerTarget.crm)
            default:
                return JobCreator.create(node, WorkerTarget.default)
        }
    }

    private static create(node: IAmocrmNodeStruct, target: WorkerTarget): IJob {
        return {
            full_name: WorkName.load + ":" + target,
            node,
            target,
            work_name: WorkName.load
        }
    }
}

class ModuleWebhooks {
    static async setWebhooks(node: IAmocrmNodeStruct): Promise<void> {
        try {
            await ModuleWebhooks._setWebhooks(node)
        }catch (e){
            LogJson.create(node).sendError(e, 'ModuleWebhooks ERROR')
        }
    }

    private static async _setWebhooks(node: IAmocrmNodeStruct): Promise<void>{
        switch (node.module.code) {
            case 'Dashboard':
            case 'TEST_ALL':
            case 'PragmaCalculator':
            case 'PragmaStorage':
                return await ModuleWebhooks._setEntitiesWebhooks(node)
            case 'TemplateEngine':
                return await ModuleWebhooks.setTemplateEngineWebhooks(node)
            default:
                return;
        }
    }

    private static async _setEntitiesWebhooks(node: IAmocrmNodeStruct): Promise<void> {
        const params = ModuleWebhooks.createRequestParams()
        await AmocrmRestGateway.post(node, ModuleWebhooks.webhooksRoute, params)
    }

    private static createRequestParams(): any {
        const settings = ['add_lead', 'add_contact', 'add_company',
            'update_lead', 'update_contact', 'update_company',
            'delete_lead', 'delete_contact', 'delete_company',
        ]
        return {destination: ModuleWebhooks.entitiesWebhook, settings}
    }

    private static get entitiesWebhook(): string {
        return Configs.serverUrl + '/api/integrations/pragmacrm/amocrm/event_handler.php'
    }

    private static async setTemplateEngineWebhooks(node: IAmocrmNodeStruct): Promise<void> {
        const settings = ['delete_lead']
        const params = {destination: ModuleWebhooks.templateEngineUrl, settings}
        await AmocrmRestGateway.post(node, ModuleWebhooks.webhooksRoute, params)
    }

    private static get templateEngineUrl(): string {
        return Configs.serverUrl + '/api/own/templater/amocrm/crm_events/delete_event_handler.php'
    }

    private static get webhooksRoute(): string {
        return '/api/v4/webhooks'
    }
}

export class InstallEventHandler{
    readonly request: IInstallEventRequest

    constructor(request: IInstallEventRequest) {
        this.request = request
    }

    async execute (): Promise<IResult> {
        try {
            return await this._execute()
        } catch (e) {
            const error = e instanceof Error ? e : Errors.internalError(e)
            return new Result(error)
        }
    }

    private async _execute (): Promise<IResult> {
        InstallEventHandler.valid(this.request)
        const job = JobCreator.createJob(this.node)
        const answer = await this.workersStorage.runWithoutWaitingEnd(this.pragmaAccountId, job)
        ModuleWebhooks.setWebhooks(this.node)
        return new Result(answer)
    }

    protected get workersStorage(): IAccWorkersStorage {
        return AmoAccWorkersStorage.self
    }

    private static valid(request: IInstallEventRequest): void {
        BasicWorkersHandler.validNode(request.query.data)
    }

    protected get pragmaAccountId(): number {
        return this.node.account.pragma_account_id
    }

    protected get node(): IAmocrmNodeStruct {
        return this.request.query.data
    }
}