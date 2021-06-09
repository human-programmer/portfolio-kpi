import {IEvents} from "../IEvents";
import IValuesTree = IEvents.IValuesTree;
import IValuesTreeStruct = IEvents.IValuesTreeStruct;
import {IKPI} from "../IKPI";
import IAtomValues = IKPI.IAtomValues;
import MetricName = IKPI.MetricName;
import IMetricAtom = IKPI.IMetricAtom;
import ValueName = IKPI.ValueName;
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;
import {Func} from "../../../../generals/Func";

export class ValuesTree implements IValuesTree {
    readonly start_day: number
    readonly model: object
    readonly values_length: number
    readonly update_time: number

    constructor(struct: IValuesTreeStruct) {
        this.start_day = struct.start_day
        this.model = struct.model || {}
        this.values_length = struct.values_length
        this.update_time = struct.update_time
    }

    get needsNextUpdating(): boolean {
        const nextLastTime = Math.trunc((new Date().getTime() - 86400000) / 1000)
        const nextLastDay = Func.truncSeconds(nextLastTime)
        return this.lastDay < nextLastDay
    }

    get lastDay(): number {
        return this.start_day + 86400 * this.values_length
    }

    setValuesAndMoveDayIndex(values: IAtomValues[], day_time: number): void {
        const index = this.getIndex(day_time)
        this.moveIndex(index)
        values.forEach(value => this.pushValue(value, index))
    }

    protected moveIndex(newIndex: number): void {
        // this.validIndex(newIndex)
        if(newIndex >= this.values_length)
            // @ts-ignore
            this.values_length = newIndex + 1
    }

    private validIndex(index: number): void {
        if(index - this.values_length > 1)
            throw Errors.internalError("Index is too big, dif: '" + (index - this.values_length) + "'")
    }

    protected pushValue(value: IAtomValues, index: number): void {
        const keys = Object.keys(value.values)
        if(!keys.length) return;
        const atomBranch = this.createOrGetAtomBranch(value)
        keys.forEach(key => this.insertValue(atomBranch, key, value.values, index))
    }

    protected createOrGetAtomBranch (atom: IMetricAtom): object {
        const metric_branch = ValuesTree.createOrGetBranch(atom.metric_name, this.model)
        const user_branch = ValuesTree.createOrGetBranch(atom.user_id, metric_branch)
        const pipeline_branch = ValuesTree.createOrGetBranch(atom.pipeline_id, user_branch)
        return ValuesTree.createOrGetBranch(atom.status_id, pipeline_branch)
    }

    protected static createOrGetBranch(id: number|MetricName, parentBranch: object): object {
        let branch = parentBranch[id]
        if(branch) return branch
        parentBranch[id] = branch = {}
        return branch
    }

    protected insertValue(atomBranch: object, value_key: ValueName|string|any, value: object, index: number): void {
        const valuesBranch = this.createOrGetValueBranch(value_key, atomBranch)
        valuesBranch[index] = value[value_key]
    }

    protected createOrGetValueBranch(valueName: ValueName, atomBranch: object): number[] {
        let branch = atomBranch[valueName]
        if(branch) return branch
        atomBranch[valueName] = branch = this.defaultLowLevelBranch
        return branch
    }

    protected get defaultLowLevelBranch(): number[] {
        return new Array(this.values_length).fill(0)
    }

    protected getIndex(time: number): number {
        const index = (time - this.start_day) / 86400
        ValuesTree.validIndex(index)
        return index
    }

    protected static validIndex(index: number): void {
        if(index < 0 || index % 1)
            throw Errors.internalError('Invalid value index "' + index + '"')
    }

    async save(): Promise<void> {
        return Promise.resolve(undefined);
    }

    get metricNames(): MetricName[] {
        const names: any[] = Object.keys(this.model)
        return names
    }
}