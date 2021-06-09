import {IKPI} from "../../IKPI";
import IPhoto = IKPI.IPhoto;
import MetricName = IKPI.MetricName;
import {IEvents} from "../../IEvents";
import IFullStage = IEvents.IFullStage;
import IAtomValues = IKPI.IAtomValues;
import StageFieldName = IKPI.StageFieldName;
import ValueName = IKPI.ValueName;


export abstract class AMetricCalcDecorator {
    protected abstract calcLowLevelBranch(photos: IPhoto[]): object

    abstract readonly metricName: MetricName

    protected readonly calculator: AMetricCalcDecorator
    protected readonly fullStage: IFullStage

    constructor(fullStage: IFullStage, calculator: AMetricCalcDecorator) {
        this.fullStage = fullStage
        this.calculator = calculator
    }

    calc(photos: IPhoto[]): IAtomValues[] {
        const next = this.calcNext(photos)
        next.push(this.calcOwn(photos))
        return next
    }

    private calcNext(photos: IPhoto[]): IAtomValues[] {
        return this.calculator ? this.calculator.calc(photos) : []
    }

    protected calcOwn(photos: IPhoto[]): IAtomValues {
        return {
            metric_name: this.metricName,
            pipeline_id: photos.length ? photos[0].pipeline_id : 0,
            status_id: photos.length ? photos[0].status_id : 0,
            user_id: photos.length ? photos[0].user_id : 0,
            values: this.calcLowLevelBranch(photos)
        }
    }

    static metricQuantityValues(photos: IPhoto[], valueName: ValueName): number {
        return photos.flatMap(i => i.metric_values[valueName] || []).length
    }

    static metricSum(photos: IPhoto[], valueName: ValueName): number {
        const values = photos.flatMap(i => i.metric_values[valueName] || [])
        return AMetricCalcDecorator.sum(values)
    }

    static metricMax(photos: IPhoto[], valueName: ValueName): number {
        const values = photos.flatMap(i => i.metric_values[valueName] || [])
        return AMetricCalcDecorator.max(values)
    }

    static listQuantityValues(photos: IPhoto[], listName: StageFieldName): number {
        return photos.flatMap(i => i.values_lists[listName] || []).length
    }

    static listQuantityNZeroValues(photos: IPhoto[], listName: StageFieldName): number {
        return photos.flatMap(i => i.values_lists[listName] || []).filter(i => i).length
    }

    static listMinNZero(photos: IPhoto[], listName: StageFieldName): number {
        const values = photos.flatMap(i => i.values_lists[listName] || []).filter(i => i)
        return AMetricCalcDecorator.min(values)
    }

    static min(values: number[]): number {
        if(!values.length) return 0
        return Math.min(...values)
    }

    static listMax(photos: IPhoto[], listName: StageFieldName): number {
        const values = photos.flatMap(i => i.values_lists[listName] || [])
        return AMetricCalcDecorator.max(values)
    }

    static max(values: number[]): number {
        if(!values.length) return 0
        return Math.max(...values)
    }

    static listSum(photos: IPhoto[], listName: StageFieldName): number {
        if(!photos.length) return 0
        const values = photos.flatMap(i => i.values_lists[listName] || [])
        return AMetricCalcDecorator.sum(values)
    }

    static counterSum(photos: IPhoto[], counterName: StageFieldName): number {
        if(!photos.length) return 0
        const values = photos.map(i => i.counters_values[counterName] || 0)
        return AMetricCalcDecorator.sum(values)
    }

    static sum(values: number[]): number {
        if(!values.length) return 0
        return values.reduce((a, b) => a + b)
    }
}