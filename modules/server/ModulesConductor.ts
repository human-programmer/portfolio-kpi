import {BasicConductor} from "../../generals/BasicConductor";
import {IServer} from "../../server/intrfaces";
import Result = IServer.Result;
import {IBasic} from "../../crm_systems/main/path_handlers/BasicHandler";
import Errors = IBasic.Errors;
import IResult = IServer.IResult;
import IInputRequest = IServer.IInputRequest;
import {DocxHandler} from "../docx_templeter/amocrm/DocxHandler";

export class ModulesConductor extends BasicConductor{
    static handler = async (req, res) => {
        console.log('input')
        BasicConductor.requestFormatting(req)
        let answer
        try{
            answer = await ModulesConductor.executeRequest(req)
            if(answer.result.error)
                res.status(400)
        } catch (error) {
            res.status(400)
            answer = new Result(Errors.internalError(error))
        } finally {
            answer.isFile || res.send(answer)
            answer.isFile && res.send(answer.result)
        }
    }

    static async executeRequest(request: any): Promise<IResult> {
        const inputRequest = BasicConductor.fetchRequest(request)
        return await ModulesConductor._handler(inputRequest)
    }

    private static async _handler(inputRequest: IInputRequest): Promise<IResult> {
        switch (inputRequest.entity) {
            case 'docx':
                return await DocxHandler.execute(inputRequest)
            default:
                return new Result(Errors.invalidRequest('Unknown crm_name in route "' + inputRequest.crmName + '"'))
        }
    }
}