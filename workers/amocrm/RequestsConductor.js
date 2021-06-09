import { IAmocrmLoaders } from "./interface";
import { IServer } from "../../server/intrfaces";
import { IBasic } from "../../generals/IBasic";
var Errors = IBasic.Errors;
var Error = IBasic.Error;
var Result = IServer.Result;
var WorkerMethods = IAmocrmLoaders.WorkerMethods;
import { InstallEventHandler } from "./handlers/InstallEventHandler";
import { BasicWorkersHandler } from "./handlers/BasicWorkersHandler";
import { MainRouter } from "../../crm_systems/main/path_handlers/BasicRouter";
export class RequestsConductor {
    constructor() { }
    static get self() {
        if (RequestsConductor.inst)
            return RequestsConductor.inst;
        RequestsConductor.inst = new RequestsConductor();
        return RequestsConductor.inst;
    }
    async execute(request) {
        try {
            return await this._execute(request);
        }
        catch (e) {
            const error = e instanceof Error ? e : Errors.internalError(e);
            return new Result(error);
        }
    }
    async _execute(request) {
        RequestsConductor.validRequest(request);
        switch (request.method) {
            case WorkerMethods.install_module_event:
                return await this.installEventHandler(request);
            default:
                throw Errors.invalidRequest('Invalid method: "' + request.method + '"');
        }
    }
    static validRequest(request) {
        BasicWorkersHandler.validRequest(request);
    }
    async installEventHandler(request) {
        const handler = this.createInstallHandler(request);
        return await handler.execute();
    }
    createInstallHandler(request) {
        return new InstallEventHandler(request);
    }
}
export class WorkersRouter extends MainRouter {
    static get self() {
        if (WorkersRouter.inst)
            return WorkersRouter.inst;
        WorkersRouter.inst = new WorkersRouter();
        return WorkersRouter.inst;
    }
    async execute(request) {
        return await RequestsConductor.self.execute(request);
    }
    validRequest(request) {
        RequestsConductor.validRequest(request);
        return null;
    }
}
//# sourceMappingURL=RequestsConductor.js.map