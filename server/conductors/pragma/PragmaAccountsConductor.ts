import {IServer} from "../../intrfaces";
import IResult = IServer.IResult;
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import IMainAccountStruct = IMain.IMainAccountStruct;
import IAccountsRequest = IMain.IAccountsRequest;
import {PWorkers} from "../../PWorkers";
import Result = IServer.Result;
import PragmaWorkers = PWorkers.PragmaWorkers;
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmAccountStruct = Amocrm.IAmocrmAccountStruct;
import IInputRequest = IServer.IInputRequest;
import {PragmaConductor} from "./PragmaConductor";

export class PragmaAccountsConductor extends PragmaConductor{

    static async execute(request: IInputRequest): Promise<IResult> {
        const accountsModels = await super.getPragmaAccounts(request);
        const amocrmAccounts = await PragmaAccountsConductor.getAmocrmAccounts(request, accountsModels)
        const pragmaAccounts = accountsModels.filter(acc => !amocrmAccounts.find(amoAcc => amoAcc.pragma_account_id === acc.pragma_account_id))
        const models = pragmaAccounts.concat(amocrmAccounts)
        return new Result(models)
    }

    private static async getAmocrmAccounts(inputRequest: IInputRequest, accountsModels: Array<IMainAccountStruct>): Promise<Array<IAmocrmAccountStruct>> {
        const amocrmAccounts = accountsModels.filter(i => i.crm_name === 'amocrm')
        const amocrmRequest = PragmaAccountsConductor.createAmocrmGetRequest(inputRequest, amocrmAccounts)
        const answer = await PragmaWorkers.amocrmRequestWorker.executeRequest(amocrmRequest)
        return Array.isArray(answer.result) ? answer.result : []
    }

    private static createAmocrmGetRequest(inputRequest: IInputRequest, accountModels: Array<IMainAccountStruct>): IAccountsRequest {
        return {
            crmName: "amocrm",
            entity: "accounts",
            method: "get",
            query: {
                client_module_code: inputRequest.query.client_module_code,
                account_referer: inputRequest.query.account_referer,
                filter: {
                    pragma_account_id: accountModels.map(i => i.pragma_account_id)
                }
            }
        }
    }
}