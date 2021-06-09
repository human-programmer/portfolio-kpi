import {IServer} from "../../server/intrfaces";
import IWorkerMessage = IServer.IWorkerMessage;
import {Configs} from "../../generals/Configs";

export abstract class MainWorker {
    protected abstract apiHandler(message: IWorkerMessage): Promise<void>
    protected abstract readonly className: string

    protected constructor() {}

    handler = async (message: IWorkerMessage): Promise<void> => {
        const method = typeof message.body === 'object' ? message.body.method : ''
        const entity = message.body.entity
        console.log('Income message ' + this.className + ' ' + method + ' -> ' + entity)
        if(this.isApiMessage(message))
            return await this.apiHandler(message)
        return this.innerMessageHandler(message)
    }

    protected isApiMessage(message: IWorkerMessage): boolean {
        return !!message.requestId
    }

    protected innerMessageHandler(message: IWorkerMessage): void {
        if(message.type === 'configs')
            Configs.setConfigsModel(message.body)
    }
}