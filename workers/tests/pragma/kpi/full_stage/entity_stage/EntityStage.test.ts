import {
    belongTheEntity,
    compareTestEntitiesStages,
    compareTestFieldActions,
    compareTestFieldStages, isDefaultTestStatus, isDefaultTestFieldAction,
    TestEntityStageFactory, TestStatusTypes
} from "./TestEntityStageFactory";
import {EntityStage, IFieldStages} from "../../../../../pragma/kpi/full_stage/EntityStage";
import {IEvents} from "../../../../../pragma/kpi/IEvents";
import IEntityStage = IEvents.IEntityStage;
import {Func} from "../../../../../../generals/Func";
import {IKPI} from "../../../../../pragma/kpi/IKPI";
import IField = IKPI.IField;
import StageFieldName = IKPI.StageFieldName;
import IPhoto = IKPI.IPhoto;
import ValueName = IKPI.ValueName;
import IFieldAction = IKPI.IFieldAction;
import IStatus = IKPI.IStatus;
import IEntityFieldStage = IKPI.IEntityFieldStage;
import assembleAtomId = IKPI.assembleAtomId;
import IAtom = IKPI.IAtom;
import getGeneralFields = IKPI.getGeneralFields;

const chai = require('chai')

export async function testEntityStage(): Promise<void> {
    describe('EntityStage', () => {
        it('constructor', () => {
            const struct = TestEntityStageFactory.uniqueNoLeadEntityStageStruct()
            const types = TestEntityStageFactory.createTestStatusTypes()
            const stage = new EntityStage(struct, types)
            compareTestEntitiesStages(struct, stage)
        })

        describe('no leads', () => {
            it('getFieldAction', () => {
                const entityStage = TestEntityStageFactory.uniqueNoLeadEntityStage()
                const field1: IField = {field_name: StageFieldName.responsible_user_id, time: entityStage.time_create + 4 * 100}
                const field2: IField = {field_name: StageFieldName.responsible_user_id, time: entityStage.time_create + 5 * 100 + 50}
                const fields = entityStage.field_stages[field1.field_name].stages

                const actualField1 = entityStage.getFieldAction(field1)
                const actualField2 = entityStage.getFieldAction(field2)
                chai.assert(field1.time === actualField1.time)
                chai.assert(field2.time - 50 === actualField2.time)
                compareTestFieldActions(fields[field1.time], actualField1)
                compareTestFieldActions(fields[field2.time - 50], actualField2)
            })

            it('addFieldAction', () => {
                const entityStage = TestEntityStageFactory.uniqueNoLeadEntityStage()
                const time = entityStage.time_create + 777
                const newStages = TestEntityStageFactory.allFieldNames().map(name => TestEntityStageFactory.uniqueFieldStage(name, 0, time))
                newStages.forEach(fieldStage => {
                    const stages = entityStage.field_stages[fieldStage.field_name].stages
                    chai.assert(!stages[time])
                    entityStage.addFieldAction(fieldStage)
                    const actual = entityStage.getFieldAction({field_name: fieldStage.field_name, time: fieldStage.time})
                    compareTestFieldActions(stages[fieldStage.time], actual)
                })
            })

            it('getFieldValue', () => {
                const entityStage = TestEntityStageFactory.uniqueNoLeadEntityStage()
                const time = entityStage.time_create + 555
                const newStages = TestEntityStageFactory.allFieldNames().map(name => TestEntityStageFactory.uniqueFieldStage(name, 0, time))
                newStages.forEach(fieldStage => {
                    const stages = entityStage.field_stages[fieldStage.field_name].stages
                    chai.assert(!stages[time])
                    entityStage.addFieldAction(fieldStage)
                    const actual = entityStage.getFieldAction({field_name: fieldStage.field_name, time: fieldStage.time})
                    chai.assert(stages[fieldStage.time].value === actual.value)
                })
            })

            it('isDeletedInTime', () => {
                const time_create = Math.trunc(new Date().getTime() / 1000 - 86400 * 1000)
                const deleteTime = time_create + 86400 * 100
                const entity = TestEntityStageFactory.uniqueNoLeadEntityStage(time_create, false)
                // @ts-ignore
                entity.field_stages = {}
                const deleteAction = TestEntityStageFactory.uniqueFieldStage(StageFieldName.deleted, deleteTime, deleteTime, entity)
                entity.addFieldAction(deleteAction)

                chai.assert(entity.isDeletedInTime(deleteTime))
                chai.assert(entity.isDeletedInTime(deleteTime + 1))
                chai.assert(entity.isDeletedInTime(deleteTime + 100000))
                chai.assert(!entity.isDeletedInTime(deleteTime - 1))
                chai.assert(!entity.isDeletedInTime(deleteTime - 10000))
            })

            it('isDeletedInTime recovery', () => {
                const time_create = Math.trunc(new Date().getTime() / 1000 - 86400 * 1000)
                const deleteTime = time_create + 86400 * 100
                const recoveryTime = deleteTime + 86400 * 100
                const entity = TestEntityStageFactory.uniqueNoLeadEntityStage(time_create, false)
                // @ts-ignore
                entity.field_stages = {}
                const deleteAction = TestEntityStageFactory.uniqueFieldStage(StageFieldName.deleted, deleteTime, deleteTime, entity)
                const recoveryAction = TestEntityStageFactory.uniqueFieldStage(StageFieldName.recovery, recoveryTime, recoveryTime, entity)
                entity.addFieldAction(deleteAction)
                entity.addFieldAction(recoveryAction)

                chai.assert(entity.isDeletedInTime(deleteTime))
                chai.assert(entity.isDeletedInTime(deleteTime + 1))
                chai.assert(entity.isDeletedInTime(deleteTime + 100000))
                chai.assert(entity.isDeletedInTime(recoveryTime - 1))
                chai.assert(!entity.isDeletedInTime(recoveryTime))
                chai.assert(!entity.isDeletedInTime(recoveryTime + 1))
                chai.assert(!entity.isDeletedInTime(recoveryTime + 10000))
            })

            it('isDeletedOnDay', () => {
                const time_create = Math.trunc(new Date().getTime() / 1000 - 86400 * 1000)
                const deleteTime = time_create + 86400 * 100
                const deletedDay = Func.truncSeconds(deleteTime)
                const entity = TestEntityStageFactory.uniqueNoLeadEntityStage(time_create, false)
                // @ts-ignore
                entity.field_stages = {}
                const deleteAction = TestEntityStageFactory.uniqueFieldStage(StageFieldName.deleted, deleteTime, deleteTime, entity)
                entity.addFieldAction(deleteAction)
                delete entity.field_stages[StageFieldName.recovery]

                chai.assert(entity.isDeletedOnDay(deletedDay))
                chai.assert(entity.isDeletedOnDay(deletedDay + 86400 - 1))
                chai.assert(!entity.isDeletedOnDay(deletedDay + 86400))
                chai.assert(!entity.isDeletedOnDay(deletedDay - 1))
            })

            it('photos for existing entity', () => {
                const time_create = Math.trunc(new Date().getTime() / 1000)
                const existingEntity = TestEntityStageFactory.uniqueNoLeadEntityStage(time_create, false)
                checkExitingEntityPhotos(existingEntity)
            })

            it('photos for entities deleted in this day', () => {
                const time_create = 1
                const deleteTime = 86400 * 10
                const entity = TestEntityStageFactory.uniqueNoLeadEntityStage(time_create, true)
                delete entity.field_stages[StageFieldName.recovery]
                const deleteAction = TestEntityStageFactory.uniqueFieldStage(StageFieldName.deleted, deleteTime, deleteTime, entity)
                entity.addFieldAction(deleteAction)
                const time = Func.truncSeconds(deleteTime) + 86400 - 1
                const photos = entity.photos(time)
                chai.assert(photos.length === 1)
                chai.assert(photos[0].counters_values[StageFieldName.deleted] === 1);
            })

            it('photos for entities deleted on good day', () => {
                const time_create = 1
                const deleteTime = 86400 * 10
                const entity = TestEntityStageFactory.uniqueNoLeadEntityStage(time_create, true)
                delete entity.field_stages[StageFieldName.recovery]
                const deleteAction = TestEntityStageFactory.uniqueFieldStage(StageFieldName.deleted, deleteTime, deleteTime, entity)
                entity.addFieldAction(deleteAction)
                const time = Func.truncSeconds(deleteAction.time) + 86400
                const photos = entity.photos(time)
                chai.assert(photos.length === 0)
            })

            it('isCreatedOnDay', () => {
                const time_create = 86401
                const entity = TestEntityStageFactory.uniqueLeadEntityStage(time_create, false)
                chai.assert(entity.isCreatedOnDay(86400))
                chai.assert(entity.isCreatedOnDay(172800 - 1))
                chai.assert(!entity.isCreatedOnDay(172800))
                chai.assert(!entity.isCreatedOnDay(86400 - 1))
                chai.assert(!entity.isCreatedOnDay(1))
                chai.assert(!entity.isCreatedOnDay(999999999))
            })

            it('getAtom', () => {
                const entity = new TestEntityStage()
                const times = Object.keys(entity.field_stages[StageFieldName.responsible_user_id].stages)
                times.forEach(key => {
                    const expectedStatusField: IFieldAction = entity.field_stages[StageFieldName.status].stages[key]
                    const expectedUserField: IFieldAction = entity.field_stages[StageFieldName.responsible_user_id].stages[key]
                    const actualAtom = entity.getAtom(Number.parseInt(key), 0)
                    chai.assert(actualAtom.user_id === expectedUserField.value)
                    chai.assert(actualAtom.status_id === expectedStatusField.value.status_id)
                    chai.assert(actualAtom.pipeline_id === expectedStatusField.value.pipeline_id)
                })
            })

            it('emptyPhoto', () => {
                const entity = new TestEntityStage()
                const times = Object.keys(entity.field_stages[StageFieldName.responsible_user_id].stages)
                times.forEach(key => {
                    const timeKey = Number.parseInt(key)
                    const expectedStatusField: IFieldAction = entity.field_stages[StageFieldName.status].stages[key]
                    const expectedUserField: IFieldAction = entity.field_stages[StageFieldName.responsible_user_id].stages[key]
                    const expectGeneralFlag = !!(timeKey % 2)
                    const actualPhoto = entity.emptyPhoto(timeKey, 0, expectGeneralFlag)
                    chai.assert(actualPhoto.atom_id === assembleAtomId(Object.assign({}, expectedStatusField.value, {user_id: expectedUserField.value})))
                    chai.assert(actualPhoto.user_id === expectedUserField.value)
                    chai.assert(actualPhoto.status_id === expectedStatusField.value.status_id)
                    chai.assert(actualPhoto.pipeline_id === expectedStatusField.value.pipeline_id)
                    chai.assert(actualPhoto.is_general === expectGeneralFlag)
                    chai.assert(actualPhoto.time === timeKey)
                    chai.assert(actualPhoto.entity_type === entity.entity_type)
                    chai.assert(typeof actualPhoto.values_lists === "object")
                    chai.assert(typeof actualPhoto.metric_values === "object")
                })
            })

            it('check field times', () => {
                const entity = new TestEntityStage()
                // @ts-ignore
                entity.field_stages = {}
                const quantity = 50
                const fieldActions = createRandomFieldActions(quantity)
                fieldActions.forEach(fieldAction => {
                        entity.addFieldAction(fieldAction)
                    })
                fieldActions.forEach(fieldAction => {
                    const actual = entity.field_stages[fieldAction.field_name].stages[fieldAction.time]
                    compareTestFieldActions(fieldAction, actual)
                })
            })

            it('createTypePhoto', () => {
                const entity = new TestEntityStage()
                // @ts-ignore
                entity.field_stages = {}
                const createdTime = 1
                chai.assert(entity.time_create !== createdTime)
                const createAction = TestEntityStageFactory.uniqueFieldStage(StageFieldName.created, createdTime, createdTime, entity)
                entity.addFieldAction(createAction)
                chai.assert(entity.time_create === createdTime)
                const createdPhoto = entity.createTypePhoto(createdTime + 500)
                chai.assert(createdPhoto.is_general === false)
                chai.assert(createdPhoto.entity_type === entity.entity_type)
                chai.assert(createdPhoto.time === createdTime + 500)
                chai.assert(createdPhoto.user_id === createAction.init_user_id)
            })

            it('deleteTypePhoto', () => {
                const entity = new TestEntityStage()
                // @ts-ignore
                entity.field_stages = {}
                const deleteTime = 1
                const deleteAction = TestEntityStageFactory.uniqueFieldStage(StageFieldName.deleted, deleteTime, deleteTime, entity)
                entity.addFieldAction(deleteAction)
                const createdPhoto = entity.deleteTypePhoto(deleteTime + 500)
                chai.assert(createdPhoto.is_general === false)
                chai.assert(createdPhoto.entity_type === entity.entity_type)
                chai.assert(createdPhoto.time === deleteTime + 500)
                chai.assert(createdPhoto.user_id === deleteAction.init_user_id)
            })
        })

        describe('leads', () => {
            it('photos timeMoment', () => {
                const time_create = 1
                const timeMoment = 86399
                const entity = TestEntityStageFactory.uniqueLeadEntityStage(time_create, false)
                const photos = entity.photos(timeMoment)
                chai.assert(photos.length > 2)
                photos.forEach(i => chai.assert(i.time === timeMoment))
            })
            it('photos for newly created entity', () => {
                const time_create = 1
                const entity = TestEntityStageFactory.uniqueLeadEntityStage(time_create, false)
                const photos = entity.photos(time_create)
                chai.assert(photos.length === 2)
            })
            it('photos for long changed entity', () => {
                const time_create = 1
                const entity = TestEntityStageFactory.uniqueLeadEntityStage(time_create, false)
                const timeMoment = Math.trunc(new Date().getTime() / 1000)
                const photos = entity.photos(timeMoment)
                chai.assert(photos.length === 1)
            })
            it('photos today changed statuses', () => {
                const time_create = 1
                const entity = TestEntityStageFactory.uniqueLeadEntityStage(time_create, false)
                const timeMoment = 86400 - 1
                const photos = entity.photos(timeMoment)
                checkChangedStatusValues(entity, photos)
            })
            it('photos today re-changed statuses with users', () => {
                const time_create = 1
                const entity = TestEntityStageFactory.uniqueLeadEntityStage(time_create, false)
                const timeMoment = 86400 - 1
                setReChangedStatusesWithResponsible(entity)
                const photos = entity.photos(timeMoment)
                checkReChangedStatusesWithUsersValues(entity, photos)
            })
            it('photos today re-changed statuses without users', () => {
                const time_create = 1
                const entity = TestEntityStageFactory.uniqueLeadEntityStage(time_create, false)
                const timeMoment = 86400 - 1
                setReChangedStatuses(entity)
                const photos = entity.photos(timeMoment)
                checkChangedStatusValues(entity, photos)
            })
            it('photos today cancelled statuses', () => {
                const time_create = 1
                const entity = TestEntityStageFactory.uniqueCancelledLeadEntityStage(time_create, false)
                const photos = entity.photos(86400 - 1)
                chai.assert(photos[photos.length - 1].metric_values[ValueName.status_cancelled_counter] === 1)
                chai.assert(photos[photos.length - 1].metric_values[ValueName.status_output_counter] === 1)
                chai.assert(photos[photos.length - 1].metric_values[ValueName.status_durations] === 100)
            })
        })

        describe('Static methods', () => {
            it('defaultFieldsStages', () => {
                const defaultStages = TestEntityStage.defaultFieldsStages(StageFieldName.responsible_user_id)
                chai.assert(defaultStages.field_name === StageFieldName.responsible_user_id)
                chai.assert(typeof defaultStages.stages === "object")
            })
            it('defaultFieldAction', () => {
                const defaultFieldAction = TestEntityStage.defaultFieldAction(StageFieldName.recovery)
                isDefaultTestFieldAction(defaultFieldAction, StageFieldName.recovery)
                const defaultStatusAction = TestEntityStage.defaultFieldAction(StageFieldName.status)
                isDefaultTestFieldAction(defaultStatusAction, StageFieldName.status)
            })
            it('defaultStatus', () => {
                const defaultStatus = TestEntityStage.defaultStatus
                isDefaultTestStatus(defaultStatus)
            })
            it('findTargetFieldValue', () => {
                const quantity = 50
                const fieldActions = createRandomFieldActions(quantity)
                for (let i = 0; i < quantity; ++i) {
                    const targetTime = i * 86400 * 10
                    const value0 = TestEntityStage.findTargetFieldValue(fieldActions, targetTime)
                    const value1 = TestEntityStage.findTargetFieldValue(fieldActions, targetTime + 1)
                    const value2 = TestEntityStage.findTargetFieldValue(fieldActions, targetTime + 86400)
                    const value3 = TestEntityStage.findTargetFieldValue(fieldActions, targetTime - 1)
                    chai.assert(value0 === fieldActions[i])
                    chai.assert(value1 === fieldActions[i])
                    chai.assert(value2 === fieldActions[i])
                    chai.assert(value3 !== fieldActions[i])
                }
            })
            it('getTargetTime', () => {
                const quantity = 50
                const fieldStages = TestEntityStage.defaultFieldsStages(StageFieldName.recovery)
                const fieldActions = createRandomFieldActions(quantity, 10)
                fieldActions.forEach(i => fieldStages.stages[i.time] = i)
                fieldActions.forEach((action, index, arr) => {
                    const time1 = TestEntityStage.getTargetTime(fieldStages.stages, action.time)
                    const time2 = TestEntityStage.getTargetTime(fieldStages.stages, action.time + 1)
                    const time3 = TestEntityStage.getTargetTime(fieldStages.stages, action.time + 86400 * 10 - 1)
                    const time4 = TestEntityStage.getTargetTime(fieldStages.stages, action.time + 86400 * 10)
                    const time5 = TestEntityStage.getTargetTime(fieldStages.stages, action.time + 86400 * 10 + 1)
                    const time6 = TestEntityStage.getTargetTime(fieldStages.stages, action.time - 1)
                    const time7 = TestEntityStage.getTargetTime(fieldStages.stages, action.time - 999999)
                    chai.assert(time1 === action.time)
                    chai.assert(time2 === action.time)
                    chai.assert(time3 === action.time)
                    if(index === arr.length - 1) {
                        chai.assert(time4 === action.time)
                        chai.assert(time5 === action.time)
                    } else {
                        chai.assert(time4 !== action.time)
                        chai.assert(time5 !== action.time)
                    }
                    chai.assert(time6 !== action.time)
                    chai.assert(time7 !== action.time)
                })
            })
            it('fetchFieldValue', () => {
                const quantity = 50
                const fieldStages = TestEntityStage.defaultFieldsStages(StageFieldName.recovery)
                const fieldActions = createRandomFieldActions(quantity, 10)
                fieldActions.forEach(i => fieldStages.stages[i.time] = i)
                fieldActions.forEach((action, index, arr) => {
                    const value1 = TestEntityStage.fetchFieldValue(action.field_name, fieldStages.stages, action.time)
                    const value2 = TestEntityStage.fetchFieldValue(action.field_name, fieldStages.stages, action.time + 1)
                    const value3 = TestEntityStage.fetchFieldValue(action.field_name, fieldStages.stages, action.time + 86400 * 10 - 1)
                    const value4 = TestEntityStage.fetchFieldValue(action.field_name, fieldStages.stages, action.time + 86400 * 10)
                    const value5 = TestEntityStage.fetchFieldValue(action.field_name, fieldStages.stages, action.time + 86400 * 10 + 1)
                    const value6 = TestEntityStage.fetchFieldValue(action.field_name, fieldStages.stages, action.time - 1)
                    const value7 = TestEntityStage.fetchFieldValue(action.field_name, fieldStages.stages, action.time - 999999)
                    chai.assert(value1 === action)
                    chai.assert(value2 === action)
                    chai.assert(value3 === action)
                    if(index === arr.length - 1) {
                        chai.assert(value4 === action)
                        chai.assert(value5 === action)
                    } else {
                        chai.assert(value4 !== action)
                        chai.assert(value5 !== action)
                    }
                    chai.assert(value6 !== action)
                    chai.assert(value7 !== action)
                })
            })
            it('fetchFieldValue check default value', () => {
                const quantity = 50
                const fieldStages = TestEntityStage.defaultFieldsStages(StageFieldName.recovery)
                const fieldActions = createRandomFieldActions(quantity, 10)
                fieldActions.forEach(i => fieldStages.stages[i.time] = i)
                const value = TestEntityStage.fetchFieldValue(StageFieldName.created, fieldStages.stages, 0)
                isDefaultTestFieldAction(value, StageFieldName.created)
            })
            it('fetchFieldAction', () => {
                for(let i = 0; i < 500; ++i) {
                    const expectedEntityFieldStage = TestEntityStageFactory.uniqueFieldStage()
                    compareTestFieldActions(expectedEntityFieldStage, TestEntityStage.fetchFieldAction(expectedEntityFieldStage))
                }
            })
        })
    })
}

function checkExitingEntityPhotos(entity: IEntityStage): void {
    let photosTime = entity.time_create + 50
    const fieldNames = Object.keys(entity.field_stages)
    for(let i = 0; i < 10; ++i) {
        const photos = entity.photos(photosTime + i * 100)
        const general_photo = photos.find(i => i.is_general)
        chai.assert(photos.length === 2)
        fieldNames.forEach(name => {
            const fieldStages = entity.field_stages[name].stages
            const expectedFieldStage = fieldStages[entity.time_create + i * 100]
            if(isCounter(name)) {
                general_photo[name] = 1
            } else if(isCore(name)){

            } else {
                const actualFieldStage = general_photo.values_lists[name]
                belongTheEntity(expectedFieldStage, actualFieldStage)
                compareTestFieldStages(expectedFieldStage, actualFieldStage)
            }
        })
    }
}

function isCounter(name: any): boolean {
    return name == StageFieldName.created || name == StageFieldName.deleted || name == StageFieldName.entities_counter
}

function isCore(name: any): boolean {
    name = Number.parseInt(name)
    return getGeneralFields().indexOf(name) !== -1
}

function checkChangedStatusValues(entity: IEntityStage, photos: IPhoto[]): void {
    const conversionPhotos = photos.filter(photo => Object.values(photo.metric_values).length)
    const changedStatuses = Object.values(entity.field_stages[StageFieldName.status].stages)
    chai.assert(conversionPhotos.length + 1 === changedStatuses.length)

    conversionPhotos.forEach(photo => {
        const duration = photo.metric_values[ValueName.status_durations]
        const output_counter = photo.metric_values[ValueName.status_output_counter]
        const cancelled_counter = photo.metric_values[ValueName.status_cancelled_counter]
        chai.assert(duration === 100)
        chai.assert(output_counter === 1)
        chai.assert(cancelled_counter === 0)
    })
}

function setReChangedStatusesWithResponsible(entity: IEntityStage): void {
    const statuses: any[] = Object.values(entity.field_stages[StageFieldName.status].stages)
    let lastTime = statuses[statuses.length - 1].time
    statuses.forEach((fieldAction: any) => {
        const userAction = entity.getFieldAction({field_name: StageFieldName.responsible_user_id, time: lastTime - 900})
        const user: any = Object.assign({}, userAction)
        fieldAction = Object.assign({}, fieldAction)
        fieldAction.time = user.time = lastTime += 100
        entity.addFieldAction(user)
        entity.addFieldAction(fieldAction)
    })
}

function checkReChangedStatusesWithUsersValues(entity: IEntityStage, photos: IPhoto[]): void {
    const conversionPhotos = photos.filter(photo => Object.values(photo.metric_values).length)
    const changedStatuses = Object.values(entity.field_stages[StageFieldName.status].stages)
    chai.assert(conversionPhotos.length === changedStatuses.length / 2)

    conversionPhotos.forEach((photo, index, arr) => {
        const duration = photo.metric_values[ValueName.status_durations]
        const output_counter = photo.metric_values[ValueName.status_output_counter]
        const cancelled_counter = photo.metric_values[ValueName.status_cancelled_counter]
        if(index + 1 === arr.length)
            chai.assert(duration === 100)
        else
            chai.assert(duration === 200)
        chai.assert(output_counter === 1)
        chai.assert(cancelled_counter === 0)
    })
}

function setReChangedStatuses(entity: IEntityStage): void {
    const statuses: any[] = Object.values(entity.field_stages[StageFieldName.status].stages)
    let lastTime = statuses[statuses.length - 1].time
    statuses.forEach((fieldAction: any) => {
        fieldAction = Object.assign({}, fieldAction)
        fieldAction.time = lastTime += 100
        entity.addFieldAction(fieldAction)
    })
}

class TestEntityStage extends EntityStage {
    constructor() {
        super(TestEntityStageFactory.uniqueNoLeadEntityStageStruct(undefined, false), new TestStatusTypes())
    }

    emptyPhoto(time: number, user_id: number = 0, is_general: boolean = false): IKPI.IPhoto {
        return super.emptyPhoto(time, user_id, is_general);
    }

    getAtom(time: number, user_id: number): IAtom {
        return super.getAtom(time, user_id)
    }

    createTypePhoto(time: number): IPhoto {
        return super.createTypePhoto(time)
    }

    deleteTypePhoto(time: number): IPhoto {
        return super.deleteTypePhoto(time)
    }

    static defaultFieldsStages(name: StageFieldName): IFieldStages {
        return super.defaultFieldsStages(name)
    }

    static defaultFieldAction(name: StageFieldName): IFieldAction {
        return super.defaultFieldAction(name)
    }

    static get defaultStatus(): IStatus {
        return super.defaultStatus
    }

    static findTargetFieldValue(values: IFieldAction[], time: number): IFieldAction|null {
        return super.findTargetFieldValue(values, time)
    }

    static getTargetTime(fieldStages: object, timeSec: number): number {
        return super.getTargetTime(fieldStages, timeSec)
    }

    static fetchFieldValue(fieldName: StageFieldName, stages: object, timeSec: number): IFieldAction {
        return super.fetchFieldValue(fieldName, stages, timeSec)
    }

    static fetchFieldAction(fieldStage: IEntityFieldStage): IFieldAction {
        return super.fetchFieldAction(fieldStage)
    }
}

function createRandomFieldActions(quantity: number = 50, startTime: number = 0): IFieldAction[] {
    const res = []
    for(let i = 0; i < quantity; ++i)
        res.push(createRandomFieldAction(i * 86400 * 10 + startTime))
    return res
}

function createRandomFieldAction(time: number): IFieldAction {
    return {field_name: Func.randomNumber(6), init_user_id: 0, time, value: 0}
}