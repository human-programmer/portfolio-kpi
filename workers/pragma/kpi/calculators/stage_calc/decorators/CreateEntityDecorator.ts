import {AStageDecorator, AtomFieldStageCalc} from "../StageCalculator";
import {Generals} from "../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import {IKPI} from "../../../IKPI";
import EventName = IKPI.EventName;
import IEvent = IKPI.IEvent;

export class CreateEntityDecorator extends AStageDecorator {
    readonly event_names: EventName[] = [EventName.lead_added, EventName.company_added, EventName.contact_added]

    protected createFieldStageCalculator(): AtomFieldStageCalc {
        return undefined;
    }

    protected isEventOwner(event: IEvent): boolean {
        return this.event_names.indexOf(event.name) !== -1
    }
}