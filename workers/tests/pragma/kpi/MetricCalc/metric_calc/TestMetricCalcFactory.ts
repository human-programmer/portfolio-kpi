import {MetricCalc} from "../../../../../pragma/kpi/calculators/metric_calc/MetricCalc";
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import MetricName = IKPI.MetricName;
import IPhoto = IKPI.IPhoto;
import {AMetricCalcDecorator} from "../../../../../pragma/kpi/calculators/metric_calc/AMetricCalcDecorator";
import IAtomValues = IKPI.IAtomValues;
import {TestFullStageFactory} from "../../full_stage/full_stage/TestFullStageFactory";

export class TestMetricCalcFactory {
    static emptyTestMetricCalc(): TestMetricCalc {
        const accStage = TestFullStageFactory.emptyFullStage()
        return new TestMetricCalc(accStage)
    }
}

export class TestMetricCalc extends MetricCalc {

    createCalculator(metricNames: MetricName[]): AMetricCalcDecorator|null {
        return super.createCalculator(metricNames)
    }

    calcOnDay(calculator: AMetricCalcDecorator, photosTimeGroup: IPhoto[][]): IAtomValues[] {
        return super.calcOnDay(calculator, photosTimeGroup)
    }

    static getTargetDecorators(metricNames: MetricName[]): any[] {
        return super.getTargetDecorators(metricNames)
    }

    static get decorators(): any[] {
        return super.decorators
    }

    static groupByAtom(photos: IPhoto[]): IPhoto[][] {
        return super.groupByAtom(photos)
    }
}