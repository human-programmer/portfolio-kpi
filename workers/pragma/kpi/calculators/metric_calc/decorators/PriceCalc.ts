import {IKPI} from "../../../IKPI";
import {Generals} from "../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import MetricName = IKPI.MetricName;
import IPhoto = IKPI.IPhoto;
import StageFieldName = IKPI.StageFieldName;
import ValueName = IKPI.ValueName;
import {AMetricCalcDecorator} from "../AMetricCalcDecorator";

export class LeadsPriceCalc extends AMetricCalcDecorator {
    readonly metricName: MetricName = MetricName.price

    calcLowLevelBranch(photos: IPhoto[]): object {
        const ownPhotos = photos.filter(i => i.entity_type === EntityGroup.leads)
        return {
            [ValueName.sum]: LeadsPriceCalc.listSum(ownPhotos, StageFieldName.price),
            [ValueName.max]: LeadsPriceCalc.listMax(ownPhotos, StageFieldName.price),
            [ValueName.counter]: LeadsPriceCalc.listQuantityValues(ownPhotos, StageFieldName.price),
            [ValueName.min_nzero]: LeadsPriceCalc.listMinNZero(ownPhotos, StageFieldName.price),
            [ValueName.counter_nzero]: LeadsPriceCalc.listQuantityNZeroValues(ownPhotos, StageFieldName.price),
        }
    }

    static isMetricOwner(metricName: MetricName): boolean {
        return metricName === MetricName.price
    }
}