import {IBasic} from "../../../../generals/IBasic";
import {Bitrix24} from "../../interface/Bitrix24Interfaces";
import IBitrix24NodesQuery = Bitrix24.IBitrix24NodesQuery;
import IError = IBasic.IError;
import IAccountModule = Bitrix24.IAccountModule;
import Error = IBasic.Error;
import {Bitrix24AccountsModules} from "../../components/accounts_modules/AccountsModules";
import {Bitrix24Handler} from "../Bitrix24Handler";
import Errors = IBasic.Errors;
import {Accounts} from "../../components/accounts/Accounts";
import {IServer} from "../../../../server/intrfaces";
import IResult = IServer.IResult;
import Result = IServer.Result;
import IInputRequest = Bitrix24.IInputRequest;
import {BITRIX24_NODES_ROUTE} from "../../BITIX24_CRONSTANTS";

const PATH = BITRIX24_NODES_ROUTE

export class Bitrix24AccountsModulesHandler extends Bitrix24Handler {
    readonly query: IBitrix24NodesQuery

    static async execute (request: IInputRequest): Promise<IResult> {
        try {
            return await Bitrix24AccountsModulesHandler._execute(request)
        } catch (e) {
            return new Result(Errors.internalError(e))
        }
    }

    private static async _execute (request: IInputRequest): Promise<IResult> {
        Bitrix24AccountsModulesHandler.formattingRequest(request)
        let answer: IResult|IError = await Bitrix24AccountsModulesHandler.validRequest(request)
        if(!answer) {
            const requestStruct = new NodesQuery(request.query)
            const handler = new Bitrix24AccountsModulesHandler(PATH, requestStruct)
            answer = await handler.requestProcessing()
        }
        return new Result(answer)
    }

    protected constructor(handler_path: string, request: IBitrix24NodesQuery) {
        super(handler_path, request)
        this.query = request
    }

    async requestProcessing(): Promise<any> {
        let answer = null

        if(!this.member_id && !this.module_code)
            answer = await this.allNodes()

        else if(!this.member_id)
            answer = await this.allNodesOfModule()

        else if(!this.module_code)
            answer = await this.allNodesOfAccount()

        else if(this.module_code &&this.member_id)
            answer = await this.singleNode()

        return answer instanceof Error ? answer : (answer || []).map(node => node.bitrix24PublicModel)
    }

    private async allNodes(): Promise<Array<IAccountModule>|IError> {
        return new Error('Method "allNodes" not implemented', Errors.serverErrorCode)
    }

    private async allNodesOfModule(): Promise<Array<IAccountModule>|IError> {
        return new Error('Method "allNodesOfModule" not implemented', Errors.serverErrorCode)
    }

    private async allNodesOfAccount(): Promise<Array<IAccountModule>|IError> {
        return new Error('Method "allNodesOfAccount" not implemented', Errors.serverErrorCode)
    }

    private async singleNode(): Promise<Array<IAccountModule>|IError> {
        const error = await this.validModule() || await this.validAccount()
        if(error) return error

        const accountModule = await Bitrix24AccountsModules.self.findAccountModuleByMemberId(this.module_code, this.member_id)
        return accountModule ? [accountModule] : Errors.createError('Unknown Error', 1000)
    }

    private async validModule(): Promise<IBasic.IError | null> {
        return super.checkModule(this.module_code);
    }

    private async validAccount (): Promise<IBasic.IError | null> {
        const account = await Accounts.getAccounts().findAccount(this.member_id)
        return account ? null : Errors.createError('Account not found by memberId "' + this.member_id + '"', Errors.notFoundCode)
    }

    private get member_id(): string {
        return this.query.filter.member_id
    }

    private get module_code(): string {
        return this.query.filter.module_code
    }

    private static async validRequest (request: any): Promise<IError|null> {
        const error = await Bitrix24AccountsModulesHandler.requestValidator(request, PATH)
        if(error) return error
    }

    static isRouteOwner(path: string): boolean {
        return PATH === path
    }
    private static formattingRequest(request: any): void {
        request.query = NodesQuery.formattingQuery(request.query)
    }
}

class NodesQuery extends IBasic.Query implements IBitrix24NodesQuery {
    readonly filter: {
        readonly module_code: string|null
        readonly member_id: string|null
    }
    readonly client_member_id?: string

    constructor(query: any) {
        super(query)
        const queryFilter = query.filter || {}
        this.filter = {
            module_code: queryFilter.module_code || null,
            member_id: queryFilter.member_id || null
        }
        this.client_member_id = query.client_member_id
    }

    static formattingQuery(query: any): IBitrix24NodesQuery {
        const answer = {
            filter: {member_id: undefined, module_code: undefined},
            client_module_code: query.client_module_code,
            account_referer: query.account_referer,
            client_member_id: query.client_member_id,
        }
        if(!(query instanceof Object))
            return answer
        query.filter = query.filter instanceof Object ? query.filter : {}
        answer.filter.member_id = query.filter.member_id
        answer.filter.module_code = query.filter.module_code
        return answer
    }
}