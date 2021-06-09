import {AmoBasicDecorator, AmoEventValueName} from "../AmoBasicConverter";
import {IEvents} from "../../../../../pragma/kpi/IEvents";
import EventName = IEvents.EventName;
import {IAmocrmEvents} from "../../IAmocrmEvents";
import AmoEventName = IAmocrmEvents.AmoEventName;
import IEventValues = IEvents.IEventValues;

export class ResponsibleChangedDecorator extends AmoBasicDecorator {
    protected amoEventName: AmoEventName = AmoEventName.responsible_changed
    readonly eventName: EventName = EventName.responsible_changed

    protected async fetchValues(values: any): Promise<IEventValues> {
        return {
            values: [this.fetchValue(values)]
        }
    }

    private fetchValue(values: any): number {
        const value = AmoBasicDecorator.fetchFirstObject(values, AmoEventValueName.responsible_user)
        const amo_user_id = Number.parseInt(value.id || 0)
        return amo_user_id ? this.amocrmInterfaceFabric.users.findPragmaId(amo_user_id) : 0
    }
}