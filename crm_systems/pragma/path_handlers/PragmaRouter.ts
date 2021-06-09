import {IServer} from "../../../server/intrfaces";
import {IBasic} from "../../../generals/IBasic";
import Errors = IBasic.Errors;
import Result = IServer.Result;
import IInputRequest = IServer.IInputRequest;
import IResult = IServer.IResult;
import {PragmaAccountsHandler} from "./accounts/PragmaAccountsHandler";
import {PragmaUsersHandler} from "./users/PragmaUsersHandler";
import {MainRouter} from "../../main/path_handlers/BasicRouter";


export class PragmaRouter extends MainRouter{
    private static inst: PragmaRouter

    static get self(): PragmaRouter {
        if(PragmaRouter.inst) return PragmaRouter.inst
        PragmaRouter.inst = new PragmaRouter()
        return PragmaRouter.inst
    }

    protected validRequest (request: IInputRequest): IResult|null {
        let error
        if(request.crmName !== 'pragma')
            error = Errors.invalidRequest('Invalid route crm name "' + request.crmName + '"')
        else if(request.entity !== 'accounts' && request.entity !== 'users')
            error = Errors.invalidRequest('Wrong route entity "' + request.entity + '"')
        return error ? new Result(error) : null
    }

    protected async execute(request: IInputRequest): Promise<any> {
        switch (request.entity) {
            case 'accounts':
                return await PragmaAccountsHandler.execute(request)
            case 'users':
                return await PragmaUsersHandler.execute(request)
            default:
                return new Result(Errors.invalidRequest('Invalid route entity "' + request.entity + '"'))
        }
    }
}