import {IServer} from "./intrfaces";
import IInputRequest = IServer.IInputRequest;
import {PWorkers} from "./PWorkers";
import {IBasic} from "../generals/IBasic";
import Errors = IBasic.Errors;
import Result = IServer.Result;
import IResult = IServer.IResult;
import {PragmaAccountsConductor} from "./conductors/pragma/PragmaAccountsConductor";
import {IMain} from "../crm_systems/main/interfaces/MainInterface";
import IMainAccountStruct = IMain.IMainAccountStruct;
import {Amocrm} from "../crm_systems/amocrm/interface/AmocrmInterfaces";
import IInputAccountsRequest = Amocrm.IInputAccountsRequest;
import IAccountsFilter = Amocrm.IAccountsFilter;
import IError = IBasic.IError;
import {PragmaNodesConductor} from "./conductors/pragma/PragmaNodesConductor";
import {PragmaConductor} from "./conductors/pragma/PragmaConductor";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import IUserStruct = IMain.IUserStruct;
import IAccountModule = Amocrm.IAccountModule;
import RequestWorker = PWorkers.RequestWorker;
import PragmaWorkers = PWorkers.PragmaWorkers;
import {LogJson} from "../generals/LogWriter";
import {AmocrmNodesConductor} from "./conductors/amocrm/AmocrmNodesConductor";
import {BasicConductor} from "../generals/BasicConductor";

export class Conductor extends BasicConductor{
    protected constructor() {
        super()
    }

    static runWorkers(): void {
        Conductor.pragmaWorker
        Conductor.amoQueueWorker
        Conductor.amoWorkersWorker
    }

    static handler = async (req, res) => {
        Conductor.requestFormatting(req)
        let answer
        try{
            answer = await Conductor.executeRequest(req)
            if(answer.result.error)
                res.status(400)
        } catch (error) {
            res.status(400)
            answer = new Result(Errors.internalError(error))
        } finally {
            res.send(answer)
        }
    }

    static async executeRequest(request: any): Promise<IResult> {
        const inputRequest = Conductor.fetchRequest(request)
        return await Conductor._handler(inputRequest)
    }

    private static async _handler(inputRequest: IInputRequest): Promise<IResult> {
        switch (inputRequest.crmName) {
            case 'pragma':
                return await Conductor.pragmaHandler(inputRequest)
            case 'amocrm':
                return await Conductor.amocrmHandler(inputRequest)
            case 'bitrix24':
                return await Conductor.bitrix24Handler(inputRequest)
            default:
                return new Result(Errors.invalidRequest('Unknown crm_name in route "' + inputRequest.crmName + '"'))
        }
    }

    private static async pragmaHandler(inputRequest: IInputRequest): Promise<IResult> {
        switch (inputRequest.entity){
            case 'accounts':
                return await PragmaAccountsConductor.execute(inputRequest)
            case 'nodes':
                return await PragmaNodesConductor.execute(inputRequest)
            default:
                return await Conductor.pragmaWorker.executeRequest(inputRequest)
        }
    }

    static async amocrmHandler(inputRequest: IInputRequest): Promise<IResult> {
        switch (inputRequest.entity) {
            case 'nodes':
                return await Conductor.amocrmNodesHandler(inputRequest)
            default:
                return await Conductor.amoQueueWorker.executeRequest(inputRequest)
        }
    }

    protected static get amoQueueWorker(): RequestWorker {
        return PragmaWorkers.amocrmRequestWorker
    }

    protected static get amoWorkersWorker(): RequestWorker {
        return PragmaWorkers.amocrmWorkersWorker
    }

    protected static get pragmaWorker(): RequestWorker {
        return PragmaWorkers.pragmaCrmWorker
    }

    static async amocrmNodesHandler(request: IInputRequest): Promise<IResult> {
        return await AmocrmNodesConductor.execute(request)
    }

    private static async bitrix24Handler(inputRequest: IInputRequest): Promise<IResult> {
        // const result = await bitrix24RequestWorker.executeRequest(inputRequest)
        return new Result(Errors.internalError('Bitrix is not implemented'))
    }
}