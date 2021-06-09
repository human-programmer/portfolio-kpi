import {IKPI} from "../../../IKPI";
import {Generals} from "../../../../../../generals/Interfaces";
import {AMetricCalcDecorator} from "../AMetricCalcDecorator";
import MetricName = IKPI.MetricName;
import IPhoto = IKPI.IPhoto;
import EntityGroup = Generals.EntityGroup;
import ValueName = IKPI.ValueName;

export class ConversionCalc extends AMetricCalcDecorator {
    readonly metricName: MetricName = MetricName.conversion

    calcLowLevelBranch(photos: IPhoto[]): object {
        const ownPhotos = photos.filter(i => i.entity_type === EntityGroup.leads)
        return {
            [ValueName.status_durations] : ConversionCalc.metricSum(ownPhotos, ValueName.status_durations),
            [ValueName.status_cancelled_counter] : ConversionCalc.metricSum(ownPhotos, ValueName.status_cancelled_counter),
            [ValueName.status_output_counter] : ConversionCalc.metricSum(ownPhotos, ValueName.status_output_counter),
        }
    }

    static isMetricOwner(metricName: MetricName): boolean {
        return metricName === MetricName.conversion
    }
}