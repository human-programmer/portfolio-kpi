import {LeadsPriceCalc} from "../../../../../../pragma/kpi/calculators/metric_calc/decorators/PriceCalc";
import {TestFullStageFactory} from "../../../full_stage/full_stage/TestFullStageFactory";
import {IKPI} from "../../../../../../pragma/kpi/IKPI";
import MetricName = IKPI.MetricName;
import {TestPhotosFactory} from "../../TestPhotosFactory";
import StageFieldName = IKPI.StageFieldName;
import {Generals} from "../../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import ValueName = IKPI.ValueName;

const chai = require ('chai')

export function testPriceCalc(): void {
    describe('LeadsPriceCalc', () => {
        it('metricName', () => {
            const calc = create()
            chai.assert(calc.metricName === MetricName.price)
        })
        it('isMetricOwner', () => {
            chai.assert(LeadsPriceCalc.isMetricOwner(MetricName.price) === true)
            chai.assert(LeadsPriceCalc.isMetricOwner(MetricName.conversion) === false)
            chai.assert(LeadsPriceCalc.isMetricOwner(null) === false)
        })
        it('calcLowLevelBranch', () => {
            const calc = create()
            const photos = TestPhotosFactory.uniqueEmptyPhotos(1000, EntityGroup.leads, {user_id: 0, status_id: 0, pipeline_id: 0})
            TestPhotosFactory.addListValues(photos, StageFieldName.price, 100, [-2,-1,-0,1,2])
            const res = calc.calcLowLevelBranch(photos)
            chai.assert(res[ValueName.sum] === 0)
            chai.assert(res[ValueName.max] === 2)
            chai.assert(res[ValueName.min_nzero] === -2)
            chai.assert(res[ValueName.counter] === 100000)
            chai.assert(res[ValueName.counter_nzero] === 80000)
        })
    })
}

function create(): LeadsPriceCalc {
    const stage = TestFullStageFactory.emptyFullStage()
    return new LeadsPriceCalc(stage, null)
}