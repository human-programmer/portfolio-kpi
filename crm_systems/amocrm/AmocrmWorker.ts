import {AmocrmRouter} from "./path_handlers/AmocrmRouter";
import {parentPort} from "worker_threads";
import {IServer} from "../../server/intrfaces";
import IWorkerMessage = IServer.IWorkerMessage;
import {MainWorker} from "../main/MainWorker";

export class AmocrmWorker extends MainWorker{
    private static inst: AmocrmWorker

    static get self(): AmocrmWorker {
        if(AmocrmWorker.inst) return AmocrmWorker.inst
        AmocrmWorker.inst = new AmocrmWorker()
        return AmocrmWorker.inst
    }

    protected async apiHandler(message: IWorkerMessage): Promise<void> {
        const answer = await AmocrmRouter.self.route(message)
        parentPort.postMessage(answer)
    }

    protected get className(): string{
        return AmocrmWorker.name
    }
}