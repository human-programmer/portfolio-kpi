import {IBasic} from "../../../../generals/IBasic";
import {Bitrix24} from "../../interface/Bitrix24Interfaces";
import IError = IBasic.IError;
import Error = IBasic.Error;
import IAccountsQuery = Bitrix24.IAccountsQuery;
import Query = IBasic.Query;
import {Accounts} from "../../components/accounts/Accounts";
import {Bitrix24Handler} from "../Bitrix24Handler";
import Errors = IBasic.Errors;
import IAccountsFilter = Bitrix24.IAccountsFilter;
import {IServer} from "../../../../server/intrfaces";
import IResult = IServer.IResult;
import Result = IServer.Result;
import {BITRIX24_ACCOUNTS_ROUTE} from "../../BITIX24_CRONSTANTS";
const PATH = BITRIX24_ACCOUNTS_ROUTE

export class Bitrix24AccountsHandler extends Bitrix24Handler {
    private readonly accountRequest: IAccountsQuery

    static async execute (request: IServer.IInputRequest): Promise<IResult|IError|any> {
        try {
            return await Bitrix24AccountsHandler._execute(request)
        } catch (e) {
            return new Result(Errors.internalError(e))
        }
    }

    private static async _execute (request: IServer.IInputRequest): Promise<IResult|IError|any> {
        Bitrix24AccountsHandler.formattingRequest(request)
        let answer = await Bitrix24AccountsHandler.validRequest(request)
        if(!answer) {
            const accountQuery = new AccountsQuery(request.query)
            const handler = new Bitrix24AccountsHandler(request.basePath, accountQuery)
            answer = await handler.requestProcessing()
        }
        return new Result(answer)
    }

    protected constructor(route_path: string, request: AccountsQuery) {
        super(route_path, request)
        this.accountRequest = request
    }

    async requestProcessing(): Promise<IResult|IError|any> {
        const accounts = await Accounts.getAccounts().findAccounts(this.accountRequest.filter.members_id)
        return accounts.map(account => account.publicModel)
    }

    private static async validRequest (request: any): Promise<IError|null> {
        const error = await Bitrix24AccountsHandler.requestValidator(request, PATH)
        if(error) return error

        const data = request.query
        if(!(data instanceof Object) || !Object.keys(data).length)
            return new Error('Request params not specified', 1002)

        const filter = data.filter
        if(!(filter instanceof Object) || !Object.keys(filter).length)
            return new Error('Filter params not specified', 1003)

        if(typeof filter.members_id !== 'string' && !(filter.members_id instanceof Array))
            return new Error('Id of accounts are not specified in filter', 1003)

        return null
    }

    static isRouteOwner(path: string): boolean {
        return PATH === path
    }

    private static formattingRequest (request: any): void {
        request.query = AccountsQuery.formattingQuery(request.query)
    }
}

class AccountsQuery extends Query implements IAccountsQuery {
    readonly filter: IAccountsFilter

    constructor(query) {
        super(query)
        this.filter = query.filter
    }

    static formattingQuery(query: any): IAccountsQuery {
        const answer = {
            filter: {members_id:[]},
            client_module_code: query.client_module_code || '',
            account_referer: query.account_referer || ''
        }
        if(!(query instanceof Object)) {
            return answer
        }
        query.filter = query.filter instanceof Object ? query.filter : {}
        if(Array.isArray(query.filter.members_id))
            answer.filter.members_id = query.filter.members_id.filter(i => i)
        else
            answer.filter.members_id = query.filter.members_id ? [query.filter.members_id] : query.filter.members_id
        return answer
    }
}
