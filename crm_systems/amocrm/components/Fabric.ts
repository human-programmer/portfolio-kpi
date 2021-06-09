import {IMain} from "../../main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;
import IInputGatewayRequest = IMain.IInputGatewayRequest;
import {Amocrm} from "../interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import IInputGatewayQuery = IMain.IInputGatewayQuery;

export class Fabric {
    static createGatewayRequest(node: IAmocrmNodeStruct, options: IRequestOptions): IInputGatewayRequest {
        const query: IInputGatewayQuery = {
            client_module_code: node.module.code,
            account_referer: node.account.amocrm_referer,
            data: options
        }

        return {
            crmName: "amocrm",
            entity: "nodes",
            method: "rest.gateway",
            query
        }
    }
}