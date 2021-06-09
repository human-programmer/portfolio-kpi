import {IAmocrmLoaders} from "./interface";
import IWorkersRequest = IAmocrmLoaders.IWorkersRequest;
import {IServer} from "../../server/intrfaces";
import IResult = IServer.IResult;
import RequestCrmName = IServer.RequestCrmName;
import {IBasic} from "../../generals/IBasic";
import Errors = IBasic.Errors;
import RequestEntity = IServer.RequestEntity;
import Error = IBasic.Error;
import Result = IServer.Result;
import IInstallEventRequest = IAmocrmLoaders.IInstallEventRequest;
import WorkerMethods = IAmocrmLoaders.WorkerMethods;
import {InstallEventHandler} from "./handlers/InstallEventHandler";
import {BasicWorkersHandler} from "./handlers/BasicWorkersHandler";
import {MainRouter} from "../../crm_systems/main/path_handlers/BasicRouter";
import {MainWorker} from "../../crm_systems/main/MainWorker";

export class RequestsConductor {
    protected static inst: RequestsConductor

    static get self(): RequestsConductor {
        if(RequestsConductor.inst) return RequestsConductor.inst
        RequestsConductor.inst = new RequestsConductor()
        return RequestsConductor.inst
    }

    protected constructor() {}

    async execute(request: IWorkersRequest): Promise<IResult> {
        try {
            return await this._execute(request)
        } catch (e) {
            const error = e instanceof Error ? e : Errors.internalError(e)
            return new Result(error)
        }
    }
    private async _execute(request: IWorkersRequest|any): Promise<IResult> {
        RequestsConductor.validRequest(request)
        switch (request.method) {
            case WorkerMethods.install_module_event:
                return await this.installEventHandler(request)
            default:
                 throw Errors.invalidRequest('Invalid method: "' + request.method + '"')
        }
    }

    static validRequest(request: IWorkersRequest): void {
        BasicWorkersHandler.validRequest(request)
    }

    private async installEventHandler (request: IInstallEventRequest): Promise<IResult> {
        const handler = this.createInstallHandler(request)
        return await handler.execute()
    }

    protected createInstallHandler(request: IInstallEventRequest) : InstallEventHandler {
        return new InstallEventHandler(request)
    }
}

export class WorkersRouter extends MainRouter {
    private static inst: WorkersRouter

    static get self(): WorkersRouter {
        if(WorkersRouter.inst) return WorkersRouter.inst
        WorkersRouter.inst = new WorkersRouter()
        return WorkersRouter.inst
    }

    protected async execute(request: any): Promise<any> {
        return await RequestsConductor.self.execute(request)
    }

    protected validRequest(request: any): null {
        RequestsConductor.validRequest(request)
        return null
    }
}