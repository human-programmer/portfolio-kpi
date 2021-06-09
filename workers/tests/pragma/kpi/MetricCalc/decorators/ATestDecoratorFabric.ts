import {IKPI} from "../../../../../pragma/kpi/IKPI";
import MetricName = IKPI.MetricName;
import IPhoto = IKPI.IPhoto;
import {Generals} from "../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import ValueName = IKPI.ValueName;
import StageFieldName = IKPI.StageFieldName;
import {TestFullStageFactory} from "../../full_stage/full_stage/TestFullStageFactory";
import {IEvents} from "../../../../../pragma/kpi/IEvents";
import IFullStage = IEvents.IFullStage;
import {AMetricCalcDecorator} from "../../../../../pragma/kpi/calculators/metric_calc/AMetricCalcDecorator";
import IAtomValues = IKPI.IAtomValues;

export class ATestDecoratorFabric {
    static createCalc(nesting: number = 0): ATestDecorator {
        const fullStage = TestFullStageFactory.emptyFullStage()
        let calc = new ATestDecorator(fullStage, null)
        for (let i = 0; i < nesting - 1; i++)
            calc = new ATestDecorator(fullStage, calc)
        return calc
    }
}

export class ATestDecorator extends AMetricCalcDecorator {
    readonly calculator: AMetricCalcDecorator
    readonly fullStage: IFullStage
    readonly metricName: MetricName = MetricName.active_leads_counter

    calcLowLevelBranch(photos: IPhoto[]): object {
        const leadPhotos = photos.filter(i => i.entity_type === EntityGroup.leads)
        return {
            [ValueName.counter]: ATestDecorator.counterSum(leadPhotos, StageFieldName.entities_counter),
        }
    }

    calcOwn(photos: IPhoto[]): IAtomValues {
        return super.calcOwn(photos)
    }
}