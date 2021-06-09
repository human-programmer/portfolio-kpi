import {IEvents} from "../../../../../pragma/kpi/IEvents";
import IAccStageStruct = IEvents.IAccStageStruct;
import {Func} from "../../../../../../generals/Func";
import {AccStage} from "../../../../../pragma/kpi/full_stage/AccStage";
import {TestEntityStageFactory, TestStatusTypes} from "../entity_stage/TestEntityStageFactory";
import {Generals} from "../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import StageFieldName = IKPI.StageFieldName;
import IEntitiesStages = IEvents.IEntitiesStages;
import {
    addTestFields,
    checkTestCounterValue,
    checkTestListValue,
    createTestEntitiesStages, TestEntitiesStagesFactory
} from "../entitiesStage/TestEntitiesStagesFactory";
import IAccStage = IEvents.IAccStage;
import IPhoto = IKPI.IPhoto;
import isCounterField = IKPI.isCounterField;
import isListField = IKPI.isListField;
import IEntityFieldStage = IKPI.IEntityFieldStage;
import IEntitiesStagesStruct = IEvents.IEntitiesStagesStruct;

const chai = require('chai')

export class TestAccStageFactory {
    static uniqueEmptyAccStageStruct(): IAccStageStruct {
        return {
            account_id: Func.randomOnIntervalForTests(1, 999999999999),
            entity_stages: undefined,
            last_day: 0,
            start_day: 0
        }
    }

    static uniqueAccEntityFieldStage(): IEntityFieldStage {
        return TestEntityStageFactory.uniqueFieldStage();
    }
}

export class TestAccStage extends AccStage {
    constructor(stageFieldsNames: StageFieldName[], quantityFields: number = 1000, emptyStruct = TestAccStageFactory.uniqueEmptyAccStageStruct(), types = new TestStatusTypes()) {
        super(emptyStruct, types)
        this.entity_stages[EntityGroup.leads] = createEntitiesStages(stageFieldsNames, EntityGroup.leads, quantityFields)
        this.entity_stages[EntityGroup.customers] = createEntitiesStages(stageFieldsNames, EntityGroup.customers, quantityFields)
        this.entity_stages[EntityGroup.companies] = createEntitiesStages(stageFieldsNames, EntityGroup.companies, quantityFields)
        this.entity_stages[EntityGroup.contacts] = createEntitiesStages(stageFieldsNames, EntityGroup.contacts, quantityFields)
    }

    static createNewStruct(group_name: EntityGroup): IEntitiesStagesStruct {
        return super.createNewStruct(group_name)
    }
}

function createEntitiesStages(fieldNames: StageFieldName[], entityType: EntityGroup, quantityFields: number): IEntitiesStages {
    const stages = createTestEntitiesStages(null, quantityFields, entityType)
    fieldNames.forEach(name => addTestFields(stages, name))
    return stages
}

export function checkTestAccStagePhotos(accStage: IAccStage, expectedFields: StageFieldName[], quantity: number, momentTime: number): void {
    const photosArr = accStage.photos(momentTime)
    const photosObj = accStage.photosByGroups(momentTime)
    const allPhotosInGroups = [].concat(...Object.values(photosObj))
    chai.assert(allPhotosInGroups.length === photosArr.length)
    checkCreatedObject(expectedFields, photosObj, quantity)
}

function checkCreatedObject(expectedFields: StageFieldName[], photoObj: object, quantity: number): void {
    if(expectedFields.length) {
        const counters = expectedFields.filter(i => isCounterField(i))
        const lists = expectedFields.filter(i => isListField(i))
        counters.forEach(name => checkCounters(photoObj, name, quantity))
        return lists.forEach(name => checkLists(photoObj, name, quantity))
    }
    return checkCounters(photoObj, StageFieldName.created, quantity)
}

function checkCounters(photoObj: object, fieldName: StageFieldName, expectedCounter: number): void {
    checkTestCounterValue(Object.values(photoObj[EntityGroup.leads]), fieldName, expectedCounter)
    checkTestCounterValue(Object.values(photoObj[EntityGroup.customers]), fieldName, expectedCounter)
    checkTestCounterValue(Object.values(photoObj[EntityGroup.companies]), fieldName, expectedCounter)
    checkTestCounterValue(Object.values(photoObj[EntityGroup.contacts]), fieldName, expectedCounter)
}

function checkLists(photoObj: object, fieldName: StageFieldName, expectedCounter: number): void {
    checkList(Object.values(photoObj[EntityGroup.leads]), fieldName, expectedCounter)
    checkList(Object.values(photoObj[EntityGroup.customers]), fieldName, expectedCounter)
    checkList(Object.values(photoObj[EntityGroup.companies]), fieldName, expectedCounter)
    checkList(Object.values(photoObj[EntityGroup.contacts]), fieldName, expectedCounter)
}

function checkList(photos: IPhoto[], name: StageFieldName, expectedQuantity: number): void {
    const values = photos.flatMap(i => i.values_lists[name])
    chai.assert(values.length === expectedQuantity)
}