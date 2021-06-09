import {AmoBasicDecorator, AmoEventValueName} from "../AmoBasicConverter";
import {IEvents} from "../../../../../pragma/kpi/IEvents";
import EventName = IEvents.EventName;
import IStatus = IEvents.IStatus;
import IConverter = IEvents.IConverter;
import {IAmocrmEvents} from "../../IAmocrmEvents";
import AmoEventName = IAmocrmEvents.AmoEventName;
import IEventValues = IEvents.IEventValues;

export class StatusChangedDecorator extends AmoBasicDecorator{
    protected amoEventName: AmoEventName = AmoEventName.lead_status_changed
    readonly eventName: EventName = EventName.lead_status_changed

    protected async fetchValues(values: any): Promise<IEventValues> {
        return {values: [this.fetchValue(values)]}
    }

    private fetchValue(values: any): IStatus {
        const amo_status = AmoBasicDecorator.fetchFirstObject(values, AmoEventValueName.lead_status)
        if(!amo_status) return {pipeline_id: 0, status_id: 0}
        const pipeline_id = this.amocrmInterfaceFabric.pipelines.findPragmaId(amo_status.pipeline_id)
        const status_id = this.amocrmInterfaceFabric.pipelines.findPragmaId(amo_status.id)
        return {pipeline_id, status_id}
    }
}