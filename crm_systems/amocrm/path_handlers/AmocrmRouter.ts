import {AmocrmAccountsHandler} from "./accounts/AmocrmAccountsHandler";
import {IBasic} from "../../../generals/IBasic";
import Errors = IBasic.Errors;
import {AmocrmNodesHandler} from "./accounts_modules/AmocrmNodesHandler";
import {IServer} from "../../../server/intrfaces";
import Result = IServer.Result;
import IInputRequest = IServer.IInputRequest;
import IResult = IServer.IResult;
import {MainRouter} from "../../main/path_handlers/BasicRouter";
import {GatewayHandler} from "./accounts_modules/methods/GatewayHandler";



export class AmocrmRouter extends MainRouter{
    private static inst: AmocrmRouter

    static get self(): AmocrmRouter {
        if(AmocrmRouter.inst) return AmocrmRouter.inst
        AmocrmRouter.inst = new AmocrmRouter()
        return AmocrmRouter.inst
    }

    protected validRequest (request: IInputRequest): IResult|null {
        let error
        if(request.crmName !== 'amocrm')
            error = Errors.invalidRequest('Invalid route crm name "' + request.crmName + '"')
        else if(request.entity !== 'accounts' && request.entity !== 'nodes')
            error = Errors.invalidRequest('Wrong route entity "' + request.entity + '"')
        return error ? new Result(error) : null
    }

    protected async execute(request: IInputRequest): Promise<any> {
        switch (request.entity) {
            case 'accounts':
                return await AmocrmAccountsHandler.execute(request)
            case 'nodes':
                return await AmocrmNodesHandler.execute(request)
            default:
                return new Result(Errors.invalidRequest('Invalid route entity "' + request.entity + '"'))
        }
    }
}