import {TestFullStageFactory} from "../../full_stage/full_stage/TestFullStageFactory";
import {MetricCalc} from "../../../../../pragma/kpi/calculators/metric_calc/MetricCalc";
import {TestMetricCalc, TestMetricCalcFactory} from "./TestMetricCalcFactory";
import {LeadsPriceCalc} from "../../../../../pragma/kpi/calculators/metric_calc/decorators/PriceCalc";
import {ConversionCalc} from "../../../../../pragma/kpi/calculators/metric_calc/decorators/ConversionCalc";
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import MetricName = IKPI.MetricName;
import {TestPhotosFactory} from "../TestPhotosFactory";
import {ATestDecoratorFabric} from "../decorators/ATestDecoratorFabric";

const chai = require('chai')

export async function testMetricCalc(): Promise<void> {
    describe('MetricCalc', () => {
        it('constructor', () => {
            const fullStage = TestFullStageFactory.emptyFullStage()
            const calc = new MetricCalc(fullStage)
            chai.assert(fullStage === calc.fullStage)
        })

        describe('methods', () => {
            it('createCalculator empty', () => {
                const metricCalc = TestMetricCalcFactory.emptyTestMetricCalc()
                const calc = metricCalc.createCalculator([])
                chai.assert(!calc)
            })
            it('createCalculator only price', () => {
                const metricCalc = TestMetricCalcFactory.emptyTestMetricCalc()
                const calc = metricCalc.createCalculator([MetricName.price])
                chai.assert(calc instanceof LeadsPriceCalc)
            })
            it('createCalculator only conversion', () => {
                const metricCalc = TestMetricCalcFactory.emptyTestMetricCalc()
                const calc = metricCalc.createCalculator([MetricName.conversion])
                chai.assert(calc instanceof ConversionCalc)
            })
            it('calcOnDay', () => {
                const decorator = ATestDecoratorFabric.createCalc(10)
                const atom_0 = {user_id: 0, status_id: 0, pipeline_id: 0}
                const photos_0 = TestPhotosFactory.uniqueEmptyPhotos(1000, null, atom_0)
                const metricCalc = TestMetricCalcFactory.emptyTestMetricCalc()
                const photoGroups = TestMetricCalc.groupByAtom(photos_0)
                const res = metricCalc.calcOnDay(decorator, photoGroups)
                chai.assert(res.length === 10)
            })
            it('calcAsOneDay without photos', () => {
                const metricCalc = TestMetricCalcFactory.emptyTestMetricCalc()
                const res = metricCalc.calcAsOneDay([], [MetricName.price, MetricName.conversion])
                chai.assert(res.length === 0)
            })
            it('calcAsOneDay without metricNames', () => {
                const metricCalc = TestMetricCalcFactory.emptyTestMetricCalc()
                const photos_0 = TestPhotosFactory.uniqueEmptyPhotos(1000)
                const res = metricCalc.calcAsOneDay(photos_0, [])
                chai.assert(res.length === 0)
            })
            it('calcAsOneDay without all', () => {
                const metricCalc = TestMetricCalcFactory.emptyTestMetricCalc()
                const res = metricCalc.calcAsOneDay([], [])
                chai.assert(res.length === 0)
            })
            it('calcAsOneDay single atom', () => {
                const atom_0 = {user_id: 0, status_id: 0, pipeline_id: 0}
                const photos_0 = TestPhotosFactory.uniqueEmptyPhotos(1000, null, atom_0)
                const metricCalc = TestMetricCalcFactory.emptyTestMetricCalc()
                const res = metricCalc.calcAsOneDay(photos_0, [MetricName.price, MetricName.conversion])
                chai.assert(res.length === 2)
            })
            it('calcAsOneDay ', () => {
                const atom_0 = {user_id: 0, status_id: 0, pipeline_id: 0}
                const atom_1 = {user_id: 0, status_id: 0, pipeline_id: 1}
                const photos_0 = TestPhotosFactory.uniqueEmptyPhotos(1000, null, atom_0)
                const photos_1 = TestPhotosFactory.uniqueEmptyPhotos(1001, null, atom_1)
                const photos = [].concat(photos_0, photos_1)
                const metricCalc = TestMetricCalcFactory.emptyTestMetricCalc()
                const res = metricCalc.calcAsOneDay(photos, [MetricName.price, MetricName.conversion])
                chai.assert(res.length === 4)
            })
        })

        describe('static methods', () => {
            it('decorators', () => {
                const expectedDecorators = [
                    LeadsPriceCalc,
                    ConversionCalc,
                ]
                const actualDecorators = TestMetricCalc.decorators
                expectedDecorators.forEach(expected => {
                    chai.assert(actualDecorators.indexOf(expected) !== -1)
                })
            })
            it('decorators isMetricOwner', () => {
                TestMetricCalc.decorators.forEach(dec => {
                    chai.assert(typeof dec.isMetricOwner(MetricName.price) === "boolean")
                })
            })
            it('getTargetDecorators ConversionCalc', () => {
                const actualDecorators = TestMetricCalc.getTargetDecorators([MetricName.price])
                chai.assert(actualDecorators.length === 1)
                chai.assert(actualDecorators[0] === LeadsPriceCalc)
            })
            it('getTargetDecorators LeadsPriceCalc', () => {
                const actualDecorators = TestMetricCalc.getTargetDecorators([MetricName.conversion])
                chai.assert(actualDecorators.length === 1)
                chai.assert(actualDecorators[0] === ConversionCalc)
            })
            it('getTargetDecorators empty condition', () => {
                const actualDecorators = TestMetricCalc.getTargetDecorators([])
                chai.assert(actualDecorators.length === 0)
            })
            it('groupByAtom', () => {
                const atom_0 = {user_id: 0, status_id: 0, pipeline_id: 0}
                const atom_1 = {user_id: 0, status_id: 0, pipeline_id: 1}
                const photos_0 = TestPhotosFactory.uniqueEmptyPhotos(1000, null, atom_0)
                const photos_1 = TestPhotosFactory.uniqueEmptyPhotos(1001, null, atom_1)
                const group = TestMetricCalc.groupByAtom([].concat(photos_0, photos_1))
                chai.assert(Object.values(group).length === 2)
                chai.assert(group[0].length === 1000)
                chai.assert(group[1].length === 1001)
            })
        })
    })
}