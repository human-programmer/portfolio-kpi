import {TestValuesTree, TestValuesTreeFactory} from "./TestValuesTreeFactory";
import {ValuesTree} from "../../../../../pragma/kpi/full_stage/ValuesTree";
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import ValueName = IKPI.ValueName;
import MetricName = IKPI.MetricName;

const chai = require('chai')

export async function testValuesTree(): Promise<void> {
    describe('ValuesTree', () => {
        it('constructor', () => {
            const struct = TestValuesTreeFactory.emptyValuesTreeStruct()
            const tree = new ValuesTree(struct)
            chai.assert(tree.start_day === struct.start_day)
            chai.assert(tree.values_length === struct.values_length)
            chai.assert(tree.update_time === struct.update_time)
            chai.assert(Object.values(tree.model).length === 0)
        })
        describe('needsUpdating', () => {
            it('there only a start day', () => {
                const tree = TestValuesTreeFactory.valuesTreeByTime(86400, 0)
                chai.assert(tree.needsNextUpdating == true)
            })
            it('currentTimeUpdate 0', () => {
                const tree = TestValuesTreeFactory.valuesTreeByTime(new Date().getTime() - 86400000, new Date().getTime()) //обновление за вчера
                chai.assert(tree.needsNextUpdating == false)
            })
            it('currentTimeUpdate 1', () => {
                const tree = TestValuesTreeFactory.valuesTreeByTime(new Date().getTime() - 3 * 86400000, new Date().getTime() - 2 * 86400000) //обновление за позавчера
                chai.assert(tree.needsNextUpdating == true)
            })
            it('currentTimeUpdate 2', () => {
                const tree = TestValuesTreeFactory.valuesTreeByTime(86400000, new Date().getTime())
                chai.assert(tree.needsNextUpdating == false)
            })
        })
        it('lastDay', () => {
            const tree = TestValuesTreeFactory.valuesTreeByTime(86400000, new Date().getTime())
            const expectedLastDay = tree.start_day + 86400 * tree.values_length
            chai.assert(expectedLastDay === tree.lastDay)
        })
        it('validIndex', () => {
            try {
                TestValuesTree.validIndex(1.1)
            } catch (e) {
                return chai.assert(true)
            }
            chai.assert(false)
        })
        it('getIndex', () => {
            const tree = TestValuesTreeFactory.valuesTestTreeByTime(90000 * 1000, new Date().getTime())
            chai.assert(tree.getIndex(86400) === 0)
            chai.assert(tree.getIndex(86400 * 2) === 1)
            chai.assert(tree.getIndex(86400 * 3) === 2)
        })
        it('defaultValuesBranch', () => {
            const tree = TestValuesTreeFactory.valuesTestTreeByTime(new Date().getTime() - 86400000 * 100, new Date().getTime())
            const defaultBranch = tree.defaultLowLevelBranch
            isDefaultLowLevelBranch(defaultBranch, 100)
        })
        it('createOrGetValueBranch', () => {
            const tree = TestValuesTreeFactory.valuesTestTreeByTime(new Date().getTime() - 86400000 * 100, new Date().getTime())
            const branch = {}

            const values = tree.createOrGetValueBranch(ValueName.status_cancelled_counter, branch)
            chai.assert(Object.values(branch).length === 1)
            isDefaultLowLevelBranch(branch[ValueName.status_cancelled_counter], 100)
            isDefaultLowLevelBranch(values, 100)
            chai.assert(values === branch[ValueName.status_cancelled_counter])

            const values1 = tree.createOrGetValueBranch(ValueName.status_output_counter, branch)
            chai.assert(Object.values(branch).length === 2)
            isDefaultLowLevelBranch(branch[ValueName.status_cancelled_counter], 100)
            isDefaultLowLevelBranch(branch[ValueName.status_output_counter], 100)
            chai.assert(values1 === branch[ValueName.status_output_counter])
        })
        it('insertValue', () => {
            const tree = TestValuesTreeFactory.valuesTestTreeByTime(new Date().getTime() - 86400000 * 100, new Date().getTime())
            const branch = {}
            const value = {[ValueName.sum]: 44, [ValueName.min_nzero]: 3}
            tree.insertValue(branch, ValueName.sum, value, 0)
            tree.insertValue(branch, ValueName.sum, value, tree.values_length - 1)
            chai.assert(branch[ValueName.sum].length === 100)

            tree.insertValue(branch, ValueName.sum, value, tree.values_length)
            chai.assert(branch[ValueName.sum].length === 101)
            chai.assert(Object.values(branch).length === 1)

            tree.insertValue(branch, ValueName.min_nzero, value, tree.values_length)
            chai.assert(branch[ValueName.min_nzero].length === 101)
            chai.assert(Object.values(branch).length === 2)

            chai.assert(branch[ValueName.sum][0] === 44)
            chai.assert(branch[ValueName.sum][100 - 1] === 44)
            chai.assert(branch[ValueName.sum][100] === 44)
            chai.assert(branch[ValueName.min_nzero][100] === 3)
        })
        it('static createOrGetBranch', () => {
            const branch = {}
            const childBranch = TestValuesTree.createOrGetBranch(MetricName.price, branch)
            chai.assert(Object.values(branch).length === 1)
            chai.assert(childBranch === branch[MetricName.price])

            const childBranch2 = TestValuesTree.createOrGetBranch(MetricName.conversion, branch)
            chai.assert(Object.values(branch).length === 2)
            chai.assert(childBranch === branch[MetricName.price])
            chai.assert(childBranch2 === branch[MetricName.conversion])

            chai.assert(TestValuesTree.createOrGetBranch(MetricName.conversion, branch) === childBranch2)
        })
        it('createOrGetAtomBranch', () => {
            const metricAtom = TestValuesTreeFactory.uniqueMetricAtom({})
            const tree = TestValuesTreeFactory.valuesTestTreeByTime(new Date().getTime() - 86400000 * 100, new Date().getTime())
            const branch = tree.createOrGetAtomBranch(metricAtom)
            chai.assert(branch === tree.model[metricAtom.metric_name][metricAtom.user_id][metricAtom.pipeline_id][metricAtom.status_id])
        })
        it('pushValue', () => {
            const value = TestValuesTreeFactory.uniqueValuesModel({[ValueName.sum]: 345})
            const tree = TestValuesTreeFactory.valuesTestTreeByTime(new Date().getTime() - 86400000 * 100, new Date().getTime())
            tree.pushValue(value, 50)
            const branch = tree.createOrGetAtomBranch(value)
            chai.assert(branch === tree.model[value.metric_name][value.user_id][value.pipeline_id][value.status_id])
            chai.assert(branch[ValueName.sum][50] === 345)
        })
        it('moveIndex', () => {
            const tree = TestValuesTreeFactory.valuesTestTreeByTime(0, 0)
            chai.assert(tree.values_length === 0)
            tree.moveIndex(10)
            chai.assert(tree.values_length === 11)
            tree.moveIndex(9)
            chai.assert(tree.values_length === 11)
            tree.moveIndex(1)
            chai.assert(tree.values_length === 11)
            tree.moveIndex(11)
            chai.assert(tree.values_length === 12)
        })
        it('setValuesAndMoveDayIndex', () => {
            const value = TestValuesTreeFactory.uniqueValuesModel({[ValueName.sum]: 345})
            const tree = TestValuesTreeFactory.valuesTestTreeByTime(0, 0)
            chai.assert(tree.values_length === 0)
            tree.setValuesAndMoveDayIndex([value], 0)
            chai.assert(tree.values_length === 1)
            tree.setValuesAndMoveDayIndex([value], 86400 * 2)
            chai.assert(tree.values_length === 3)
        })
    })
}

function isDefaultLowLevelBranch(branch: number[], expectedLength: number): void {
    chai.assert(branch.length === expectedLength)
    branch.forEach(i => chai.assert(i === 0))
}