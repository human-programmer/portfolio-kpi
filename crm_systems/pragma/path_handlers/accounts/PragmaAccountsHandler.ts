import {PragmaHandler} from "../PragmaHandler";
import {IServer} from "../../../../server/intrfaces";
import IResult = IServer.IResult;
import Result = IServer.Result;
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;
import Error = IBasic.Error;
import {Pragma} from "../../instarface/IPragma";
import IAccountsRequest = Pragma.IAccountsRequest;
import {PragmaAccounts} from "../../components/accounts/Accounts";
import IAccount = Pragma.IAccount;
import {IMain} from "../../../main/interfaces/MainInterface";
import IMainAccountStruct = IMain.IMainAccountStruct;
import {BasicAccountsHandler} from "../../../main/path_handlers/BasicAccountsHandler";

export class PragmaAccountsHandler extends PragmaHandler {
    readonly availableMethods: Array<string> = ['get']
    readonly request: IAccountsRequest

    constructor(request: IAccountsRequest) {
        super(request)
        this.request = request
    }

    static async execute(request: any): Promise<IResult> {
        try {
            return await PragmaAccountsHandler._execute(request)
        } catch (e) {
            const error = e instanceof Error ? e : Errors.internalError(e)
            return new Result(error)
        }
    }

    private static async _execute(request: any): Promise<IResult> {
        request = PragmaAccountsHandler.requestFormatting(request)
        const handler = new PragmaAccountsHandler(request)
        return await handler.requestProcessing()
    }

    protected static requestFormatting(request: any): IAccountsRequest {
        return BasicAccountsHandler.mainRequestFormatting(request)
    }

    async requestProcessing(): Promise<IResult> {
        switch (this.actualMethod) {
            case 'get':
                return await this.get()
            default:
                return new Result(Errors.invalidRequest('Invalid method "' + this.actualMethod + '"'))
        }
    }

    private async get (): Promise<IResult> {
        if(this.pragmaAccountsId.length === 0)
            return await this.getAllAccounts()
        return await this.getTargetAccounts()
    }

    private async getAllAccounts(): Promise<IResult> {
        return new Result(Errors.invalidRequest('Method "getAllAccounts" is not implemented'))
    }

    private async getTargetAccounts(): Promise<IResult> {
        const structs = await this.findAccountStructFromFilter()
        return new Result(structs)
    }

    private async findAccountStructFromFilter():Promise<Array<IMainAccountStruct>> {
        const promises = this.pragmaAccountsId.map(id => PragmaAccountsHandler.findAccount(id))
        const accounts = await Promise.all(promises)
        return accounts.filter(i => i).map(account => account.publicModel)
    }

    private static async findAccount(id: number): Promise<IAccount|null> {
        try {
            return await PragmaAccounts.self.getAccount(id)
        } catch (e) {
            return null
        }
    }

    private get pragmaAccountsId(): Array<number> {
        return this.request.query.filter.pragma_account_id
    }
}