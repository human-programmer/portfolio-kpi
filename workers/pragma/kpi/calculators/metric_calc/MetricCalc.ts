import {IEvents} from "../../IEvents";
import IMetricCalc = IEvents.IMetricCalc;
import {IKPI} from "../../IKPI";
import IFullStage = IEvents.IFullStage;
import MetricName = IKPI.MetricName;
import {LeadsPriceCalc} from "./decorators/PriceCalc";
import IAtomValues = IKPI.IAtomValues;
import IPhoto = IKPI.IPhoto;
import {AMetricCalcDecorator} from "./AMetricCalcDecorator";
import {ConversionCalc} from "./decorators/ConversionCalc";

export class MetricCalc implements IMetricCalc {
    readonly fullStage: IFullStage

    constructor(fullStage: IFullStage) {
        this.fullStage = fullStage
    }

    calcAsOneDay(photos: IPhoto[], metricNames: MetricName[]): IAtomValues[]{
        if(!photos.length || !metricNames.length) return []
        const calculator = this.createCalculator(metricNames)
        if(!calculator) return []
        const sortedPhotos = MetricCalc.groupByAtom(photos)
        return this.calcOnDay(calculator, sortedPhotos)
    }

    protected createCalculator(metricNames: MetricName[]): AMetricCalcDecorator|null {
        const targetClasses = MetricCalc.getTargetDecorators(metricNames)
        let calc
        targetClasses.forEach(class_name => calc = new class_name(this.fullStage, calc))
        return calc
    }

    protected calcOnDay(calculator: AMetricCalcDecorator, photosTimeGroup: IPhoto[][]): IAtomValues[] {
        return photosTimeGroup.flatMap(photosOnAtom => calculator.calc(photosOnAtom))
    }

    protected static getTargetDecorators(metricNames: MetricName[]): any[] {
        return MetricCalc.decorators.filter(dec => metricNames.find(metricName => dec.isMetricOwner(metricName)))
    }

    protected static get decorators(): any[] {
        return [
            LeadsPriceCalc,
            ConversionCalc,
        ]
    }

    protected static groupByAtom(photos: IPhoto[]): IPhoto[][] {
        const group: object = {}
        photos.forEach(photo => {
            let list = group[photo.atom_id]
            if(!list)
                group[photo.atom_id] = list = []
            list.push(photo)
        })
        return Object.values(group)
    }
}