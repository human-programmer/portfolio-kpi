import {CRMDB} from "../../../../../../../generals/data_base/CRMDB";
import {TestPragmaFabric} from "../../../../../test_pragma_fabric/TestPragmaFabric";
import {Generals} from "../../../../../../../generals/Interfaces";
import IStatus = Generals.IStatus;
import {ITestEntity} from "../../../../../test_pragma_fabric/TestEntitiesFabric";
import {IKPI} from "../../../../../../../workers/pragma/kpi/IKPI";
import IndicatorName = IKPI.MetricName;
import IIndicatorValue = IKPI.IMetricValue;
import MathOperation = IKPI.MathOperation;
import {Func} from "../../../../../../../generals/Func";

export interface IDurationTestDataSet {
    readonly status: IStatus,
    readonly indicatorName: IndicatorName,
    readonly user_id: number,
    readonly entities: ITestEntity[],
    readonly entry_date: Date,
    readonly out_date: Date|null,
    readonly expectedSumNewPriceValue?: number,
    readonly expectedMaxNewPriceValue?: number,
    readonly expectedMinNewPriceValue?: number,
    readonly expectedAvgNewPriceValue?: number,
}


/*
    50 статусов
    5 воронок
    5 пользователей
    10 сделок
 */

export async function createNewPriceTestDataSets(name: IndicatorName): Promise<any> {
    const {account_id, statuses, user_ids, entities, start_date} = await createDefaultTestDataSets()
    const all_values = createAllValues(name, statuses, user_ids, entities)
    await saveDurations(all_values)
    const target_statuses = all_values.filter(i => !i.out_date).map(i => i.status)
    const expect_values = fetch_expect_current_values(all_values)
    return {
        account_id,
        statuses,
        user_ids,
        entities,
        all_values,
        target_statuses,
        start_date,
        expect_values
    }
}

function fetchUniquePipelineIds (statuses: IStatus[]): Array<number> {
    return statuses.map(i => i.pipeline_id).filter((i, index, arr) => arr.indexOf(i) === index)
}

function createAllValues(name: IndicatorName, statuses: IStatus[], user_ids: number[], entities: ITestEntity[]): IDurationTestDataSet[] {
    const pipelinesIds = fetchUniquePipelineIds(statuses)
    return [].concat(...pipelinesIds.map((pipeline_id, index) => {
        const packStatuses = statuses.filter(i => i.pipeline_id == pipeline_id)
        const user_id = user_ids[index]
        const packEntities = [entities[index * 2], entities[index * 2 + 1]]
        return createDataSetsForUser(name, packStatuses, user_id, packEntities)
    }))
}

export async function createDefaultTestDataSets(): Promise<any> {
    const account = await TestPragmaFabric.uniqueAccount()
    const params = await Promise.all([
        TestPragmaFabric.uniqueStatuses(account.pragmaAccountId, 50, 5),
        TestPragmaFabric.uniqueUsersIds(account.pragmaAccountId, 5),
        TestPragmaFabric.uniqueTestEntities(account.pragmaAccountId, 10),
    ])
    return {
        account_id: account.pragmaAccountId,
        statuses: params[0],
        user_ids: params[1],
        entities: params[2],
        start_date: new Date(1616937330342)
    }
}

/*
    10 статусов
    1 воронока
    1 пользователь
    2 сделоки
 */
function createDataSetsForUser(name: IndicatorName, statuses: IStatus[], user_id: number, entities: ITestEntity[]): IDurationTestDataSet[] {
    const startTime = 1617023730342 //28.03.2021
    const dayLength = 86400000
    return statuses.map((i, index) => {
        const out_date = index + 1 === statuses.length ? null : new Date(startTime + dayLength * (index + 2))
        const sum = entities.map(i => i.price).reduce((sum, val) => sum + val)
        return {
            status: i,
            indicatorName: name,
            user_id,
            entities: entities,
            entry_date: new Date(startTime + dayLength * (index + 1)),
            out_date,
            expectedSumNewPriceValue: sum,
            expectedMaxNewPriceValue: Math.max(...entities.map(i => i.price)),
            expectedMinNewPriceValue: Math.min(...entities.map(i => i.price)),
            expectedAvgNewPriceValue: sum / entities.length,
        }
    })
}

async function saveDurations(durations: IDurationTestDataSet[]): Promise<void> {
    durations = [].concat(durations)
    const toSpliced = []
    while (durations.length)
        toSpliced.push(durations.splice(0, 25))
    await Promise.all(toSpliced.map(i => saveDurationsPack(i)))
}

async function saveDurationsPack (durations: IDurationTestDataSet[]): Promise<void> {
    const values = createValues(durations)
    const schema = CRMDB.statusDurationSchema
    const sql = `INSERT INTO ${schema} (status_id, pipeline_id, entity_id, user_id, entry_date, out_date)
                VALUES ${values}`
    await CRMDB.query(sql)
}

function createValues (durations: IDurationTestDataSet[]): string {
    return [].concat(...durations).map(i => {
        return i.entities.map(e => `(${i.status.status_id}, ${i.status.pipeline_id}, ${e.id}, ${i.user_id}, ${CRMDB.escape(i.entry_date)}, ${CRMDB.escape(i.out_date)})`)
    }).join(',')
}

function fetch_expect_current_values (allValues: IDurationTestDataSet[]): IIndicatorValue[] {
    const endValues = allValues.filter(i => !i.out_date)
    return [].concat(...endValues.map(i => {
        return [
            createValue(i, MathOperation.min),
            createValue(i, MathOperation.max),
            createValue(i, MathOperation.avg),
            createValue(i, MathOperation.sum),
        ]
    }))
}

function createValue (dataSet: IDurationTestDataSet, type: MathOperation): IIndicatorValue {
    return {
        date: Func.truncDate(dataSet.entry_date),
        department_id: 0,
        name: dataSet.indicatorName,
        pipeline_id: dataSet.status.pipeline_id,
        metric_id: 0,
        status_id: dataSet.status.status_id,
        type,
        user_id: dataSet.user_id,
        value: fetchValue(dataSet, type)
    }
}

function fetchValue (dataSet: IDurationTestDataSet, type: MathOperation): number {
    switch (type) {
        case MathOperation.min:
            return dataSet.expectedMinNewPriceValue
        case MathOperation.max:
            return dataSet.expectedMaxNewPriceValue
        case MathOperation.avg:
            return dataSet.expectedAvgNewPriceValue
        case MathOperation.sum:
            return dataSet.expectedSumNewPriceValue
    }
}