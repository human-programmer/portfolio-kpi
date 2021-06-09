import {AmocrmAccountsModules} from "../../../components/accounts_modules/AmocrmAccountsModules";
import {AmocrmModules} from "../../../components/modules/AmocrmModules";
import {AmocrmAccounts} from "../../../components/accounts/AmocrmAccounts";
import {Amocrm} from "../../../interface/AmocrmInterfaces";
import {IBasic} from "../../../../../generals/IBasic";
import IError = IBasic.IError;
import Errors = IBasic.Errors;
import IInputNodesRequest = Amocrm.IInputNodesRequest;
import IInstallNodeQuery = Amocrm.IInstallNodeQuery;
import {PragmaHandler} from "../../../../pragma/path_handlers/PragmaHandler";

export class InstallNodeHandler extends PragmaHandler{
    readonly availableMethods: string[] = ['install']
    readonly request: IInputNodesRequest

    constructor(request: IInputNodesRequest) {
        super(request)
        this.request = InstallNodeHandler.requestFormatting(request)
    }

    private static requestFormatting(request: any): IInputNodesRequest {
        request = super.basicRequestFormatting(request)
        request.query = InstallNodeHandler.queryFormatting(request.query)
        return request
    }

    private static queryFormatting(query: any): IInstallNodeQuery {
        query.code = query.code || ''
        query.referer = query.referer || ''
        query.client_id = query.client_id || ''
        query.from_widget = query.from_widget || ''
        return query
    }

    async execute(): Promise<any|IError> {
        return await this.validQuery() || await this._execute()
    }

    async _execute(): Promise<any|IError> {
        const {module, account, error} = await this.getModuleAndAccount()
        if(error) return error
        const node = await AmocrmAccountsModules.self.getAccountModule(module, account)
        await node.amocrmInstall(this.code)
        return [node.publicModel]
    }

    private async getModuleAndAccount(): Promise<any|IError> {
        const moduleAndAccount = await Promise.all([
            AmocrmModules.self.findByAmocrmId(this.client_id),
            AmocrmAccounts.self.createAnGetAccountByReferer(this.referer)
        ])
        if(!moduleAndAccount[0])
            return {error: Errors.invalidRequest('Integration "' + this.client_id + '" not found')}
        return {
            module: moduleAndAccount[0],
            account: moduleAndAccount[1]
        }
    }

    private async validQuery(): Promise<IError|null> {
        if(!this.code)
            return Errors.invalidRequest('query.code field is missing')
        if(!this.referer)
            return Errors.invalidRequest('query.referer field is missing')
        if(!this.client_id)
            return Errors.invalidRequest('query.client_id field is missing')
        return null
    }

    private get code(): string {
        return "code" in this.request.query ? this.request.query.code : ''
    }

    private get referer(): string {
        return "referer" in this.request.query ? this.request.query.referer : ''
    }

    private get client_id(): string {
        return "client_id" in this.request.query ? this.request.query.client_id : ''
    }
}