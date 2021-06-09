import {MainWorker} from "../../crm_systems/main/MainWorker";
import {IServer} from "../../server/intrfaces";
import {parentPort} from "worker_threads";
import {WorkersRouter} from "./RequestsConductor";



export class AmoWorkersWorker extends MainWorker {
    private static inst: AmoWorkersWorker

    static get self(): AmoWorkersWorker {
        if(AmoWorkersWorker.inst) return AmoWorkersWorker.inst
        AmoWorkersWorker.inst = new AmoWorkersWorker()
        return AmoWorkersWorker.inst
    }

    protected async apiHandler(message: IServer.IWorkerMessage): Promise<void> {
        const answer = await WorkersRouter.self.route(message)
        parentPort.postMessage(answer)
    }

    protected get className(): string{
        return AmoWorkersWorker.name
    }
}