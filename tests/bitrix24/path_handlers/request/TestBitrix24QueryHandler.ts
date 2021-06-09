import {Bitrix24QueryHandler} from "../../../../crm_systems/bitrix24/path_handlers/request/Bitrix24QueryHandler";
import {Bitrix24} from "../../../../crm_systems/bitrix24/interface/Bitrix24Interfaces";
import IQueryRequest = Bitrix24.IQueryRequest;
import {IServer} from "../../../../server/intrfaces";
import IResult = IServer.IResult;

export class TestBitrix24QueryHandler extends Bitrix24QueryHandler {
    constructor(route_path: string, request: IQueryRequest) {
        super(route_path, request);
    }

    static executeTest = async (request, handlerClass): Promise<IResult> => {
        return await Bitrix24QueryHandler._execute(request, handlerClass)
    }

    async requestProcessing(): Promise<any> {
        return 'success'
    }

    static get isTestQueryHandlerClass(): boolean {
        return true
    }
}