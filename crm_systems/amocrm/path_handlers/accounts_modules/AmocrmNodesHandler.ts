import {IBasic} from "../../../../generals/IBasic";
import {Amocrm} from "../../interface/AmocrmInterfaces";
import IError = IBasic.IError;
import Errors = IBasic.Errors;
import {IServer} from "../../../../server/intrfaces";
import IResult = IServer.IResult;
import Result = IServer.Result;
import {AmocrmHandler} from "../AmocrmHandler";
import {GetNodeHandler} from "./methods/GetNodeHandler";
import {InstallNodeHandler} from "./methods/InstallNodeHandler";
import Error = IBasic.Error;
import IInputNodesRequest = Amocrm.IInputNodesRequest;
import {UpdateNodesHandler} from "./methods/UpdateNodesHandler";
import {GatewayHandler} from "./methods/GatewayHandler";
import {ApiKeyMethods} from "./methods/ApiKeyMethods";

export class AmocrmNodesHandler extends AmocrmHandler{
    readonly availableMethods: string[] = ['get', 'update', 'install', 'rest.gateway', 'create.inactive.api.key', 'check.api.key']
    readonly request: IInputNodesRequest

    constructor(request: any) {
        super(request)
        this.request = request
    }

    static async execute(request: any): Promise<IResult> {
        try {
            return await AmocrmNodesHandler._nodeExecute(request)
        } catch (e) {
            const error = e instanceof Error ? e : Errors.internalError(e)
            return new Result(error)
        }
    }

    private static async _nodeExecute(request: any): Promise<IResult> {
        request = super.basicRequestFormatting(request)
        const handler = new AmocrmNodesHandler(request)
        const answer = await handler.executeQuery()
        return new Result(answer)
    }

    private async executeQuery(): Promise<any> {
        return await this.validNodeRequest() || await this._executeQuery()
    }

    private async _executeQuery(): Promise<any> {
        switch (this.actualMethod) {
            case 'get':
                return await this.get()
            case 'update':
                return await this.update()
            case 'install':
                return await this.install()
            case 'rest.gateway':
                return await this.gateway()
            case 'create.inactive.api.key':
            case 'check.api.key':
                return await this.apiKeysHandler()
            default:
                return Errors.invalidRequest('Invalid method "' + this.actualMethod + '"')
        }
    }

    private async get(): Promise<any> {
        const error = await this.requestValidator()
        if(error) return error
        const getHandler = new GetNodeHandler(this.request)
        return await getHandler.executeGetQuery()
    }

    private async update(): Promise<any> {
        const handler = new UpdateNodesHandler(this.request)
        return await handler.execute()
    }

    private async install(): Promise<any> {
        const installHandler = new InstallNodeHandler(this.request)
        return await installHandler.execute()
    }

    private async gateway(): Promise<any> {
        const gateway = new GatewayHandler(this.request)
        return await gateway.execute()
    }

    private async apiKeysHandler(): Promise<any> {
        const handler = new ApiKeyMethods(this.request)
        return await handler.execute()
    }

    private async validNodeRequest(): Promise<IError|null> {
        return this.actualMethod !== 'install' &&  await this.requestValidator()
    }
}