import {IMain} from "../interfaces/MainInterface";
import IAccountsQuery = IMain.IAccountsQuery;
import IAccountsFilter = IMain.IAccountsFilter;
import IAccountsRequest = IMain.IAccountsRequest;
import {Handler} from "./MainHandler";

export abstract class BasicAccountsHandler extends Handler{

    static mainRequestFormatting(request: any): IAccountsRequest {
        request = super.basicRequestFormatting(request)
        request.query = BasicAccountsHandler.mainQueryFormatting(request.query)
        return request
    }

    private static mainQueryFormatting(query: any): IAccountsQuery {
        query = query instanceof Object ? query : {}
        query.filter = BasicAccountsHandler.mainFilterFormatting(query.filter)
        return query
    }

    private static mainFilterFormatting(filter: any): IAccountsFilter {
        filter = filter instanceof Object ? filter : {}
        filter.pragma_account_id = super.asUniqueNumbers(filter.pragma_account_id)
        return filter
    }
}