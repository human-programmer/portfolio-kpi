import {IServer} from "../../../server/intrfaces";
import IWorkerMessage = IServer.IWorkerMessage;
import {IBasic} from "../../../generals/IBasic";
import Error = IBasic.Error;
import Errors = IBasic.Errors;
import Result = IServer.Result;
import IInputRequest = IServer.IInputRequest;
import IResult = IServer.IResult;
import TypeWorkerMessage = IServer.TypeWorkerMessage;

export abstract class MainRouter {
    protected abstract execute(request: any): Promise<any>
    protected abstract validRequest(request: any): IResult|null
    protected constructor() {
    }

    async route(workerMessage: IWorkerMessage): Promise<IWorkerMessage> {
        try {
            return await this._route(workerMessage)
        } catch (e) {
            const error = e instanceof Error ? e : Errors.internalError(e)
            const result = new Result(error)
            return this.createAnswer(workerMessage, result)
        }
    }

    async _route(workerMessage: IWorkerMessage): Promise<IWorkerMessage> {
        workerMessage = MainRouter.formattingMessage(workerMessage)
        const result = await this.executeRequest(workerMessage.body)
        return this.createAnswer(workerMessage, result)
    }

    private static formattingMessage(message: any): IWorkerMessage {
        message = message instanceof Object ? message : {}
        message.body = message.body instanceof Object ? message.body : {}
        message.body.query = message.body instanceof Object ? message.body.query : {}
        return message
    }

    protected createAnswer(inputMessage: IWorkerMessage, answer?: any): IWorkerMessage {
        return {
            requestId: inputMessage.requestId,
            type: TypeWorkerMessage.api,
            body: answer || {}
        }
    }

    private async executeRequest(request: IInputRequest): Promise<any> {
        return this.validRequest(request) || await this.execute(request)
    }
}
