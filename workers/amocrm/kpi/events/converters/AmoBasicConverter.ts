import {IEvents} from "../../../../pragma/kpi/IEvents";
import IEvent = IEvents.IEvent;
import IBasicEvent = IEvents.IBasicEvent;
import {IKPI} from "../../../../pragma/kpi/IKPI";
import EventName = IEvents.EventName;
import {IBasic} from "../../../../../generals/IBasic";
import Errors = IBasic.Errors;
import IEventsConvertersFabric = IEvents.IEventsConverterFabric;
import {IEntityInterfaces} from "../../../../../crm_systems/main/interfaces/IEntityInterfaces";
import ICrmInterfaceFabric = IEntityInterfaces.ICrmInterfaceFabric;
import ICrmInterfaces = IEntityInterfaces.ICrmInterfaces;
import IConverter = IEvents.IConverter;
import {IAmocrmEvents} from "../IAmocrmEvents";
import AmoEventName = IAmocrmEvents.AmoEventName;
import {StatusChangedDecorator} from "./decorators/StatusChangedDecorator";
import {ResponsibleChangedDecorator} from "./decorators/ResponsibleChangedDecorator";
import {
    CompanyAdded,
    CompanyDeleted,
    ContactAdded,
    ContactDeleted,
    CustomerAdded, CustomerDeleted,
    LeadAdded,
    LeadDeleted
} from "./decorators/AddedDeleted";
import MetricName = IKPI.MetricName;
import {Generals} from "../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import IEventValuesModel = IEvents.IEventValuesModel;
import IEventValues = IEvents.IEventValues;
import {PriceChangedDecorator} from "./decorators/PriceChangedDecorator";

export enum AmoEventValueName {
    lead_status = 'lead_status',
    responsible_user = 'responsible_user',
    price = 'sale_field_value',
}

export abstract class AmoBasicConverter implements IConverter{
    protected abstract amoEventName: AmoEventName
    protected abstract readonly eventName: EventName
    abstract convert(amocrmEvents: any[]): Promise<IEvent[]>
    protected readonly amocrmInterfaceFabric: ICrmInterfaceFabric

    constructor(amocrmInterfaceFabric: ICrmInterfaceFabric) {
        this.amocrmInterfaceFabric = amocrmInterfaceFabric
    }

    protected async forceBasicConvert(amocrmEvent: any): Promise<IBasicEvent>{
        const basic = await this.basicConvert(amocrmEvent)
        if(!basic) throw Errors.internalError('failed to convert amocrm event')
        return basic
    }

    protected async basicConvert(amocrmEvent: any): Promise<IBasicEvent|null> {
        if(!amocrmEvent || this.eventName) return null;
        amocrmEvent = typeof amocrmEvent === "object" ? amocrmEvent : {}
        return {
            entity_type: this.fetchEntityGroup(amocrmEvent),
            entity_id: await this.fetchEntityId(amocrmEvent),
            name: this.eventName,
            time: AmoBasicConverter.fetchTimeCreate(amocrmEvent),
            user_id: this.fetchUserId(amocrmEvent)
        }
    }

    protected async fetchEntityId(amocrmEvent: any): Promise<number> {
        const entity_id = Number.parseInt(amocrmEvent.entity_id) || 0
        if(!entity_id || !amocrmEvent.entity_type) return 0
        const interfaces = this.findInterfacesFabricByEntity(amocrmEvent.entity_type)
        if(!interfaces) return 0
        return await interfaces.getOrCreate(entity_id)
    }

    protected findInterfacesFabricByEntity(entity_type: any): ICrmInterfaces|null {
        if(!entity_type) return null;
        switch (entity_type) {
            case 'lead':
                return this.amocrmInterfaceFabric.leads
            case 'contact':
                return this.amocrmInterfaceFabric.contacts
            case 'company':
                return this.amocrmInterfaceFabric.companies
            case 'customer':
                return this.amocrmInterfaceFabric.customers
            default:
                return null
        }
    }

    protected fetchEntityGroup(amocrmEvent: any): EntityGroup|null {
        if(!amocrmEvent.entity_type) return null;
        switch (amocrmEvent.entity_type) {
            case 'lead':
                return EntityGroup.leads
            case 'contact':
                return EntityGroup.contacts
            case 'company':
                return EntityGroup.companies
            case 'customer':
                return EntityGroup.customers
            default:
                return null
        }
    }

    protected static fetchTimeCreate(amocrmEvent: any): number {
        return Number.parseInt(amocrmEvent.created_at) || 0
    }

    protected fetchUserId(amocrmEvent: any): number {
        return this.amocrmInterfaceFabric.users.findPragmaId(amocrmEvent.created_by) || 0
    }
}

export class DefaultEventsConverter extends AmoBasicConverter {
    protected amoEventName: AmoEventName;
    protected readonly eventName: IEvents.EventName;

    async convert(amocrmEvents: any[]): Promise<IEvents.IEvent[]> {
        return [];
    }
}

export class AmoEventsConverterFabric implements IEventsConvertersFabric {
    protected readonly interfaces: ICrmInterfaceFabric
    protected readonly decorators: any = [
        PriceChangedDecorator,
        StatusChangedDecorator,
        ResponsibleChangedDecorator,
        LeadAdded,
        LeadDeleted,
        ContactAdded,
        ContactDeleted,
        CompanyAdded,
        CompanyDeleted,
        CustomerAdded,
        CustomerDeleted,
    ]

    constructor(amoInterfacesFabric: ICrmInterfaceFabric) {
        this.interfaces = amoInterfacesFabric
    }

    createConverter(metricNames: MetricName[]): IConverter {
        let converter = new DefaultEventsConverter(this.interfaces)
        this.decorators.forEach(i => converter = new i(this.interfaces, converter))
        return converter
    }
}

export abstract class AmoBasicDecorator extends AmoBasicConverter {
    protected abstract amoEventName: AmoEventName
    abstract readonly eventName: EventName
    protected readonly converter: IConverter
    protected abstract fetchValues(values: any): Promise<IEventValues>

    constructor(amocrmInterfaceFabric: ICrmInterfaceFabric, converter: IConverter) {
        super(amocrmInterfaceFabric)
        this.converter = converter
    }

    async convert(amocrmEvents: any[]): Promise<IEvent[]> {
        const {own_events, next_events} = this.sortEvents(amocrmEvents)
        const nextEvents = this.sendForNextConvert(next_events)
        const ownEvents = this.sendForOwnConvert(own_events)
        const arr = await Promise.all([nextEvents, ownEvents])
        return [].concat(...arr[0], ...arr[1])
    }

    private async sendForNextConvert(next_events: any[]): Promise<IEvent[]> {
        return next_events.length ? await this.converter.convert(next_events) : []
    }

    private async sendForOwnConvert (own_events: any[]): Promise<IEvent[]> {
        return own_events.length ? await this.ownConverter(own_events) : []
    }

    protected sortEvents(events: any[]): any {
        const res = {own_events: [], next_events: []}
        events.forEach(i => {
            if(i.type !== this.amoEventName)
                res.next_events.push(i)
            else
                res.own_events.push(i)
        })
        return res
    }

    protected async ownConverter(allEvents: any[]): Promise<IEvent[]> {
        return Promise.all(allEvents.map(i => this._convert(i)))
    }

    protected async _convert(amocrmEvent: any): Promise<IEvent> {
        const res = await Promise.all([
            this.forceBasicConvert(amocrmEvent),
            this.fetchEventValues(amocrmEvent)
        ])
        return Object.assign(res[0], res[1])
    }

    protected async fetchEventValues (event: any): Promise<IEventValuesModel> {
        return {
            values_after: await this.fetchValuesAfter(event),
            values_before: await this.fetchValuesBefore(event)
        }
    }

    protected async fetchValuesBefore(amocrmEvent: any): Promise<IEventValues> {
        return await this.fetchValues(amocrmEvent.value_before)
    }

    protected async fetchValuesAfter(amocrmEvent: any): Promise<IEventValues> {
        return await this.fetchValues(amocrmEvent.value_after)
    }

    protected static fetchFirstObject(values: any, field_name: AmoEventValueName): any|null {
        if(!Array.isArray(values)) return null
        const obj = typeof values[0] === "object" ? values[0][field_name] : null
        return obj || null
    }
}