import {IEvents} from "../../../../pragma/kpi/IEvents";
import IEntityStageStruct = IEvents.IEntityStageStruct;
import {Func} from "../../../../../generals/Func";
import IEntityFieldStage = IEvents.IEntityFieldStage;
import IEntity = IEvents.IEntity;
import {Generals} from "../../../../../generals/Interfaces";
import ITimeInterval = Generals.ITimeInterval;
import StageFieldName = IEvents.StageFieldName;

export class TestFullStageFactory {
    static uniqueStageStruct(): IEntityStageStruct {
        const time_create = Func.randomNumber(1000000000)
        const time_delete = Func.randomNumber(2) ? 0 : (86400 * 100 + time_create)
        const interval: ITimeInterval = {start: time_create, end: time_delete}
        const entity_type = Func.randomNumber(4)
        const id = Func.randomNumber(9999999999)
        return {
            entity_type,
            field_stages: TestFullStageFactory.uniqueFieldStagesObject(interval, {entity_type, entity_id: id}),
            entity_id: id,
            time_create,
            time_delete,
        }
    }

    static uniqueFieldStagesObject(time?: ITimeInterval, entity?: IEntity): object {
        const obj: object = {}
        TestFullStageFactory.uniqueFieldStages(time, entity).forEach(stage => obj[stage.field_name] = stage)
        return obj
    }

    static uniqueFieldStages(time?: ITimeInterval, entity?: IEntity): IEntityFieldStage[] {
        return TestFullStageFactory.allFieldNames().map(fieldName => TestFullStageFactory.uniqueFieldStage(fieldName, null, time, entity))
    }

    static uniqueFieldStage(field_name?: StageFieldName, value?: any, time?: ITimeInterval, entity?: IEntity): IEntityFieldStage {
        return {
            entity_id: entity ? entity.entity_id : Func.randomNumber(9999999999),
            entity_type: entity ? entity.entity_type : Func.randomNumber(4),
            field_name: field_name ? field_name : Func.randomNumber(10),
            init_user_id: Func.randomNumber(99999999),
            time: time ? Func.randomOnIntervalForTests(time.start, time.end) : Func.randomNumber(9999999999),
            value: (value || value === 0) ? value : Math.random()
        }
    }

    static allFieldNames(): StageFieldName[] {
        return [
            StageFieldName.status,
            StageFieldName.responsible_user_id,
            StageFieldName.price,
            StageFieldName.created,
            StageFieldName.deleted,
            StageFieldName.recovery,
        ]
    }
}