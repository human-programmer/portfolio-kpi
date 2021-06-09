import {IAmocrmLoaders} from "../interface";
import IWorkersRequest = IAmocrmLoaders.IWorkersRequest;
import {IServer} from "../../../server/intrfaces";
import RequestCrmName = IServer.RequestCrmName;
import RequestEntity = IServer.RequestEntity;
import {IBasic} from "../../../generals/IBasic";
import Errors = IBasic.Errors;
import {IMainWorkers} from "../../main/interface";
import IWorkerResult = IMainWorkers.IWorkerResult;

export abstract class BasicWorkersHandler{
    static validRequest(request: IWorkersRequest): void {
        if(typeof request !== 'object')
            throw Errors.invalidRequest('Invalid request')

        if(request.crmName !== RequestCrmName.amocrm)
            throw Errors.invalidRequest('Invalid crmName: "' + request.crmName + '"')

        if(request.entity !== RequestEntity.workers)
            throw Errors.invalidRequest('Invalid entity: "' + request.entity + '"')

        if(typeof request.query !== 'object')
            throw Errors.invalidRequest('Invalid query')
    }

    static validNode (node: any): void {
        if(typeof node !== 'object')
            throw Errors.invalidRequest('Invalid node')

        if(typeof node.account !== 'object')
            throw Errors.invalidRequest('Invalid node.account')

        if(!node.account.pragma_account_id)
            throw Errors.invalidRequest('Invalid node.account.pragma_account_id')

        if(typeof node.module !== 'object')
            throw Errors.invalidRequest('Invalid node.module')

        if(!node.module.code)
            throw Errors.invalidRequest('Invalid node.module.code')
    }
}