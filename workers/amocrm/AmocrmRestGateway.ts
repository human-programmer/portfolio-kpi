import {Amocrm} from "../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {IMain} from "../../crm_systems/main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;
import {IServer} from "../../server/intrfaces";
import IResult = IServer.IResult;
import {Configs} from "../../generals/Configs";
import {HttpsClient} from "../../crm_systems/main/HttpsClient";
import IInputGatewayQuery = IMain.IInputGatewayQuery;

export class AmocrmRestGateway extends HttpsClient{
    static async post(node: IAmocrmNodeStruct, route: string, params: any = {}): Promise<any> {
        const targetRequest = AmocrmRestGateway.createPostRequest(node, route, params)
        const answer = await AmocrmRestGateway.execute(targetRequest)
        return answer.result
    }

    static async get(node: IAmocrmNodeStruct, route: string, params: any = {}): Promise<any> {
        const targetRequest = AmocrmRestGateway.createGetRequest(node, route, params)
        const answer = await AmocrmRestGateway.execute(targetRequest)
        return answer.result
    }

    private static async execute(targetRequest: IInputGatewayQuery): Promise<IResult> {
        try {
            return AmocrmRestGateway._execute(targetRequest)
        } catch (e) {
            throw e
        }
    }

    private static async _execute(targetRequest: IInputGatewayQuery): Promise<IResult> {
        const options: IRequestOptions = AmocrmRestGateway.createOptions(targetRequest)
        const answer = await super.executeRequest(options)
        return answer.body
    }

    private static createOptions(targetRequest: IInputGatewayQuery): IRequestOptions {
        return {
            body: targetRequest,
            headers: {'Content-Type': 'application/json'},
            method: "POST",
            uri: `http://${Configs.server.host}:${Configs.server.port}/amocrm/nodes/rest.gateway`
        }
    }

    private static createGetRequest(node: IAmocrmNodeStruct, uri: string, body: any = {}): IInputGatewayQuery {
        const options: IRequestOptions = {
            body,
            method: "GET",
            priority: 3,
            uri
        }
        return AmocrmRestGateway.createGatewayQuery(node, options)
    }

    private static createPostRequest(node: IAmocrmNodeStruct, uri: string, body: any = {}): IInputGatewayQuery {
        const options: IRequestOptions = {
            body,
            method: "POST",
            priority: 3,
            uri
        }
        return AmocrmRestGateway.createGatewayQuery(node, options)
    }

    private static createGatewayQuery(node: IAmocrmNodeStruct, options: IRequestOptions): IInputGatewayQuery {
        return {
            client_module_code: node.module.code,
            account_referer: node.account.amocrm_referer,
            data: options
        }
    }
}