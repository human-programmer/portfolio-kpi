import {AmoBasicDecorator, AmoEventValueName} from "../AmoBasicConverter";
import {IEvents} from "../../../../../pragma/kpi/IEvents";
import {IAmocrmEvents} from "../../IAmocrmEvents";
import IEventValues = IEvents.IEventValues;
import AmoEventName = IAmocrmEvents.AmoEventName;
import EventName = IEvents.EventName;

export class PriceChangedDecorator extends AmoBasicDecorator {
    protected readonly amoEventName: AmoEventName = AmoEventName.price_changed
    readonly eventName: EventName = EventName.price_changed

    protected async fetchValues(values: any): Promise<IEventValues> {
        return {values: [PriceChangedDecorator.fetchValue(values)]}
    }

    private static fetchValue(values: any): number {
        const value = AmoBasicDecorator.fetchFirstObject(values, AmoEventValueName.price)
        return Number.parseFloat(value.sale || 0)
    }
}