import {IBasic} from "../../../../../generals/IBasic";
import IError = IBasic.IError;
import {AmocrmAccountsModules} from "../../../components/accounts_modules/AmocrmAccountsModules";
import {Amocrm} from "../../../interface/AmocrmInterfaces";
import INodesFilter = Amocrm.INodesFilter;
import Errors = IBasic.Errors;
import Error = IBasic.Error;
import {AmocrmAccounts} from "../../../components/accounts/AmocrmAccounts";
import IAccount = Amocrm.IAccount;
import IInputNodesRequest = Amocrm.IInputNodesRequest;
import {Bitrix24} from "../../../../bitrix24/interface/Bitrix24Interfaces";
import IInputNodeInstallQuery = Bitrix24.IInputNodeInstallQuery;
import {PragmaHandler} from "../../../../pragma/path_handlers/PragmaHandler";
import IModule = Amocrm.IModule;
import {AmocrmModules} from "../../../components/modules/AmocrmModules";

export class GetNodeHandler extends PragmaHandler{
    readonly availableMethods: Array<string> = ['get']
    readonly request: IInputNodesRequest

    constructor(request: any) {
        super(request)
        this.request = GetNodeHandler.requestFormatting(request)
    }

    private static requestFormatting(request: any): IInputNodesRequest {
        request = super.basicRequestFormatting(request)
        request.query = GetNodeHandler.queryFormatting(request.query)
        return request
    }

    private static queryFormatting(query: any): IInputNodeInstallQuery {
        query.filter = query.filter instanceof Object ? query.filter : {}
        query.filter = GetNodeHandler.filterFormatting(query.filter)
        return query
    }

    private static filterFormatting(filter: any): INodesFilter {
        filter.amocrm_referer = this.asUniqueStrings(filter.amocrm_referer)
        filter.amocrm_account_id = this.asUniqueNumbers(filter.amocrm_account_id)
        filter.amocrm_integration_id = this.asUniqueStrings(filter.amocrm_integration_id)
        filter.pragma_account_id = this.asUniqueNumbers(filter.pragma_account_id)
        filter.code = this.asUniqueStrings(filter.code)
        filter.pragma_module_id = this.asUniqueNumbers(filter.pragma_module_id)

        return filter
    }

    async executeGetQuery(): Promise<any|IError> {
        return await this.validNodeRequest() || await this._executeGetQuery()
    }

    private async _executeGetQuery(): Promise<any|IError> {
        const account_flag = this.accountFlag
        const module_flag = this.moduleFlag
        let answer = null

        if(!account_flag && !module_flag)
            answer = await this.allNodes()

        else if(!account_flag)
            answer = await this.allNodesOfModule()

        else if(!module_flag)
            answer = await this.allNodesOfAccount()

        else if(account_flag && module_flag)
            answer = await this.nodes()

        return answer instanceof Error ? answer : (answer || []).map(node => node.publicModel)
    }

    private get accountFlag(): boolean {
        return !!(this.referer.length || this.amocrm_account_id.length || this.pragma_account_id.length)
    }

    private get moduleFlag(): boolean {
        return !!(this.amocrm_integration_id.length || this.code.length || this.pragma_module_id.length)
    }

    private get referer(): Array<string> {
        return this.filter.amocrm_referer || []
    }

    private get amocrm_account_id(): Array<number> {
        return this.filter.amocrm_account_id || []
    }

    private get amocrm_integration_id(): Array<string> {
        return this.filter.amocrm_integration_id || []
    }

    private get pragma_account_id(): Array<number> {
        return this.filter.pragma_account_id || []
    }

    private get code(): Array<string> {
        return this.filter.code || []
    }

    private get pragma_module_id(): Array<number> {
        return this.filter.pragma_module_id || []
    }

    private get filter(): INodesFilter {
        return "filter" in this.request.query ? this.request.query.filter : {}
    }

    private async allNodes(): Promise<any|IError> {
        return Errors.internalError('Method "allNodes" not implemented')
    }

    private async allNodesOfModule(): Promise<any|IError> {
        return Errors.internalError('Method "allNodesOfModule" not implemented')
    }

    private async allNodesOfAccount(): Promise<any|IError> {
        return Errors.internalError('Method "allNodesOfAccount" not implemented')
    }

    private async nodes(): Promise<any> {
        const tuples = await this.getTuples()
        const nodes = AmocrmAccountsModules.self
        const result = await Promise.all(tuples.map(({module, account}) => nodes.findNode(module, account)))
        return result.filter(i => i)
    }

    private async getTuples(): Promise <Array<{account: IAccount, module: IModule}>> {
        const accounts = await this.getUniqueAccounts()
        const modules = await this.getUniqueModules()
        const tuples = []
        accounts.forEach(account => {
            return modules.forEach(module => tuples.push({account, module}))
        })
        return tuples
    }

    protected async getUniqueAccounts(): Promise<Array<IAccount>> {
        const accId = await this.getAccountsById()
        const referer = await this.getAccountsByReferer()
        const byId = await this.getAccountsByPragmaId()
        const accounts = [...accId, ...referer, ...byId].filter(i => i)
        return accounts.filter((acc, index) => accounts.indexOf(acc) === index)
    }

    private async getAccountsById(): Promise<Array<IAccount>> {
        const accounts = AmocrmAccounts.self
        return await Promise.all(this.amocrm_account_id.map(id => accounts.findByAmocrmId(id)))
    }

    private async getAccountsByReferer(): Promise<Array<IAccount>> {
        const accounts = AmocrmAccounts.self
        return await Promise.all(this.referer.map(referer => accounts.findByAmocrmReferer(referer)))
    }

    private async getAccountsByPragmaId(): Promise<Array<IAccount>> {
        const accounts = AmocrmAccounts.self
        return await Promise.all(this.pragma_account_id.map(id => accounts.findAccount(id)))
    }

    private async getUniqueModules(): Promise<Array<IModule>> {
        const byCode = await this.getModulesByCode()
        const byAmoId = await this.getModulesByIntegrationId()
        const modules = [...byCode, ...byAmoId].filter(i => i)
        return modules.filter((i, index) => modules.indexOf(i) === index)
    }

    private async getModulesByCode(): Promise<Array<IModule>> {
        const modules = AmocrmModules.self
        return await Promise.all(this.code.map((code => modules.findByCode(code))))
    }

    private async getModulesByIntegrationId(): Promise<Array<IModule>> {
        const modules = AmocrmModules.self
        return await Promise.all(this.amocrm_integration_id.map((id => modules.findByAmocrmId(id))))
    }

    private async validNodeRequest(): Promise<IError|null> {
        return null
    }
}