import {Bitrix24QueryHandler} from "./request/Bitrix24QueryHandler";
import {Bitrix24AccountsHandler} from "./accounts/Bitrix24AccountsHandler";
import {IBasic} from "../../../generals/IBasic";
import Errors = IBasic.Errors;
import {Bitrix24InstallHandler} from "./install/Bitrix24InstallHandler";
import {Bitrix24AccountsModulesHandler} from "./accounts_modules/Bitrix24AccountsModulesHandler";
import {IServer} from "../../../server/intrfaces";
import Result = IServer.Result;
import IWorkerMessage = IServer.IWorkerMessage;
import TypeWorkerMessage = IServer.TypeWorkerMessage;

export class Bitrix24Router {
    static async route (request: IWorkerMessage): Promise<IWorkerMessage> {
        const path = request.body.basePath
        let answer: IWorkerMessage = {
            requestId: request.requestId,
            type: TypeWorkerMessage.api,
            body: {}
        }

        if(Bitrix24QueryHandler.isRouteOwner(path))
            answer.body = await Bitrix24QueryHandler.execute(request.body)

        else if(Bitrix24AccountsHandler.isRouteOwner(path))
            answer.body = await Bitrix24AccountsHandler.execute(request.body)

        else if(Bitrix24InstallHandler.isRouteOwner(path))
            answer.body = await Bitrix24InstallHandler.execute(request.body)

        else if(Bitrix24AccountsModulesHandler.isRouteOwner(path))
            answer.body = await Bitrix24AccountsModulesHandler.execute(request.body)

        else
            answer.body = new Result(Errors.invalidRequest('Wrong path "' + path + '"'))

        return answer
    }
}