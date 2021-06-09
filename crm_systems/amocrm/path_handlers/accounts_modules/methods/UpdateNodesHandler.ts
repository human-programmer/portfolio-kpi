import {Amocrm} from "../../../interface/AmocrmInterfaces";
import INodeUpdateData = Amocrm.INodeUpdateData;
import IAccount = Amocrm.IAccount;
import IModule = Amocrm.IModule;
import {AmocrmModules} from "../../../components/modules/AmocrmModules";
import {AmocrmAccounts} from "../../../components/accounts/AmocrmAccounts";
import {IBasic} from "../../../../../generals/IBasic";
import IError = IBasic.IError;
import {AmocrmAccountsModules} from "../../../components/accounts_modules/AmocrmAccountsModules";
import Errors = IBasic.Errors;
import IInputNodesRequest = Amocrm.IInputNodesRequest;
import {PragmaHandler} from "../../../../pragma/path_handlers/PragmaHandler";
import IUpdateNodeQuery = Amocrm.IUpdateNodeQuery;
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;


export class UpdateNodesHandler extends PragmaHandler{
    readonly availableMethods: string[] = ['update']
    readonly request: IInputNodesRequest
    constructor(request: any) {
        super(request)
        this.request = UpdateNodesHandler.requestFormatting(request)
    }

    async execute(): Promise<Array<IAmocrmNodeStruct>|IError> {
        return await this.valid() || await this._execute()
    }

    private static requestFormatting(request: any): IInputNodesRequest {
        request = super.basicRequestFormatting(request)
        request.query = UpdateNodesHandler.queryFormatting(request.query)
        return request
    }

    private static queryFormatting(query: any): IUpdateNodeQuery {
        query.data = query.data instanceof Object ? query.data : {}
        query.data = UpdateNodesHandler.dataFormatting(query.data)
        return query
    }

    private static dataFormatting(data: any): INodeUpdateData {
        data.pragma_module_id = Number.parseInt(data.pragma_module_id) || 0
        data.pragma_account_id = Number.parseInt(data.pragma_account_id) || 0
        data.amocrm_disabled = !!data.amocrm_disabled
        return data
    }

    private async valid(): Promise<IError|null> {
        if(!this.data.pragma_module_id)
            return Errors.invalidRequest('query.data.pragma_module_id is missing')
        if(!this.data.pragma_account_id)
            return Errors.invalidRequest('query.data.pragma_account_id is missing')
        return null
    }

    private get shutdownTime(): number {
        // @ts-ignore
        return this.issetShutdownTime ? Number.parseInt(this.data.shutdown_time) : 0
    }

    private get issetShutdownTime(): boolean {
        return "shutdown_time" in this.data
    }

    private get amocrmDisabled(): boolean {
        return this.data.amocrm_disabled
    }

    private get data(): INodeUpdateData{
        return "data" in this.request.query ? this.request.query.data : {}
    }

    private async _execute(): Promise<Array<IAmocrmNodeStruct>> {
        const {module, account} = await this.getAll()
        const node = await AmocrmAccountsModules.self.getAccountModule(module, account)
        this.issetShutdownTime && await node.changeShutdownTimeSec(this.shutdownTime)
        this.amocrmDisabled && await node.setAmocrmEnable(false)
        return [node.publicModel]
    }

    private async getAll(): Promise<any> {
        const modAndAcc = await Promise.all([
            this.getModule(),
            this.getAccount()
        ])
        return {
            module: modAndAcc[0],
            account: modAndAcc[1],
        }
    }

    private async getAccount(): Promise<IAccount> {
        return await AmocrmAccounts.self.getAccount(this.data.pragma_account_id)
    }

    private async getModule(): Promise<IModule> {
        return await AmocrmModules.self.getModule(this.data.pragma_module_id)
    }
}