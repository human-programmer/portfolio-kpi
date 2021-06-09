import {AmoBasicDecorator} from "../AmoBasicConverter";
import {IAmocrmEvents} from "../../IAmocrmEvents";
import AmoEventName = IAmocrmEvents.AmoEventName;
import {IEvents} from "../../../../../pragma/kpi/IEvents";
import EventName = IEvents.EventName;
import IEventValues = IEvents.IEventValues;

abstract class AAddedDeleted extends AmoBasicDecorator{
    protected abstract amoEventName: AmoEventName
    abstract readonly eventName: EventName

    protected async fetchValues(values: any): Promise<IEventValues> {
        return {values: []}
    }
}

export class LeadAdded extends AAddedDeleted {
    protected amoEventName: AmoEventName = AmoEventName.lead_added
    readonly eventName: EventName = EventName.lead_added
}

export class LeadDeleted extends AAddedDeleted {
    protected amoEventName: AmoEventName = AmoEventName.lead_deleted
    readonly eventName: EventName = EventName.lead_deleted
}

export class ContactAdded extends AAddedDeleted {
    protected amoEventName: AmoEventName = AmoEventName.contact_added
    readonly eventName: EventName = EventName.contact_added
}

export class ContactDeleted extends AAddedDeleted {
    protected amoEventName: AmoEventName = AmoEventName.contact_deleted
    readonly eventName: EventName = EventName.contact_deleted
}

export class CompanyAdded extends AAddedDeleted {
    protected amoEventName: AmoEventName = AmoEventName.company_added
    readonly eventName: EventName = EventName.company_added
}

export class CompanyDeleted extends AAddedDeleted {
    protected amoEventName: AmoEventName = AmoEventName.company_deleted
    readonly eventName: EventName = EventName.company_deleted
}

export class CustomerAdded extends AAddedDeleted {
    protected amoEventName: AmoEventName = AmoEventName.customer_added
    readonly eventName: EventName = EventName.customer_added
}

export class CustomerDeleted extends AAddedDeleted {
    protected amoEventName: AmoEventName = AmoEventName.customer_deleted
    readonly eventName: EventName = EventName.customer_deleted
}