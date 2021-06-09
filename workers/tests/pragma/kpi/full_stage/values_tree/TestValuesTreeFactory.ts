import {IEvents} from "../../../../../pragma/kpi/IEvents";
import IValuesTreeStruct = IEvents.IValuesTreeStruct;
import IValuesTree = IEvents.IValuesTree;
import {ValuesTree} from "../../../../../pragma/kpi/full_stage/ValuesTree";
import {Func} from "../../../../../../generals/Func";
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import IAtom = IKPI.IAtom;
import IMetricAtom = IKPI.IMetricAtom;
import {TestKpiFactory} from "../../TestKpiFactory";
import IAtomValues = IKPI.IAtomValues;
import ValueName = IKPI.ValueName;
import MetricName = IKPI.MetricName;

export class TestValuesTreeFactory {

    static valuesTestTreeByTime(startTimeMs: number, updateTimeMs: number): TestValuesTree {
        const struct = TestValuesTreeFactory.valuesTreeByTimeStruct(startTimeMs, updateTimeMs)
        return new TestValuesTree(struct)
    }

    static valuesTreeByTime(startTimeMs: number, updateTimeMs: number): IValuesTree {
        const struct = TestValuesTreeFactory.valuesTreeByTimeStruct(startTimeMs, updateTimeMs)
        return new ValuesTree(struct)
    }

    static valuesTreeByTimeStruct(startTimeMs: number, updateTimeMs: number): IValuesTreeStruct {
        const start_day = Func.truncSeconds(TestValuesTreeFactory.msToSec(startTimeMs))
        const update_time = TestValuesTreeFactory.msToSec(updateTimeMs)
        const last_index = TestValuesTreeFactory.getLastIndex(start_day, update_time)
        return {values_length: last_index + 1, model: {}, start_day, update_time}
    }

    static getLastIndex(start_day: number, update_time: number): number {
        const lastDay = Func.truncSeconds(update_time - 86400)
        return Math.trunc((lastDay - start_day) / 86400)
    }

    static msToSec(ms: number): number {
        return Math.round(ms / 1000)
    }

    static emptyValuesTree(): IValuesTree {
        const struct = TestValuesTreeFactory.emptyValuesTreeStruct()
        return new ValuesTree(struct)
    }

    static emptyValuesTreeStruct(): IValuesTreeStruct {
        return {values_length: 0, model: undefined, start_day: 0, update_time: 0}
    }

    static uniqueValuesModels(quantity: number, values: object, metricAtom?: any): IAtomValues[] {
        const res = []
        for(let i = 0; i < quantity; i++)
            res.push(TestValuesTreeFactory.uniqueValuesModel(values, metricAtom))
        return res
    }

    static uniqueValuesModel(values: object, metricAtom?: any): IAtomValues {
        metricAtom = TestValuesTreeFactory.uniqueMetricAtom(metricAtom)
        return {
            metric_name: metricAtom.metric_name,
            pipeline_id: metricAtom.pipeline_id,
            status_id: metricAtom.status_id,
            user_id: metricAtom.user_id,
            values,
        }
    }

    static uniqueMetricAtom(metricAtom?: any): IMetricAtom {
        let {metric_name, ...atom} = metricAtom || {}
        const intermediateAtom: any = atom
        metric_name = metric_name || TestKpiFactory.randomMetricName
        return Object.assign({}, {metric_name}, TestValuesTreeFactory.uniqueAtom(intermediateAtom))
    }

    static uniqueAtom({user_id, status_id, pipeline_id}): IAtom {
        user_id = !user_id && user_id !== 0 ? Func.randomNumber(20) : user_id
        status_id = !status_id && status_id !== 0 ? Func.randomNumber(20) : status_id
        pipeline_id = !pipeline_id && pipeline_id !== 0 ? Func.randomNumber(20) : pipeline_id
        return {user_id, status_id, pipeline_id}
    }
}

export class TestValuesTree extends ValuesTree {
    moveIndex(newIndex: number): void {
        return super.moveIndex(newIndex)
    }
    pushValue(value: IAtomValues, index: number): void {
        return super.pushValue(value, index)
    }
    createOrGetAtomBranch (atom: IMetricAtom): object {
        return super.createOrGetAtomBranch(atom)
    }
    static createOrGetBranch(id: number|MetricName, parentBranch: object): object {
        return super.createOrGetBranch(id, parentBranch)
    }
    insertValue(atomBranch: object, value_key: ValueName|string|any, value: object, index: number): void {
        return super.insertValue(atomBranch, value_key, value, index)
    }
    createOrGetValueBranch(valueName: ValueName, atomBranch: object): number[] {
        return super.createOrGetValueBranch(valueName, atomBranch)
    }
    get defaultLowLevelBranch(): number[] {
        return super.defaultLowLevelBranch
    }
    getIndex(time: number): number {
        return super.getIndex(time)
    }
    static validIndex(index: number): void {
        return super.validIndex(index)
    }
}
