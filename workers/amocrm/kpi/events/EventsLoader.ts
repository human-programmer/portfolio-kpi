import {AmocrmLoader} from "../../loaders/AmocrmLoader";
import {IAmocrmLoaders} from "../../interface";
import IAmoJob = IAmocrmLoaders.IAmoJob;
import {IAmocrmEvents} from "./IAmocrmEvents";
import AmoEventName = IAmocrmEvents.AmoEventName;

class EventsLoader extends AmocrmLoader {
    protected readonly route: string = "/api/v4/events"

    constructor(job: IAmoJob, events: AmoEventName[]) {
        super(job);
    }

    protected fetchEntities(body: any): Array<any> {
        return undefined;
    }

    protected saveEntities(entities: Array<any>): Promise<void> {
        return Promise.resolve(undefined);
    }
}