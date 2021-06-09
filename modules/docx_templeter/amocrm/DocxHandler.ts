import {IServer} from "../../../server/intrfaces";
import IInputRequest = IServer.IInputRequest;
import IResult = IServer.IResult;
import {Interfaces} from "./vendor/Interfaces";
import IOtherParams = Interfaces.IOtherParams;
import {IBasic} from "../../../crm_systems/main/path_handlers/BasicHandler";
import Errors = IBasic.Errors;
import {createDoc} from "./vendor/generator";
import Error = IBasic.Error;
import Result = IServer.Result;

interface IInputData {
    readonly template: any
    readonly params: IOtherParams
}

export class DocxHandler {
    static async execute(request: IInputRequest): Promise<IResult> {
        try {
            const data = DocxHandler.fetchInputData(request)
            DocxHandler.validInputData(data)
            DocxHandler.formattingParams(data.params)
            const doc = await createDoc(data.template, data.params)
            return new Result(doc, true)
        } catch (e) {
            const error = e instanceof Error ? e : Errors.internalError(e)
            return new Result(error)
        }
    }

    private static fetchInputData(request: IInputRequest): IInputData {
        return request.query.data
    }

    private static validInputData(data: any): void {
        if(typeof data !== 'object')
            throw Errors.invalidRequest('Invalid data')
        if(typeof data.template !== 'string')
            throw Errors.invalidRequest('Invalid data.template')
        if(typeof data.params !== 'object')
            throw Errors.invalidRequest('Invalid data.params')
    }

    private static formattingParams(data: IOtherParams|any): void {
        data.managers = Array.isArray(data.managers) ? data.managers : []
        data.entities = Array.isArray(data.entities) ? data.entities : []
        data.customFields = Array.isArray(data.customFields) ? data.customFields : []
    }
}