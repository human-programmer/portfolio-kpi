import {PragmaHandler} from "../PragmaHandler";
import {IServer} from "../../../../server/intrfaces";
import IResult = IServer.IResult;
import Result = IServer.Result;
import {IBasic} from "../../../../generals/IBasic";
import Error = IBasic.Error;
import Errors = IBasic.Errors;
import {GetMethod} from "./GetMethod";
import {CreateMethod} from "./CreateMethod";
import {UpdateMethod} from "./UpdateMethod";
import {ApiKeyMethods} from "../../../amocrm/path_handlers/accounts_modules/methods/ApiKeyMethods";

export class PragmaUsersHandler extends PragmaHandler {
    readonly availableMethods: Array<string> = ['get', 'update', 'create']
    readonly request: any

    static async execute(request: any): Promise<IResult> {
        try {
            return await PragmaUsersHandler._execute(request)
        }catch (e) {
            const error = e instanceof Error ? e : Errors.internalError(e)
            return new Result(error)
        }
    }

    private static async _execute(request: any): Promise<IResult> {
        request = PragmaUsersHandler.requestFormatting(request)
        const handler = new PragmaUsersHandler(request)
        return await handler.requestProcessing()
    }

    private static requestFormatting(request): Promise<any> {
        return super.basicRequestFormatting(request)
    }

    constructor(request: any) {
        super(request)
        this.request = request
    }

    async requestProcessing(): Promise<IResult> {
        switch (this.actualMethod) {
            case 'get':
                return await this.getProcessing()
            case 'update':
                return await this.updateProcessing()
            case 'create':
                return await this.createProcessing()
            default:
                const error = Errors.invalidRequest('Invalid method "' + this.actualMethod + '"')
                return new Result(error)
        }
    }

    private async getProcessing(): Promise<IResult> {
        const handler = new GetMethod(this.request)
        const usersModels = await handler.execute()
        return new Result(usersModels)
    }

    private async updateProcessing(): Promise<IResult> {
        const handler = new UpdateMethod(this.request)
        const usersModels = await handler.execute()
        return new Result(usersModels)
    }

    private async createProcessing(): Promise<IResult> {
        const handler = new CreateMethod(this.request)
        const usersModels = await handler.execute()
        return new Result(usersModels)
    }

    private async apiKeyProcessing(): Promise<IResult> {
        const handler = new ApiKeyMethods(this.request)
        const usersModels = await handler.execute()
        return new Result(usersModels)
    }
}