import {IServer} from "../../intrfaces";
import IInputRequest = IServer.IInputRequest;
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {PragmaConductor} from "./PragmaConductor";
import IInputNodesRequest = Amocrm.IInputNodesRequest;
import INodesFilter = Amocrm.INodesFilter;
import {AmocrmNodesHandler} from "../../../crm_systems/amocrm/path_handlers/accounts_modules/AmocrmNodesHandler";
import Result = IServer.Result;
import IResult = IServer.IResult;
import {IBasic} from "../../../generals/IBasic";
import Errors = IBasic.Errors;
import IMainAccountStruct = IMain.IMainAccountStruct;
import {PWorkers} from "../../PWorkers";
import PragmaWorkers = PWorkers.PragmaWorkers;
import {Conductor} from "../../Conductor";

export class PragmaNodesConductor extends PragmaConductor{
    static async execute(request: IInputRequest): Promise<IResult> {
        switch (request.method){
            case 'get':
                return await PragmaNodesConductor.executeGet(request)
            case 'create.inactive.api.key':
            case 'check.api.key':
                return await PragmaNodesConductor.executeApiKey(request)
            default:
                throw Errors.invalidRequest('Invalid method "' + request.method + '" for pragma')
        }
    }

    private static async executeGet(request: IInputRequest): Promise<IResult> {
        const amocrmNodes = await PragmaNodesConductor.getAmocrmNodes(request);
        return new Result(amocrmNodes)
    }

    static async getAmocrmNodes(request: IInputRequest): Promise<Array<IAmocrmNodeStruct>> {
        const pragmaAccounts = await super.getPragmaAccounts(request)
        const accountsId = pragmaAccounts.filter(i => i.crm_name === 'amocrm').map(i => i.pragma_account_id)
        if(!accountsId.length) return []
        return await PragmaNodesConductor.queryAmocrmNodes(request, accountsId);
    }

    private static async queryAmocrmNodes(request: IInputRequest, accountsId: Array<number>): Promise<Array<IAmocrmNodeStruct>>{
        const amocrmRequest = PragmaNodesConductor.amocrmNodesRequest(request, accountsId);
        const answer = await Conductor.amocrmNodesHandler(amocrmRequest);
        if(answer.result.error) throw answer.result
        return answer.result
    }

    protected static amocrmNodesRequest(request: IInputRequest, pragma_account_id: Array<number>): IInputNodesRequest {
        const amocrmRequest: any = super.createGetAmocrmNodesRequest(request)
        const filter: INodesFilter = {
            pragma_module_id: undefined,
            amocrm_account_id: undefined,
            amocrm_integration_id: undefined,
            amocrm_referer: undefined,
            pragma_account_id,
            code: request.query.filter.code
        }
        amocrmRequest.query.filter = filter
        return amocrmRequest
    }

    private static async executeApiKey(request: IInputRequest|any): Promise<IResult> {
        const account = await PragmaNodesConductor.getPragmaAccountForApiKey(request)
        request.crmName = account.crm_name
        if(account.crm_name === 'amocrm')
            return await PragmaWorkers.amocrmRequestWorker.executeRequest(request);
        else
            throw Errors.invalidRequest('ApiKeys methods not implemented for crm "' + account.crm_name + '"')
    }

    private static async getPragmaAccountForApiKey(request: IInputRequest): Promise<IMainAccountStruct> {
        // @ts-ignore
        const pragmaAccountId = request.query.pragma_account_id
        if(Array.isArray(pragmaAccountId))
            throw Errors.invalidRequest('filter.pragma_account_id must be of type int')

        const filter = {pragma_account_id: pragmaAccountId}
        const accountsRequest = super.createAccountsRequestFromFilter(filter)
        const pragmaAccounts = await super.getPragmaAccounts(accountsRequest)

        if(!pragmaAccounts.length)
            throw Errors.invalidRequest('Account not found "' + pragmaAccountId + '"')
        return pragmaAccounts[0]
    }
}