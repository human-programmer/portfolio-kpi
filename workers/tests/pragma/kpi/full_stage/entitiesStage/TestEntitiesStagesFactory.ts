import {IEvents} from "../../../../../pragma/kpi/IEvents";
import IEntitiesStages = IEvents.IEntitiesStages;
import IEntitiesStagesStruct = IEvents.IEntitiesStagesStruct;
import {Generals} from "../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import {TestEntityStageFactory} from "../entity_stage/TestEntityStageFactory";
import {EntitiesStages} from "../../../../../pragma/kpi/full_stage/AccStage";
import {Func} from "../../../../../../generals/Func";
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import IEntityFieldStage = IKPI.IEntityFieldStage;
import StageFieldName = IKPI.StageFieldName;
import IEntityStage = IEvents.IEntityStage;
import IFieldAction = IKPI.IFieldAction;
import IStatus = IKPI.IStatus;
import IPhoto = IKPI.IPhoto;
import ValueName = IKPI.ValueName;

const chai = require('chai')

const {
    timeMoment,
    dayTimeMoment,
    eventTimeMoment,
    nextInterval,
} = getTestTimes()

export class TestEntitiesStagesFactory {
    static createEntitiesStages(entityGroup: EntityGroup): IEntitiesStages {
        const struct = TestEntitiesStagesFactory.createEntitiesStagesStruct(entityGroup)
        const statusTypes = TestEntityStageFactory.createTestStatusTypes()
        return new EntitiesStages(struct, statusTypes)
    }

    static createEntitiesStagesStruct(entityGroup: EntityGroup): IEntitiesStagesStruct {
        return {entities: undefined, group_name: entityGroup}
    }
}

export function getTestTimes(): any {
    const timeMoment = 86400 * 100 + 500
    const dayTimeMoment = 86400 * 100
    const eventTimeMoment = 86400 * 100 + 300
    const nextInterval = 86401
    return {
        timeMoment,
        dayTimeMoment,
        eventTimeMoment,
        nextInterval,
    }
}


export function addTestStatusesUsers (entitiesStages: IEntitiesStages, quantity: number): void {
    const created = fetchEntityStageField(entitiesStages, StageFieldName.created)
    created.forEach((createAction, index) => {
        for(let i = 0; i < 10; ++i) {
            const stage = copyStage2(StageFieldName.status, createAction, {status_id: i, pipeline_id: 0}, createAction.time + i * 745)
            entitiesStages.addEntityFieldStage(stage)
        }
        const stage = copyStage2(StageFieldName.responsible_user_id, createAction, index % 4, createAction.time)
        entitiesStages.addEntityFieldStage(stage)
    })
}

function copyStage2(field_name: StageFieldName, stage: IEntityFieldStage, value: any, time:number = null): IEntityFieldStage {
    time = time || stage.time + nextInterval
    return {
        entity_id: stage.entity_id,
        entity_type: stage.entity_type,
        field_name,
        init_user_id: stage.init_user_id,
        time,
        value,
    }
}

export function createTestEntitiesStages (fieldName: StageFieldName, quantity = 1000, entity_type: EntityGroup = EntityGroup.leads): IEntitiesStages {
    const entitiesStages = TestEntitiesStagesFactory.createEntitiesStages(entity_type)
    const created = randomEntityFieldStages(entity_type, StageFieldName.created, quantity)
    const targetField = fieldName ? created.map(i => copyStage(fieldName, i)) : []
    created.forEach(stage => entitiesStages.addEntityFieldStage(stage))
    targetField.forEach(stage => entitiesStages.addEntityFieldStage(stage))
    return entitiesStages
}

export function randomEntityFieldStages(entity_type: EntityGroup = Func.randomNumber(3), field_name = null, quantity: number = 100): IEntityFieldStage[] {
    const fieldStages = []
    for (let i = 0; i < quantity; i++) {
        fieldStages.push(createRandomEntityFieldStage(field_name, entity_type))
    }
    return fieldStages
}

export function addTestFields(entitiesStages: IEntitiesStages, fieldName: StageFieldName, time: number = null): void {
    const createActions: IEntityFieldStage[]|any = fetchEntityStageField(entitiesStages, StageFieldName.created)
    const targetFields = createActions.map(i => copyStage(fieldName, i, time))
    targetFields.forEach(i => entitiesStages.addEntityFieldStage(i))
}

function fetchEntityStageField(entitiesStages: IEntitiesStages, fieldName: StageFieldName): IEntityFieldStage[] {
    return Object
        .values(entitiesStages.entities)
        .flatMap((entity: IEntityStage) => {
            const fieldAction: IFieldAction|any = Object.values(entity.field_stages[fieldName].stages)[0]
            return Object.assign({}, fieldAction, {entity_id: entity.entity_id, entity_type: entity.entity_type})
        })
}

function createRandomEntityFieldStage(field_name = null, entity_type: EntityGroup = Func.randomOnIntervalForTests(1, 3), time = eventTimeMoment): IEntityFieldStage {
    field_name = field_name || Func.randomOnIntervalForTests(1, 7)
    return {
        entity_id: Func.randomNumber(9999999999999),
        entity_type,
        field_name,
        init_user_id: Func.randomNumber(3),
        time,
        value: randomValue(field_name)
    }
}

function copyStage(field_name: StageFieldName, stage: IEntityFieldStage, time:number = null): IEntityFieldStage {
    time = time || stage.time + nextInterval
    return {
        entity_id: stage.entity_id,
        entity_type: stage.entity_type,
        field_name,
        init_user_id: stage.init_user_id,
        time,
        value: randomValue(field_name)
    }
}

function randomValue(fieldName: StageFieldName): number|IStatus {
    if(fieldName === StageFieldName.status)
        return {status_id: Func.randomNumber(3), pipeline_id: Func.randomNumber(3)}
    if(fieldName === StageFieldName.responsible_user_id)
        return Func.randomNumber(10)
    return Func.randomOnIntervalForTests(1, 999999)
}

export function checkTestCounterValue(photos: IPhoto[], counterName: StageFieldName, expectedValue: number): void {
    let actualQuantity = photos.map(i => i.counters_values[counterName] || 0).reduce((val, current) => val + current)
    chai.assert(actualQuantity === expectedValue)
}

export function checkTestListValue(entitiesStages: IEntitiesStages, fieldName: StageFieldName): void {
    const actions: IFieldAction[]|any = Object.values(entitiesStages.entities).flatMap((entity: IEntityStage) => Object.values(entity.field_stages[fieldName].stages)[0])
    const valuesList = actions.map((i: IFieldAction) => i.value)
    const expectedSum = valuesList.reduce((a, b) => a + b)
    const expectedMin = getMin(valuesList)
    const expectedMax = getMax(valuesList)

    const photos = entitiesStages.photos(timeMoment + nextInterval)
    checkSumValue(photos, fieldName, expectedSum)
    checkMinValue(photos, fieldName, expectedMin)
    checkMaxValue(photos, fieldName, expectedMax)
}

function checkSumValue (photos: IPhoto[], counterName: StageFieldName, expectedValue: number): void {
    let actualSum = photos.flatMap(i => i.values_lists[counterName] || 0).reduce((val, current) => val + current)
    chai.assert(actualSum === expectedValue)
}

function checkMinValue (photos: IPhoto[], counterName: StageFieldName, expectedMin: number): void {
    let list = photos.flatMap(i => i.values_lists[counterName] || 0)
    const actualMin = getMin(list)
    chai.assert(actualMin === expectedMin)
}

function checkMaxValue (photos: IPhoto[], counterName: StageFieldName, expectedMax: number): void {
    let list = photos.flatMap(i => i.values_lists[counterName] || 0)
    const actualMin = getMax(list)
    chai.assert(actualMin === expectedMax)
}

function getMin(valuesList: number[]): number {
    let min
    valuesList.forEach(value => {
        if (!min && min !== 0 || min > value) min = value
    })
    return min
}

function getMax(valuesList: number[]): number {
    let max
    valuesList.forEach(value => {
        if (!max && max !== 0 || max < value) max = value
    })
    return max
}

export function checkTestConversions(photo: IPhoto, expectedDuration: number): void {
    const cancelled: number[] = photo.metric_values[ValueName.status_cancelled_counter]
    const output: number[] = photo.metric_values[ValueName.status_output_counter]
    const durations: number[] = photo.metric_values[ValueName.status_durations]
    chai.assert(cancelled.length === output.length)
    chai.assert(output.length === durations.length)

    if(photo.status_id === 1) //cancelled status
        cancelled.forEach(i => chai.assert(i === 1))
    else
        cancelled.forEach(i => chai.assert(i === 0))

    output.forEach(i => chai.assert(i === 1))
    durations.forEach(i => chai.assert(i === expectedDuration))
}