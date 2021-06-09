import {MainWorker} from "../main/MainWorker";
import {parentPort} from "worker_threads";
import {IServer} from "../../server/intrfaces";
import IWorkerMessage = IServer.IWorkerMessage;
import {PragmaRouter} from "./path_handlers/PragmaRouter";

export class PragmaWorker extends MainWorker {
    private static inst: PragmaWorker

    static get self(): PragmaWorker {
        if(PragmaWorker.inst) return PragmaWorker.inst
        PragmaWorker.inst = new PragmaWorker()
        return PragmaWorker.inst
    }

    protected async apiHandler(message: IWorkerMessage): Promise<void> {
        const answer = await PragmaRouter.self.route(message)
        parentPort.postMessage(answer)
    }

    protected get className(): string{
        return PragmaWorker.name
    }
}