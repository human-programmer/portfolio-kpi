import {IServer} from "../server/intrfaces";
import IInputRequest = IServer.IInputRequest;

export class BasicConductor {
    protected static requestFormatting(req: any): void {
        let query = {}
        if(Object.keys(req.query || {}).length)
            query = req.query
        else if(Object.keys(req.body || {}).length)
            query = req.body
        else if(Object.keys(req.params || {}).length)
            query = req.params
        req.query = query
    }


    protected static fetchRequest (request: any): IInputRequest {
        // @ts-ignore
        request = request instanceof Object ? request : {}
        request.query = request.query instanceof Object ? request.query : {}
        request.originalUrl = typeof request.originalUrl === 'string' ? request.originalUrl : ''

        const {crmName, entity, method} = BasicConductor.disassemble(request.originalUrl)
        return {
            method,
            crmName,
            entity,
            query: request.query || {}
        }
    }

    private static disassemble(route: string): any {
        const arr = route.split('/').filter(i => i)
        return {
            crmName: arr[0],
            entity: arr[1],
            method: arr[2]
        }
    }
}