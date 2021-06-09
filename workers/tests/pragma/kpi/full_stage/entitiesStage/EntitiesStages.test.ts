import {
    addTestStatusesUsers,
    addTestFields, checkTestConversions,
    checkTestCounterValue, checkTestListValue,
    createTestEntitiesStages,
    getTestTimes,
    randomEntityFieldStages,
    TestEntitiesStagesFactory
} from "./TestEntitiesStagesFactory";
import {Generals} from "../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import StageFieldName = IKPI.StageFieldName;
import {compareTestFieldActions, isDefaultTestFieldAction} from "../entity_stage/TestEntityStageFactory";
import IPhoto = IKPI.IPhoto;
import ValueName = IKPI.ValueName;

const chai = require('chai')

const {
    timeMoment,
    dayTimeMoment,
    eventTimeMoment,
    nextInterval,
} = getTestTimes()

export async function testEntitiesStages(): Promise<void> {
    describe('EntitiesStages', () => {
        it('constructor', () => {
            const stages = TestEntitiesStagesFactory.createEntitiesStages(EntityGroup.leads)
            chai.assert(stages.group_name === EntityGroup.leads)
            chai.assert(typeof stages.entities === "object")
        })
        it('addEntityFieldStage and getFieldAction', () => {
            const entitiesStages = TestEntitiesStagesFactory.createEntitiesStages(EntityGroup.leads)
            const stages = randomEntityFieldStages(EntityGroup.leads)
            stages.forEach(fieldStage => {
                entitiesStages.addEntityFieldStage(fieldStage)
                const defaultFieldAction2 = entitiesStages.getFieldAction(fieldStage)
                compareTestFieldActions(fieldStage, defaultFieldAction2)
            })
        })
        it('getFieldAction', () => {
            const entitiesStages = TestEntitiesStagesFactory.createEntitiesStages(EntityGroup.leads)
            const stages = randomEntityFieldStages(EntityGroup.leads)
            stages.forEach(fieldStage => {
                const defaultFieldAction = entitiesStages.getFieldAction(fieldStage)
                isDefaultTestFieldAction(defaultFieldAction, fieldStage.field_name)
                entitiesStages.addEntityFieldStage(fieldStage)
                const defaultFieldAction2 = entitiesStages.getFieldAction(fieldStage)
                compareTestFieldActions(fieldStage, defaultFieldAction2)
            })
        })
        it('entities', () => {
            const entitiesStages = TestEntitiesStagesFactory.createEntitiesStages(EntityGroup.leads)
            const stages = randomEntityFieldStages(EntityGroup.leads)
            stages.forEach(fieldStage => {
                entitiesStages.addEntityFieldStage(fieldStage)
                const entity = entitiesStages.entities[fieldStage.entity_id]
                chai.assert(entity.entity_id === fieldStage.entity_id)
                chai.assert(entity.entity_type === fieldStage.entity_type)
                chai.assert(entity.time_create === fieldStage.time)
                chai.assert(Object.values(entity.field_stages).length === 1)
            })
        })

        describe('photos', () => {
            it('created', () => {
                const quantity = 1000
                const entitiesStages = createTestEntitiesStages(null, quantity)
                const photos = entitiesStages.photos(timeMoment)
                checkTestCounterValue(photos, StageFieldName.created, quantity)
            })
            it('deleted', () => {
                const quantity = 1000
                const entitiesStages = createTestEntitiesStages(StageFieldName.deleted, quantity)
                const photos = entitiesStages.photos(eventTimeMoment + nextInterval + 1)
                checkTestCounterValue(photos, StageFieldName.deleted, quantity)
            })
            it('entities_counter', () => {
                const quantity = 1000
                const entitiesStages = createTestEntitiesStages(null, quantity)
                const photos = entitiesStages.photos(timeMoment)
                checkTestCounterValue(photos, StageFieldName.entities_counter, quantity)
            })
            it('price', () => {
                const quantity = 1000
                const entitiesStages = createTestEntitiesStages(StageFieldName.price, quantity)
                checkTestListValue(entitiesStages, StageFieldName.price)
            })
            it('price with responsible', () => {
                const quantity = 1000
                const entitiesStages = createTestEntitiesStages(StageFieldName.price, quantity)
                addTestFields(entitiesStages, StageFieldName.responsible_user_id)
                chai.assert(entitiesStages.photos(timeMoment + nextInterval).length > 1)
                checkTestListValue(entitiesStages, StageFieldName.price)
            })
            it('price with status', () => {
                const quantity = 1000
                const entitiesStages = createTestEntitiesStages(StageFieldName.price, quantity)
                addTestFields(entitiesStages, StageFieldName.status)
                chai.assert(entitiesStages.photos(timeMoment + nextInterval).length > 1)
                checkTestListValue(entitiesStages, StageFieldName.price)
            })
            it('price with status and responsible', () => {
                const quantity = 10000
                const entitiesStages = createTestEntitiesStages(StageFieldName.price, quantity)
                addTestFields(entitiesStages, StageFieldName.responsible_user_id)
                addTestFields(entitiesStages, StageFieldName.status)
                chai.assert(entitiesStages.photos(timeMoment + nextInterval).length > 1)
                checkTestListValue(entitiesStages, StageFieldName.price)
            })
            it('conversion', () => {
                const nextInterval = 745
                const quantity = 1000
                const entitiesStages = createTestEntitiesStages(null, quantity)
                addTestStatusesUsers(entitiesStages, quantity)
                chai.assert(Object.values(entitiesStages.entities).length === quantity)

                const photos = entitiesStages.photos(timeMoment + nextInterval * 10)
                const withoutConversion = photos.filter(i => i.status_id === 9)
                const withConversion = photos.filter(i => i.status_id !== 9)
                chai.assert(withoutConversion.length === 4)
                chai.assert(withConversion.length === 10 * 4 - 4)
                withConversion.forEach(photo => {
                    checkTestConversions(photo, nextInterval)
                })
            })
            it('check price, statuses counters', () => {
                const nextInterval = 745
                const quantity = 3
                const entitiesStages = createTestEntitiesStages(null, quantity)
                addTestStatusesUsers(entitiesStages, quantity)
                addTestFields(entitiesStages, StageFieldName.price, eventTimeMoment + nextInterval)
                chai.assert(Object.values(entitiesStages.entities).length === quantity)
                const photos = entitiesStages.photos(timeMoment + nextInterval * 10)
                const withConversion = photos.filter(i => i.status_id !== 9)
                const {durations, cancelled, output} = fetchConversionParams(withConversion)
                const prices = fetchPrices(photos)
                const entity_counter = fetchEntityCounter(photos)
                chai.assert(durations.length === cancelled.length)
                chai.assert(cancelled.length === cancelled.length)
                chai.assert(output.length === output.length)
                chai.assert(prices.length === quantity)
                chai.assert(entity_counter === quantity)
                chai.assert(prices.length * 9 === output.length)
            })
        })
    })

    // const entitiesStages = createEntitiesStages(StageFieldName.status, 2000000)
    // addFields(entitiesStages, StageFieldName.price)
    // addFields(entitiesStages, StageFieldName.responsible_user_id)
    // console.log('NEXT')
    // const startTime = new Date().getTime()
    // const photos = entitiesStages.photos(timeMoment + nextInterval + 1)
    // const endTime = new Date().getTime()
    // console.log('DURATION: ', endTime - startTime)
    // chai.assert(true)
}

function fetchConversionParams(photos: IPhoto[]): any {
    return {
        durations: photos.flatMap(i => i.metric_values[ValueName.status_durations]),
        cancelled: photos.flatMap(i => i.metric_values[ValueName.status_cancelled_counter]),
        output: photos.flatMap(i => i.metric_values[ValueName.status_output_counter]),
    }
}

function fetchPrices(photos: IPhoto[]): any {
    return photos.filter(i => StageFieldName.price in i.values_lists).flatMap(i => i.values_lists[StageFieldName.price])
}

function fetchEntityCounter(photos: IPhoto[]): number {
    return photos.flatMap(i => i.counters_values[StageFieldName.entities_counter] || 0).reduce((a, b) => a + b)
}