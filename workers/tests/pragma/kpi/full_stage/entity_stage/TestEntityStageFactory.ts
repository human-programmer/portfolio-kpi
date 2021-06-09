import IEntityStageStruct = IEvents.IEntityStageStruct;
import {Func} from "../../../../../../generals/Func";
import {IEvents} from "../../../../../pragma/kpi/IEvents";
import IEntityStage = IEvents.IEntityStage;
import {EntityStage, IFieldStages} from "../../../../../pragma/kpi/full_stage/EntityStage";
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import StageFieldName = IKPI.StageFieldName;
import IStatusTypes = IEvents.IStatusTypes;
import IStatus = IKPI.IStatus;
import IEntityFieldStage = IKPI.IEntityFieldStage;
import IEntity = IKPI.IEntity;
import IFieldAction = IKPI.IFieldAction;
import {Generals} from "../../../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;


const chai = require('chai')

export class TestEntityStageFactory {
    static uniqueCancelledLeadEntityStage(timeCreate?: number | null, isDeleted: boolean = !!Func.randomNumber(2)): IEntityStage {
        const struct = TestEntityStageFactory.uniqueLeadEntityStageStruct(timeCreate, isDeleted)
        const types = TestEntityStageFactory.createTestStatusTypes()
        const statusesStage = struct.field_stages[StageFieldName.status].stages
        const statuses: any[] = Object.values(statusesStage)
        const lastTime = statuses[statuses.length - 1].time
        statusesStage[lastTime + 100] = TestEntityStageFactory.cancelledStatusStage(lastTime + 100)
        return new EntityStage(struct, types)
    }
    static uniqueLeadEntityStage(timeCreate?: number | null, isDeleted: boolean = !!Func.randomNumber(2)): IEntityStage {
        const struct = TestEntityStageFactory.uniqueLeadEntityStageStruct(timeCreate, isDeleted)
        const types = TestEntityStageFactory.createTestStatusTypes()
        return new EntityStage(struct, types)
    }

    static uniqueLeadEntityStageStruct(time_create?: number, isDeleted: boolean = !!Func.randomNumber(2)): IEntityStageStruct {
        time_create = time_create || Func.randomNumber(1000000000)
        const time_delete = isDeleted ? (86400 * 100 + time_create) : 0
        const entity_type = EntityGroup.leads
        const id = Func.randomNumber(9999999999)
        const field_stages = TestEntityStageFactory.uniqueFieldStagesObject(time_create, {entity_type, entity_id: id})
        if(!time_delete)
            delete field_stages[StageFieldName.deleted]
        else {
            field_stages[StageFieldName.deleted] = {
                field_name: StageFieldName.deleted,
                stages: {[time_delete]: TestEntityStageFactory.uniqueFieldStage(StageFieldName.deleted, time_delete, time_delete, {entity_id: id, entity_type})}
            }
        }
        return {
            entity_type,
            field_stages,
            entity_id: id,
            time_create,
        }
    }
    static uniqueNoLeadEntityStage(timeCreate?: number | null, isDeleted: boolean = !!Func.randomNumber(2)): IEntityStage {
        const struct = TestEntityStageFactory.uniqueNoLeadEntityStageStruct(timeCreate, isDeleted)
        const types = TestEntityStageFactory.createTestStatusTypes()
        return new EntityStage(struct, types)
    }

    static uniqueNoLeadEntityStageStruct(time_create?: number, isDeleted: boolean = !!Func.randomNumber(2)): IEntityStageStruct {
        time_create = time_create || Func.randomNumber(1000000000)
        const time_delete = isDeleted ? (86400 * 100 + time_create) : 0
        const entity_type = EntityGroup.contacts
        const id = Func.randomNumber(9999999999)
        const field_stages = TestEntityStageFactory.uniqueFieldStagesObject(time_create, {entity_type, entity_id: id})
        if(!time_delete)
            delete field_stages[StageFieldName.deleted]
        else {
            field_stages[StageFieldName.deleted] = {
                field_name: StageFieldName.deleted,
                stages: {[time_delete]: TestEntityStageFactory.uniqueFieldStage(StageFieldName.deleted, time_delete, time_delete, {entity_id: id, entity_type})}
            }
        }
        return {
            entity_type,
            field_stages,
            entity_id: id,
            time_create,
        }
    }

    static uniqueFieldStagesObject(time: number, entity: IEntity): object {
        const obj: object = {}
        TestEntityStageFactory.uniqueFieldStages(time, entity).forEach(stage => obj[stage.field_name] = stage)
        return obj
    }

    static uniqueFieldStages(createTime: number, entity: IEntity): IFieldStages[] {
        return TestEntityStageFactory.allFieldNames().map(fieldName => TestEntityStageFactory.uniqueIFieldStages(fieldName, createTime, entity))
    }

    static uniqueIFieldStages(name: StageFieldName, createTime: number, entity: IEntity): IFieldStages {
        const fieldStages: IFieldStages = {field_name: name, stages: {}}
        for (let i = 0; i < 10; i++) {
            const fieldTime = createTime + 100 * i
            fieldStages.stages[fieldTime] = TestEntityStageFactory.uniqueFieldStage(name, undefined, fieldTime, entity)
        }
        return fieldStages
    }

    static uniqueFieldStage(field_name?: StageFieldName, value?: any, time?: number, entity?: IEntity): IEntityFieldStage {
        return {
            entity_id: entity ? entity.entity_id : Func.randomNumber(9999999999),
            entity_type: entity ? entity.entity_type : Func.randomOnIntervalForTests(1, 4),
            field_name: field_name ? field_name : Func.randomNumber(10),
            init_user_id: Func.randomNumber(99999999),
            time: time ? time : Func.randomNumber(9999999999),
            value: TestEntityStageFactory.randomValue(field_name)
        }
    }

    static randomValue(fieldName: StageFieldName): number|IStatus|any {
        if(fieldName === StageFieldName.status)
            return {status_id: Func.randomNumber(6666668374), pipeline_id: Func.randomNumber(888888888)}
        return Math.random() * Func.randomNumber(888888)
    }

    static allFieldNames(): StageFieldName[] {
        return [
            StageFieldName.status,
            StageFieldName.responsible_user_id,
            StageFieldName.price,
            StageFieldName.created,
            // StageFieldName.deleted,
            StageFieldName.recovery,
        ]
    }

    static createTestStatusTypes(): IStatusTypes {
        return new TestStatusTypes()
    }

    static cancelledStatusStage(time: number): IFieldAction {
        return {field_name: StageFieldName.status, init_user_id: 0, time, value: TestEntityStageFactory.cancelledStatus()}
    }

    static cancelledStatus(): IStatus {
        return {status_id: 2, pipeline_id: Func.randomNumber(6666668374)}
    }
}

export class TestStatusTypes implements IStatusTypes {
    readonly successes = [1]
    readonly cancelled = [2]

    isActive(status: IStatus): boolean {
        return !this.isSuccess(status) && !this.isCancelled(status)
    }

    isCancelled(status: IStatus): boolean {
        return this.cancelled.indexOf(status.status_id) !== -1
    }

    isSuccess(status: IStatus): boolean {
        return this.successes.indexOf(status.status_id) !== -1
    }
}

export function compareTestEntitiesStages(expected: IEntityStageStruct, actual: IEntityStageStruct): void {
    chai.assert(expected.entity_id === actual.entity_id)
    chai.assert(expected.entity_type === actual.entity_type)
    chai.assert(expected.time_create === actual.time_create)
    compareFieldStagesObject(expected.field_stages, actual.field_stages)
}

export function compareFieldStagesObject (expected: object, actual: object): void {
    const expectedArr: IEntityFieldStage[] = Object.values(expected)
    const actualArr: IEntityFieldStage[] = Object.values(actual)
    chai.assert(expectedArr.length === actualArr.length)
    expectedArr.forEach(expect => compareTestIFieldStages(expected[expect.field_name], actual[expect.field_name]))
}

export function compareTestIFieldStages(expected: IFieldStages, actual: IFieldStages): void {
    const expectArrTimes = Object.keys(expected.stages)
    const actualArrTimes = Object.keys(actual.stages)
    chai.assert(expectArrTimes.length === actualArrTimes.length)
    expectArrTimes.forEach(time => compareTestFieldStages(expected.stages[time], actual.stages[time]))
}

export function compareTestArrFieldStages(expect: IEntityFieldStage[], actual: IEntityFieldStage[]): void {
    chai.assert(expect.length === actual.length)
    expect.forEach(e => compareTestFieldStages(e, actual.find(stage => stage.field_name === e.field_name)))
}

export function compareTestFieldStages(expected: IEntityFieldStage, actual: IEntityFieldStage): void {
    compareTestFieldActions(expected, actual)
    chai.assert(expected.entity_id === actual.entity_id)
    chai.assert(expected.entity_type === actual.entity_type)
}

export function compareTestFieldActions(expected: IFieldAction, actual: IFieldAction): void {
    if(typeof expected.value === "object") {
        const expKeys = Object.keys(expected.value)
        const actKeys = Object.keys(actual.value)
        chai.assert(expKeys.length === actKeys.length)
        expKeys.find(expKey => chai.assert(expected.value[expKey] === actual.value[expKey]))
    } else
        chai.assert(expected.value === actual.value)
    chai.assert(expected.init_user_id === actual.init_user_id)
    chai.assert(expected.field_name === actual.field_name)
    chai.assert(expected.time === actual.time)
}

export function belongTheEntity(e1: IEntity, e2: IEntity): void {
    chai.assert(e1.entity_id === e2.entity_id)
    chai.assert(e1.entity_type === e2.entity_type)
}

export function isDefaultTestFieldAction(fieldAction: IFieldAction, fieldName: StageFieldName): void {
    chai.assert(fieldAction.field_name === fieldName)
    chai.assert(fieldAction.time === 0)
    chai.assert(fieldAction.init_user_id === 0)
    if(fieldName === StageFieldName.status)
        isDefaultTestStatus(fieldAction.value)
    else
        chai.assert(fieldAction.value === 0)
}

export function isDefaultTestStatus(status: IStatus): void {
    chai.assert(status.pipeline_id === 0)
    chai.assert(status.status_id === 0)
}