import {TestPhotosFactory} from "../../TestPhotosFactory";
import {TestFullStageFactory} from "../../../full_stage/full_stage/TestFullStageFactory";
import {IKPI} from "../../../../../../pragma/kpi/IKPI";
import MetricName = IKPI.MetricName;
import {Generals} from "../../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import ValueName = IKPI.ValueName;
import {ConversionCalc} from "../../../../../../pragma/kpi/calculators/metric_calc/decorators/ConversionCalc";

const chai = require('chai')

export function testConversionCalc(): void {
    describe('ConversionCalc', () => {
        it('metricName', () => {
            const calc = create()
            chai.assert(calc.metricName === MetricName.conversion)
        })
        it('isMetricOwner', () => {
            chai.assert(ConversionCalc.isMetricOwner(MetricName.conversion) === true)
            chai.assert(ConversionCalc.isMetricOwner(MetricName.price) === false)
            chai.assert(ConversionCalc.isMetricOwner(null) === false)
        })
        it('calcLowLevelBranch', () => {
            const calc = create()
            const photos = TestPhotosFactory.uniqueEmptyPhotos(1000, EntityGroup.leads, {user_id: 0, status_id: 0, pipeline_id: 0})
            TestPhotosFactory.addMetricValues(photos, ValueName.status_durations, 100, [10,30,100,1001])
            TestPhotosFactory.addMetricValues(photos, ValueName.status_output_counter, 100, [1,2,3,4])
            TestPhotosFactory.addMetricValues(photos, ValueName.status_cancelled_counter, 100, [1,2,3,4,5])
            const res = calc.calcLowLevelBranch(photos)
            const expectedDurationsSum = 10 * 25 * 1000 + 30 * 25 * 1000 + 100 * 25 * 1000 + 1001 * 25 * 1000
            const expectedOutputCounterSum = 1 * 25 * 1000 + 2 * 25 * 1000 + 3 * 25 * 1000 + 4 * 25 * 1000
            const expectedCancelledCounterSum = 1 * 20 * 1000 + 2 * 20 * 1000 + 3 * 20 * 1000 + 4 * 20 * 1000 + 5 * 20 * 1000
            chai.assert(res[ValueName.status_durations] === expectedDurationsSum)
            chai.assert(res[ValueName.status_output_counter] === expectedOutputCounterSum)
            chai.assert(res[ValueName.status_cancelled_counter] === expectedCancelledCounterSum)
        })
    })
}

function create(): ConversionCalc {
    const stage = TestFullStageFactory.emptyFullStage()
    return new ConversionCalc(stage, null)
}