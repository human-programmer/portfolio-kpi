import {AmocrmHandler} from "../AmocrmHandler";
import {IBasic} from "../../../../generals/IBasic";
import IError = IBasic.IError;
import {Amocrm} from "../../interface/AmocrmInterfaces";
import IAccountsQuery = Amocrm.IAccountsQuery;
import Errors = IBasic.Errors;
import Error = IBasic.Error;
import IAccount = Amocrm.IAccount;
import {AmocrmAccounts} from "../../components/accounts/AmocrmAccounts";
import {IServer} from "../../../../server/intrfaces";
import IResult = IServer.IResult;
import Result = IServer.Result;
import IInputAccountsRequest = Amocrm.IInputAccountsRequest;
import {BasicAccountsHandler} from "../../../main/path_handlers/BasicAccountsHandler";
import IAmocrmAccountStruct = Amocrm.IAmocrmAccountStruct;

export class AmocrmAccountsHandler extends AmocrmHandler{
    readonly availableMethods: string[] = ['get']
    readonly query: IAccountsQuery
    readonly request: any

    constructor(request: IInputAccountsRequest) {
        super(request)
        this.query = request.query
        this.request = request
    }

    static async execute(request: any): Promise<IResult> {
        try {
            return await AmocrmAccountsHandler._execute(request)
        } catch (e) {
            const error = e instanceof Error ? e : Errors.internalError(e)
            return new Result(error)
        }
    }

    private static async _execute(request: any): Promise<IResult> {
        request = AmocrmAccountsHandler.formattingRequest(request)
        const handler = new AmocrmAccountsHandler(request)
        const answer = await handler.requestProcessing()
        return new Result(answer)
    }

    async requestProcessing(): Promise<any> {
        return await this.validRequest() || await this.executeQuery()
    }

    private async validRequest(): Promise<IError|null> {
        return await this.requestValidator() || await this.checkModule()
    }

    private async executeQuery(): Promise<any> {
        switch (this.actualMethod) {
            case 'get':
                return await this.get()
            default:
                return Errors.invalidRequest('Invalid accounts method "' + this.actualMethod + '"')
        }
    }

    private async get(): Promise<Array<IAmocrmAccountStruct>> {
        return await this.executeGet()
    }

    private async executeGet(): Promise<Array<IAmocrmAccountStruct>> {
        const is_target = this.amocrmReferer.length || this.pragmaAccountsId.length || this.amocrmAccountsId.length
        if(is_target)
            return await this.getTargetModels()
        return await this.getAllAccounts()
    }

    private get amocrmAccountsId(): Array<number> {
        return this.query.filter.amocrm_account_id
    }

    private get pragmaAccountsId(): Array<number> {
        return this.query.filter.pragma_account_id
    }

    private get amocrmReferer(): Array<string> {
        return this.query.filter.amocrm_referer
    }

    private async getTargetModels(): Promise<Array<IAmocrmAccountStruct>> {
        const accounts = await this.getUniqueAccounts()
        return accounts.map(i => i.publicModel)
    }

    private async getAllAccounts(): Promise<Array<IAmocrmAccountStruct>> {
        throw Errors.invalidRequest('Method "getAllAccounts" is not implemented')
    }

    protected async getUniqueAccounts(): Promise<Array<IAccount>> {
        const accId = await this.getAccountsByAmocrmId()
        const referer = await this.getAccountsByReferer()
        const pragma = await this.getAccountsByPragmaId()
        const accounts = [...accId, ...referer, ...pragma].filter(i => i)
        return accounts.filter((acc, index) => accounts.indexOf(acc) === index)
    }

    private async getAccountsByAmocrmId(): Promise<Array<IAccount>> {
        return Promise.all(this.amocrmAccountsId.map(id => AmocrmAccounts.self.findByAmocrmId(id)))
    }

    private async getAccountsByReferer(): Promise<Array<IAccount>> {
        return Promise.all(this.amocrmReferer.map(referer => AmocrmAccounts.self.findByAmocrmReferer(referer)))
    }

    private async getAccountsByPragmaId(): Promise<Array<IAccount>> {
        return Promise.all(this.pragmaAccountsId.map(id => AmocrmAccounts.self.findAccount(id)))
    }

    private static formattingRequest(request: any): IInputAccountsRequest {
        request = BasicAccountsHandler.mainRequestFormatting(request)
        request.query.filter = AmocrmAccountsHandler.formattingFilter(request.query.filter)
        return request
    }

    private static formattingFilter(filter: any): any {
        filter.amocrm_referer = super.asUniqueStrings(filter.amocrm_referer)
        filter.amocrm_account_id = super.asUniqueNumbers(filter.amocrm_account_id)
        filter.pragma_account_id = super.asUniqueNumbers(filter.pragma_account_id)
        return filter
    }

    static validRequest(query: any): IError|null {
        if(!(query instanceof Object) || !(query.filter instanceof Object))
            return new Error('Filter field is missing', Errors.invalidRequestCode)

        if(!query.filter.amocrm_referer.length && !query.filter.amocrm_account_id && !query.filter.pragma_account_id.length)
            return new Error('filter.amocrm_account_id or filter.amocrm_referer fields is missing', Errors.invalidRequestCode)
    }
}