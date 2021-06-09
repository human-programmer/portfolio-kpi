import {IBasic} from "../../../../generals/IBasic";
import IError = IBasic.IError;
import Error = IBasic.Error;
import {Accounts} from "../../components/accounts/Accounts";
import {Bitrix24AccountsModules} from "../../components/accounts_modules/AccountsModules";
import {Modules} from "../../components/modules/Modules";
import {Bitrix24} from "../../interface/Bitrix24Interfaces";
import InstallData = Bitrix24.InstallData;
import {Bitrix24Handler} from "../Bitrix24Handler";
import IInputNodeInstallRequest = Bitrix24.IInputNodeInstallRequest;
import {IServer} from "../../../../server/intrfaces";
import IResult = IServer.IResult;
import Errors = IBasic.Errors;
import IModule = Bitrix24.IModule;
import IAccounts = Bitrix24.IAccounts;
import IModules = Bitrix24.IModules;
import {BITRIX24_INSTALL_ROUTE} from "../../BITIX24_CRONSTANTS";
import Result = IServer.Result;
const PATH = BITRIX24_INSTALL_ROUTE

export class InstallRequest extends IBasic.Query implements InstallData{
    readonly accessToken: string
    readonly refreshToken: string
    readonly shutdownTimeSec: number
    readonly memberId: string
    readonly lang: string

    constructor(request) {
        const formatting = {
            client_module_code: request.state,
            account_referer: request.DOMAIN,
        }
        super(formatting)

        this.accessToken = request.AUTH_ID
        this.refreshToken = request.REFRESH_ID
        this.shutdownTimeSec = Math.ceil(new Date().getTime() / 1000 + Number.parseInt(request.AUTH_EXPIRES))
        this.memberId = request.member_id
        this.lang = request.LANG || ''
    }
}

export class Bitrix24InstallHandler extends Bitrix24Handler {
    private installRequest: InstallRequest
    protected static _accounts: IAccounts
    protected static _modules: IModules

    static async execute (request: IInputNodeInstallRequest): Promise<IResult> {
        try {
            return await Bitrix24InstallHandler._execute(request)
        } catch (e) {
            return new Result(Errors.internalError(e))
        }
    }

    private static async _execute (request: IInputNodeInstallRequest): Promise<IResult> {
        let answer: any = await Bitrix24InstallHandler.validRequest(request)
        if(!answer) {
            const installRequest = new InstallRequest(request.query.data)
            const handler = new Bitrix24InstallHandler(installRequest)
            answer = await handler.checkModule() || await handler.requestProcessing()
        }
        return new Result(answer)
    }

    protected constructor(request: InstallRequest) {
        super(PATH, request)
        this.installRequest = request
    }

    async requestProcessing(): Promise<any> {
        const module = await Modules.getModules().getByCode(this.installRequest.client_module_code)
        if(!module)
            return new Error('Module ' + this.installRequest.client_module_code + ' not found', 1102)
        await this.installNode(module)
        return {status: 'installed'}
    }

    private async installNode(module: IModule): Promise<void> {
        const account = await Accounts.getAccounts().createAndGetBitrix24Account(this.installRequest.memberId)
        const accountModule = await Bitrix24AccountsModules.self.accountModule(module.pragmaModuleId, account.pragmaAccountId)
        await Promise.all([
            accountModule.bitrix24Install(this.installRequest),
            this.saveAccount()
        ])
    }

    private async saveAccount(): Promise<void> {
        const bitrix24Account = await Accounts.getAccounts().createAndGetBitrix24Account(this.installRequest.memberId)
        bitrix24Account.setBitrix24Lang(this.installRequest.lang)
        bitrix24Account.setBitrix24Referer(this.installRequest.account_referer)
        await bitrix24Account.saveBitrix24Interface()
    }

    private static async validRequest (request: any): Promise<IError|null> {
        const error = await Bitrix24InstallHandler.requestValidator(request, PATH)
        if(error) return error

        if(!request.query.data)
            return new Error('install params is missing', 1101)

        const installRequest = request.query.data
        return Bitrix24InstallHandler.checkState(installRequest) ||
            Bitrix24InstallHandler.checkDomain(installRequest) ||
            Bitrix24InstallHandler.checkAppSid(installRequest) ||
            Bitrix24InstallHandler.checkAuthId(installRequest) ||
            Bitrix24InstallHandler.checkRefreshId(installRequest) ||
            Bitrix24InstallHandler.checkAuthExpires(installRequest) ||
            Bitrix24InstallHandler.checkMemberId(installRequest)
    }

    private static checkState (request: any): IError|null {
        if(!request.state)
            return new Error('"state" is undefined', 1101)
        return null
    }

    private static checkDomain (request: any): IError|null {
        if(!request.DOMAIN)
            return new Error('"DOMAIN" is undefined', 1101)
        return null
    }

    private static checkAppSid (request: any): IError|null {
        if(!request.APP_SID)
            return new Error('"APP_SID" is undefined', 1101)
        return null
    }

    private static checkAuthId (request: any): IError|null {
        if(!request.AUTH_ID)
            return new Error('"AUTH_ID" is undefined', 1101)
        return null
    }

    private static checkRefreshId (request: any): IError|null {
        if(!request.REFRESH_ID)
            return new Error('"REFRESH_ID" is undefined', 1101)
        return null
    }

    private static checkAuthExpires (request: any): IError|null {
        if(!request.AUTH_EXPIRES)
            return new Error('"AUTH_EXPIRES" is undefined', 1101)
        return null
    }

    private static checkMemberId(request: any): IError|null {
        if(!request.member_id)
            return new Error('"member_id" is undefined', 1101)
        return null
    }

    static isRouteOwner(path: string): boolean {
        return PATH === path
    }
}