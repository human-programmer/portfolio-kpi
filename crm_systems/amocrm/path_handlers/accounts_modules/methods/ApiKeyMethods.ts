import {PragmaHandler} from "../../../../pragma/path_handlers/PragmaHandler";
import {IBasic} from "../../../../../generals/IBasic";
import Errors = IBasic.Errors;
import {IMain} from "../../../../main/interfaces/MainInterface";
import IApiKeyRequest = IMain.IApiKeyRequest;
import IApiKeyAnswer = IMain.IApiKeyAnswer;
import {AmocrmAccounts} from "../../../components/accounts/AmocrmAccounts";
import {Amocrm} from "../../../interface/AmocrmInterfaces";
import IAccountModule = Amocrm.IAccountModule;
import IAccount = Amocrm.IAccount;
import {AmocrmModules} from "../../../components/modules/AmocrmModules";
import IModule = Amocrm.IModule;
import {AmocrmAccountsModules} from "../../../components/accounts_modules/AmocrmAccountsModules";

export class ApiKeyMethods extends PragmaHandler {
    readonly availableMethods: Array<string> = ['create.inactive.api.key', 'check.api.key']
    readonly request: IApiKeyRequest

    constructor(request: any) {
        super(request)
        this.request = ApiKeyMethods.requestFormatting(request)
    }

    async execute(): Promise<IApiKeyAnswer> {
        await this.validRequest()
        switch (this.actualMethod){
            case 'check.api.key':
                return await this.checkApiKey()
            case 'create.inactive.api.key':
                return await this.createApiKey()
            default:
                throw Errors.invalidRequestMethod(this.actualMethod)
        }
    }

    private get targetAccountId(): number {
        return this.request.query.pragma_account_id
    }

    private get targetModuleCode(): string {
        return this.request.query.client_module_code
    }

    private get targetUserId(): number {
        return this.request.query.pragma_user_id
    }

    private get targetApiKey(): string {
        return this.request.query.api_key
    }

    private async validRequest(): Promise<void> {
        await this.requestValidator()
        switch (this.actualMethod){
            case 'create.inactive.api.key':
                if(!this.targetUserId)
                    throw Errors.invalidRequest('pragma_user_id is missing')
            case 'check.api.key':
                if(!this.targetAccountId)
                    throw Errors.invalidRequest('pragma_account_id is missing')
                break
            default:
                throw Errors.invalidRequestMethod(this.actualMethod)
        }
    }

    private async createApiKey(): Promise<IApiKeyAnswer> {
        const node = await this.getTargetNode()
        return {api_key: await node.createInactiveApiKey(this.targetUserId)}
    }

    private async checkApiKey(): Promise<IApiKeyAnswer> {
        if(!this.targetApiKey) return {status:'fail'}
        const node = await this.getTargetNode()
        const flag = await node.checkApiKey(this.targetApiKey)
        return {status: flag ? 'success' : 'fail'}
    }

    private async getTargetNode(): Promise<IAccountModule> {
        const account = await this.getTargetAccount()
        const module = await this.getTargetModule()
        const node = await AmocrmAccountsModules.self.getAccountModule(module, account)
        if(node) return node
        throw Errors.invalidRequest('This node is not exists')
    }

    private async getTargetAccount(): Promise<IAccount> {
        return await AmocrmAccounts.self.getAccount(this.targetAccountId)
    }

    private async getTargetModule(): Promise<IModule> {
        const module = await AmocrmModules.self.findByCode(this.targetModuleCode)
        if(module) return module
        throw Errors.invalidRequest('Module not found "' + this.targetModuleCode + '"')
    }

    private static requestFormatting(request: any): IApiKeyRequest {
        request = super.basicRequestFormatting(request)
        request.query = ApiKeyMethods.queryFormatting(request.query)
        return request
    }

    private static queryFormatting(query: any): IApiKeyRequest {
        query.pragma_account_id = Number.parseInt(query.pragma_account_id)
        query.pragma_user_id = Number.parseInt(query.pragma_user_id)
        query.api_key = '' + query.api_key
        return query
    }
}