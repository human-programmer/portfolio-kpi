import {NewSuccessfulLeadsPrice} from "../../../../../../../workers/pragma/kpi/calculators/leads/NewSuccessfulLeadsPrice";
import {createNewPriceTestDataSets} from "./TestBudgetFactory";
import {IKPI} from "../../../../../../../workers/pragma/kpi/IKPI";
import IIndicatorValue = IKPI.IMetricValue;
import {Func} from "../../../../../../../generals/Func";
import {NewFailedLeadsPrice} from "../../../../../../../workers/pragma/kpi/calculators/leads/NewFailedLeadsPrice";
import IndicatorName = IKPI.MetricName;

const chai = require('chai')
export async function testNewSuccessfulLeadsBudget(): Promise<void> {
    describe('AbstractNewBudget', async () => {
        it('NewSuccessfulLeadsBudget', async () => {
            const {account_id, all_values, expect_values, target_statuses, start_date} = await createNewPriceTestDataSets(IndicatorName.price)
            const fabric = new TestNewSuccessfulLeadsBudget({accountId: account_id, indicatorId: 0}, target_statuses)
            const actualValues = await fabric.calculate({start_date, end_date: new Date()})
            checkIsUniques(expect_values)
            checkIsUniques(actualValues)
            compareValues(expect_values, actualValues)
        })
        it('NewFailedLeadsBudget', async () => {
            const {account_id, all_values, expect_values: expect_values, target_statuses, start_date} = await createNewPriceTestDataSets(IndicatorName.output_leads_price)
            const fabric = new TestNewFailedLeadsBudget({accountId: account_id, indicatorId: 0}, target_statuses)
            const actualValues = await fabric.calculate({start_date, end_date: new Date()})
            checkIsUniques(expect_values)
            checkIsUniques(actualValues)
            compareValues(expect_values, actualValues)
        })
    })
}

class TestNewSuccessfulLeadsBudget extends NewSuccessfulLeadsPrice {
}

class TestNewFailedLeadsBudget extends NewFailedLeadsPrice {
}

function compareValues (expectValues: IIndicatorValue[], actualValues: IIndicatorValue[]): void {
    chai.assert(actualValues.length === actualValues.length)
    const pairs = splitInPairs(expectValues, actualValues)
    pairs.forEach(e => compare(e.expect, e.actual))
}

function splitInPairs(expectValues: IIndicatorValue[], actualValues: IIndicatorValue[]): any[] {
    return expectValues.map(e => {
        return {
            expect: e,
            actual: findValue(actualValues, e)
        }
    })
}

function checkIsUniques(values: IIndicatorValue[]): void {
    values.forEach((val, index, arr) => {
        const value = findValue(arr, val)
        chai.assert(arr.indexOf(value) === index)
    })
}

function findValue(values: IIndicatorValue[], targetValue: IIndicatorValue): IIndicatorValue {
    return values.find(i => {
        return i.type === targetValue.type &&
            i.name === targetValue.name &&
            i.user_id === targetValue.user_id &&
            i.department_id === targetValue.department_id &&
            i.pipeline_id === targetValue.pipeline_id &&
            i.status_id === targetValue.status_id &&
            Func.truncDate(i.date).getTime() === Func.truncDate(targetValue.date).getTime()
    })
}

function compare (expectValue: IIndicatorValue, actualValue: IIndicatorValue): void {
    chai.assert(expectValue.type === actualValue.type)
    chai.assert(expectValue.name === actualValue.name)
    chai.assert(expectValue.user_id === actualValue.user_id)
    chai.assert(expectValue.department_id === actualValue.department_id)
    chai.assert(expectValue.pipeline_id === actualValue.pipeline_id)
    chai.assert(expectValue.status_id === actualValue.status_id)
    chai.assert(Func.truncDate(expectValue.date).getTime() === Func.truncDate(actualValue.date).getTime())
    chai.assert(expectValue.value === actualValue.value)
}