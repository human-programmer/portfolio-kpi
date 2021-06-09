import {AStageDecorator, AtomFieldStageCalc} from "../StageCalculator";
import {IEvents} from "../../../IEvents";
import StageFieldName = IEvents.StageFieldName;
import IEvent = IEvents.IEvent;
import {Generals} from "../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import {IKPI} from "../../../IKPI";
import MetricName = IKPI.MetricName;
import EventName = IKPI.EventName;
import IMetric = IEvents.IMetric;

export class PriceStageDecorator extends AStageDecorator{
    readonly event_name: EventName = EventName.price_changed
    readonly groupName: EntityGroup = EntityGroup.leads

    protected createFieldStageCalculator(): AtomFieldStageCalc {
        return new PriceStageCalc(this.acc_stage)
    }

    static isMetricOwner(metric: IMetric): boolean {
        return metric.name === MetricName.price
    }
}

class PriceStageCalc extends AtomFieldStageCalc{
    protected readonly fieldName: StageFieldName = StageFieldName.price
    protected readonly group: EntityGroup = EntityGroup.leads

    protected fetchValueFromEvent(event: IEvent): any {
        return event.values_after.values[0]
    }
}