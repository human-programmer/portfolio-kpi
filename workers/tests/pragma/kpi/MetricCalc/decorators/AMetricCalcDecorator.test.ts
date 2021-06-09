import {ATestDecoratorFabric} from "./ATestDecoratorFabric";
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import MetricName = IKPI.MetricName;
import {ValuesTree} from "../../../../../pragma/kpi/full_stage/ValuesTree";
import {AccStage} from "../../../../../pragma/kpi/full_stage/AccStage";
import {TestPhotosFactory} from "../TestPhotosFactory";
import {Generals} from "../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import StageFieldName = IKPI.StageFieldName;
import {AMetricCalcDecorator} from "../../../../../pragma/kpi/calculators/metric_calc/AMetricCalcDecorator";
import ValueName = IKPI.ValueName;

const chai = require('chai')

export async function testAMetricCalcDecorator(): Promise<void> {
    describe('AMetricCalcDecorator', () => {
        describe('zero nesting', () => {
            it('constructor ', () => {
                const calc = ATestDecoratorFabric.createCalc()
                chai.assert(calc.metricName === MetricName.active_leads_counter)
                chai.assert(!calc.calculator)
                chai.assert(calc.fullStage.values_tree instanceof ValuesTree)
                chai.assert(calc.fullStage.acc_stage instanceof AccStage)
            })
            it('calcOwn empty', () => {
                const calc = ATestDecoratorFabric.createCalc()
                const result = calc.calcOwn([])
                chai.assert(result.metric_name === calc.metricName)
                chai.assert(result.pipeline_id === 0)
                chai.assert(result.status_id === 0)
                chai.assert(result.user_id === 0)
            })
            it('calc empty', () => {
                const calc = ATestDecoratorFabric.createCalc()
                const result = calc.calc([])
                chai.assert(result.length === 1)
                chai.assert(result[0].metric_name === calc.metricName)
                chai.assert(result[0].pipeline_id === 0)
                chai.assert(result[0].status_id === 0)
                chai.assert(result[0].user_id === 0)
            })
            it('calc not empty', () => {
                const calc = ATestDecoratorFabric.createCalc()
                const expectedCounter = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(expectedCounter, EntityGroup.leads)
                TestPhotosFactory.addCounters(photos, StageFieldName.entities_counter, 1)
                const result = calc.calc(photos)
                chai.assert(result.length === 1)
                chai.assert(result[0].metric_name === calc.metricName)
                chai.assert(result[0].pipeline_id === photos[0].pipeline_id)
                chai.assert(result[0].status_id === photos[0].status_id)
                chai.assert(result[0].user_id === photos[0].user_id)
            })
        })
        describe('not zero nesting', () => {
            it('constructor', () => {
                const calc = ATestDecoratorFabric.createCalc(10)
                chai.assert(calc.metricName === MetricName.active_leads_counter)
                chai.assert(calc.calculator instanceof AMetricCalcDecorator)
                chai.assert(calc.fullStage.values_tree instanceof ValuesTree)
                chai.assert(calc.fullStage.acc_stage instanceof AccStage)
            })
            it('calc empty', () => {
                const calc = ATestDecoratorFabric.createCalc(10)
                const result = calc.calc([])
                chai.assert(result.length === 10)
                result.forEach(res => {
                    chai.assert(res.metric_name === calc.metricName)
                    chai.assert(res.pipeline_id === 0)
                    chai.assert(res.status_id === 0)
                    chai.assert(res.user_id === 0)
                })
            })
            it('calc not empty', () => {
                const calc = ATestDecoratorFabric.createCalc()
                const expectedCounter = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(expectedCounter, EntityGroup.leads)
                TestPhotosFactory.addCounters(photos, StageFieldName.entities_counter, 1)
                const result = calc.calc(photos)
                result.forEach(res => {
                    chai.assert(res.metric_name === calc.metricName)
                    chai.assert(res.pipeline_id === photos[0].pipeline_id)
                    chai.assert(res.status_id === photos[0].status_id)
                    chai.assert(res.user_id === photos[0].user_id)
                })
            })
        })
        describe('counter static methods', () => {
            it('counter ones', () => {
                const expectedCounter = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(expectedCounter, EntityGroup.leads)
                TestPhotosFactory.addCounters(photos, StageFieldName.entities_counter, 1)
                const actualCounter = AMetricCalcDecorator.counterSum(photos, StageFieldName.entities_counter)
                chai.assert(expectedCounter === actualCounter)
            })
            it('counter two', () => {
                const expectedCounter = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(expectedCounter, EntityGroup.leads)
                TestPhotosFactory.addCounters(photos, StageFieldName.entities_counter, 2)
                const actualCounter = AMetricCalcDecorator.counterSum(photos, StageFieldName.entities_counter)
                chai.assert(expectedCounter * 2 === actualCounter)
            })
            it('counter zero', () => {
                const photos = TestPhotosFactory.uniqueEmptyPhotos(1000, EntityGroup.leads)
                TestPhotosFactory.addCounters(photos, StageFieldName.entities_counter, 1)
                const actualCounter = AMetricCalcDecorator.counterSum(photos, undefined)
                chai.assert(0 === actualCounter)
            })
            it('empty photos', () => {
                const actualSum = AMetricCalcDecorator.counterSum([], StageFieldName.entities_counter)
                chai.assert(actualSum === 0)
            })
        })
        describe('list static methods', () => {
            it('listQuantityValues', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addListValues(photos, StageFieldName.price, 100, 2)
                const expectedQuantity = quantity * 100
                const actualQuantity = AMetricCalcDecorator.listQuantityValues(photos, StageFieldName.price)
                chai.assert(expectedQuantity === actualQuantity)
            })

            it('listQuantityNZeroValues all zero', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addListValues(photos, StageFieldName.price, 100, 0)
                const actualQuantity = AMetricCalcDecorator.listQuantityNZeroValues(photos, StageFieldName.price)
                chai.assert(0 === actualQuantity)
            })

            it('listQuantityNZeroValues all not zero', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addListValues(photos, StageFieldName.price, 100, 2)
                const expectedQuantity = quantity * 100
                const actualQuantity = AMetricCalcDecorator.listQuantityNZeroValues(photos, StageFieldName.price)
                chai.assert(expectedQuantity === actualQuantity)
            })

            it('listQuantityNZeroValues any', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addListValues(photos, StageFieldName.price, 100, [0,1,2,3])
                const expectedQuantity = quantity * 100 * 0.75
                const actualQuantity = AMetricCalcDecorator.listQuantityNZeroValues(photos, StageFieldName.price)
                chai.assert(expectedQuantity === actualQuantity)
            })

            it('listMinNZero', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addListValues(photos, StageFieldName.price, 100, [-3,-2,-1,0,1,2,3])
                const actualMin = AMetricCalcDecorator.listMinNZero(photos, StageFieldName.price)
                chai.assert(-3 === actualMin)
            })

            it('listMax', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addListValues(photos, StageFieldName.price, 100, [-3,-2,-1,0,1,2,3, 99])
                const actualMax = AMetricCalcDecorator.listMax(photos, StageFieldName.price)
                chai.assert(99 === actualMax)
            })

            it('sumValues', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addListValues(photos, StageFieldName.price, 100, 2)
                const expectedSum = quantity * 100 * 2
                const actualSum = AMetricCalcDecorator.listSum(photos, StageFieldName.price)
                chai.assert(expectedSum === actualSum)
            })

            it('sumValues any', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addListValues(photos, StageFieldName.price, 100, [0,1,2,3])
                const expectedSum = quantity * 25 * 0 + quantity * 25 * 1 + quantity * 25 * 2 + quantity * 25 * 3
                const actualSum = AMetricCalcDecorator.listSum(photos, StageFieldName.price)
                chai.assert(expectedSum === actualSum)
            })

            it('sumValues any negative values', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addListValues(photos, StageFieldName.price, 100, [-3,-2,2,3])
                const actualSum = AMetricCalcDecorator.listSum(photos, StageFieldName.price)
                chai.assert(0 === actualSum)
            })
            it('empty photos', () => {
                const actualQuantity = AMetricCalcDecorator.listQuantityValues([], StageFieldName.price)
                const actualQuantityNZero = AMetricCalcDecorator.listQuantityNZeroValues([], StageFieldName.price)
                const actualMinNZero = AMetricCalcDecorator.listMinNZero([], StageFieldName.price)
                const actualMax = AMetricCalcDecorator.listMax([], StageFieldName.price)
                const actualSum = AMetricCalcDecorator.listSum([], StageFieldName.price)
                chai.assert(actualQuantity === 0)
                chai.assert(actualQuantityNZero === 0)
                chai.assert(actualMinNZero === 0)
                chai.assert(actualMax === 0)
                chai.assert(actualSum === 0)
            })
        })
        describe('metric static methods', () => {
            it('listQuantityValues', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addMetricValues(photos, ValueName.status_durations, 100, [0,1,2,3])
                const expectedQuantity = quantity * 100
                const actualQuantity = AMetricCalcDecorator.metricQuantityValues(photos, ValueName.status_durations)
                chai.assert(expectedQuantity === actualQuantity)
            })
            it('metricSum', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addMetricValues(photos, ValueName.status_durations, 100, [0,1,2,3])
                const expectedSum = quantity * 25 * 0 + quantity * 25 * 1 + quantity * 25 * 2 + quantity * 25 * 3
                const actualSum = AMetricCalcDecorator.metricSum(photos, ValueName.status_durations)
                chai.assert(expectedSum === actualSum)
            })
            it('metricMax', () => {
                const quantity = 1000
                const photos = TestPhotosFactory.uniqueEmptyPhotos(quantity, EntityGroup.leads)
                TestPhotosFactory.addMetricValues(photos, ValueName.status_durations, 100, [-3,-2,-1,0,1,2,3, 99])
                const actualMax = AMetricCalcDecorator.metricMax(photos, ValueName.status_durations)
                chai.assert(99 === actualMax)
            })
            it('empty photos', () => {
                const actualQuantity = AMetricCalcDecorator.metricQuantityValues([], ValueName.status_durations)
                const actualMax = AMetricCalcDecorator.metricMax([], ValueName.status_durations)
                const actualSum = AMetricCalcDecorator.metricSum([], ValueName.status_durations)
                chai.assert(actualQuantity === 0)
                chai.assert(actualMax === 0)
                chai.assert(actualSum === 0)
            })
        })
    })
}