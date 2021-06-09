import {Bitrix24Handler} from "../Bitrix24Handler";
import {IBasic} from "../../../../generals/IBasic";
import IError = IBasic.IError;
import Request = IBasic.Query;
import {Bitrix24} from "../../interface/Bitrix24Interfaces";
import IQueryRequest = Bitrix24.IQueryRequest;
import Error = IBasic.Error;
import {Bitrix24ApiRequest} from "../../components/gateway/RestApiGateway";
import {Accounts} from "../../components/accounts/Accounts";
import {Bitrix24AccountsModules} from "../../components/accounts_modules/AccountsModules";
import IAccountModule = Bitrix24.IAccountModule;
import Errors = IBasic.Errors;
import {IServer} from "../../../../server/intrfaces";
import IResult = IServer.IResult;
import Result = IServer.Result;
import IInputQueryData = Bitrix24.IInputQueryData;
import {isValidBitrix24RestApiMethod} from "../../components/gateway/MethodValidator";
import {BITRIX24_QUERY_ROUTE} from "../../BITIX24_CRONSTANTS";

const PATH = BITRIX24_QUERY_ROUTE

class QueryRequest extends Request implements IQueryRequest{
    readonly member_id: string;
    readonly data: { method: string; params: any };

    constructor(query) {
        super(query);
        this.member_id = query.member_id
        this.data = {
            method: query.data.method,
            params: query.data.params
        }
    }

    static validInputQueryData (data: IInputQueryData): IError|null {
        if(!isValidBitrix24RestApiMethod(data.method))
            return Errors.invalidRequest('Unknown rest method"' + data.method + '"')
    }

    static formattingQuery(query: any): IQueryRequest {
        query = query instanceof Object ? query : {}
        query.data = query.data instanceof Object ? query.data : {}
        query.data.method

        return {
            client_module_code: query.client_module_code || '',
            account_referer: query.account_referer || '',
            member_id: query.member_id || '',
            data: {
                method: typeof query.data.method === 'string' ? query.data.method : '',
                params: query.data.params ? query.data.params : {}
            }
        }
    }
}

export class Bitrix24QueryHandler extends Bitrix24Handler {
    private readonly queryRequest: IQueryRequest

    static async execute (request: IQueryRequest): Promise<IResult> {
        try {
            return await Bitrix24QueryHandler._execute(request)
        } catch (e) {
            const message = typeof e === 'string' ? e : 'Unknown Error'
            return new Result(Errors.createError(message, Errors.serverErrorCode))
        }
    }

    protected static async _execute (request: any, handlerTestClass: any = null): Promise<IResult> {
        if(typeof handlerTestClass !== 'function' || !handlerTestClass.isTestQueryHandlerClass)
            handlerTestClass = Bitrix24QueryHandler

        const query = QueryRequest.formattingQuery(request.query)
        let answer: any = await Bitrix24QueryHandler.validRequest(request)
        if(!answer) {
            const queryRequest = new QueryRequest(query)
            const handler = new handlerTestClass(request.basePath, queryRequest)
            answer = await handler.checkModule() ||
                    await handler.checkBitrix24Account() ||
                    await handler.requestProcessing()
        }
        return new Result(answer)
    }

    protected constructor(route_path: string, request: IQueryRequest) {
        super(route_path, request)
        this.queryRequest = request
    }

    async requestProcessing(): Promise<any> {
        const node = await this.getNode()
        const request = new Bitrix24ApiRequest(node.bitrix24RestApiGateway.bitrix24Path, this.queryRequest.data.method, this.queryRequest.data.params)
        return await request.executed()
    }

    private async getNode(): Promise<IAccountModule> {
        return await Bitrix24AccountsModules.self.findAccountModuleByMemberId(this.queryRequest.client_module_code, this.queryRequest.member_id)
    }

    protected async checkBitrix24Account(): Promise<IError|null> {
        const account = await Accounts.getAccounts().findAccount(this.queryRequest.member_id)
        return account ? null : new Error('Account by member_id "' + this.queryRequest.member_id + '" not found', 1044)
    }

    static async validRequest(request: any): Promise<IError|null> {
        let error = await super.requestValidator(request, PATH)
        if(error) return error

        if(!request.query.member_id)
            return Errors.invalidRequest('account member_id is missing')

        return QueryRequest.validInputQueryData(request.query.data)
    }

    static isRouteOwner(path: string): boolean {
        return PATH === path
    }
}