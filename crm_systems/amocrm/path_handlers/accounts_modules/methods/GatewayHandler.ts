import {IBasic} from "../../../../../generals/IBasic";
import {AmocrmHandler} from "../../AmocrmHandler";
import {IMain} from "../../../../main/interfaces/MainInterface";
import IInputGatewayRequest = IMain.IInputGatewayRequest;
import IInputGatewayQuery = IMain.IInputGatewayQuery;
import IRequestOptions = IMain.IRequestOptions;
import {IServer} from "../../../../../server/intrfaces";
import IResult = IServer.IResult;
import {AmocrmAccounts} from "../../../components/accounts/AmocrmAccounts";
import Errors = IBasic.Errors;
import {Amocrm} from "../../../interface/AmocrmInterfaces";
import IAccount = Amocrm.IAccount;
import {AmocrmModules} from "../../../components/modules/AmocrmModules";
import IModule = Amocrm.IModule;
import IAccountModule = Amocrm.IAccountModule;
import {AmocrmAccountsModules} from "../../../components/accounts_modules/AmocrmAccountsModules";

export class GatewayHandler extends AmocrmHandler {
    readonly availableMethods: Array<string> = ['rest.gateway']
    readonly request: IInputGatewayRequest

    constructor(request: any) {
        super(request)
        this.request = GatewayHandler.requestFormatting(request)
    }

    private static requestFormatting(request: any): IInputGatewayRequest {
        request = super.basicRequestFormatting(request)
        request.query = GatewayHandler.queryFormatting(request.query)
        return request
    }

    private static queryFormatting(query): IInputGatewayQuery {
        query.data = query.data instanceof Object ? query.data : {}
        if("priority" in query) query.priority = Number.parseInt(query.priority)
        query.data = GatewayHandler.dataFormatting(query.data)
        return query
    }

    private static dataFormatting(data: any): IRequestOptions {
        data.uri = data.uri || ''
        data.body = data.body || {}
        data.method = data.method || ''
        data.headers = super.asUniqueStrings(data.headers)
        return data
    }

    async execute(): Promise<any> {
        return await this.validRequest() || await this._execute()
    }

    private async validRequest(): Promise<null> {
        await super.requestValidator()
        return this.validOptions()
    }

    private validOptions(): null {
        if(!this.queryOptions.uri)
            throw Errors.invalidRequest('data.uri is missing')
        if(!this.queryOptions.method)
            throw Errors.invalidRequest('data.method is missing')
        return null
    }

    private async _execute(): Promise<IResult> {
        const node = await this.getTargetNode()
        return await node.amocrmRequest(this.queryOptions)
    }

    private async getTargetNode(): Promise<IAccountModule> {
        const module = await this.getTargetModule()
        const account = await this.getTargetAccount()
        const node = await AmocrmAccountsModules.self.findNode(module, account)
        if(!node)
            throw Errors.invalidRequest('Node not found, module: "' + module.code + '", account: "' + account.amocrmReferer + '"' )
        return node
    }


    private async getTargetAccount(): Promise<IAccount> {
        if(!this.targetReferer) throw Errors.invalidRequest('account_referer is missing')
        const account = await AmocrmAccounts.self.findByAmocrmReferer(this.targetReferer)
        if(!account) throw Errors.invalidRequest('Account not found "' + this.targetReferer + '"')
        return account
    }

    private async getTargetModule(): Promise<IModule> {
        const module = await AmocrmModules.self.findByCode(this.targetModuleCode)
        if(!module) throw Errors.invalidRequest('Module not found "' + this.targetModuleCode + '"')
        return module
    }

    private get queryOptions(): IRequestOptions {
        return this.request.query.data
    }

    private get targetReferer(): string {
        return this.request.query.account_referer
    }

    private get targetModuleCode(): string {
        return this.request.query.client_module_code
    }
}