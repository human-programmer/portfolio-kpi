import {IServer} from "../../intrfaces";
import IInputRequest = IServer.IInputRequest;
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import {PWorkers} from "../../PWorkers";
import PragmaWorkers = PWorkers.PragmaWorkers;
import IMainAccountStruct = IMain.IMainAccountStruct;
import IAccountsFilter = IMain.IAccountsFilter;

export class PragmaConductor {
    static async getPragmaAccounts(request: IInputRequest): Promise<Array<IMainAccountStruct>> {
        const pragmaRequest = PragmaConductor.createPragmaGetRequest(request)
        const answer = await PragmaWorkers.pragmaCrmWorker.executeRequest(pragmaRequest);
        if(answer.result.error)
            throw answer.result
        return answer.result;
    }

    private static createPragmaGetRequest(inputRequest: IInputRequest): IInputRequest {
        return {
            crmName: "pragma",
            entity: "accounts",
            method: "get",
            query: inputRequest.query
        }
    }

    protected static createAccountsRequestFromFilter(filter: IAccountsFilter): IInputRequest {
        return {
            crmName: "pragma",
            entity: "accounts",
            method: "get",
            query: {filter}
        }
    }

    static createGetUsersRequest(request: IInputRequest, pragma_user_id: Array<number>): IInputRequest {
        return {
            crmName: "pragma",
            entity: "users",
            method: "get",
            query: {
                client_module_code: request.query.client_module_code,
                filter: {pragma_user_id}
            }
        }
    }

    static createGetAmocrmNodesRequest(request: IInputRequest): IInputRequest {
        return {
            crmName: "amocrm",
            entity: "nodes",
            method: "get",
            query: request.query instanceof Object ? request.query : {}
        }
    }
}