import {IEvents} from "../IEvents";
import IEntityStage = IEvents.IEntityStage;
import IEntityStageStruct = IEvents.IEntityStageStruct;
import {Func} from "../../../../generals/Func";
import {IKPI} from "../IKPI";
import assembleAtomId = IKPI.assembleAtomId;
import IAtom = IKPI.IAtom;
import {Generals} from "../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import IStatusTypes = IEvents.IStatusTypes;
import ValueName = IKPI.ValueName;
import StageFieldName = IKPI.StageFieldName;
import IPhoto = IKPI.IPhoto;
import IField = IKPI.IField;
import IFieldAction = IKPI.IFieldAction;
import IStatus = IKPI.IStatus;
import getGeneralFields = IKPI.getGeneralFields;


export interface IFieldStages {
    readonly field_name: StageFieldName
    readonly stages: {}
}

export class EntityStage implements IEntityStage {
    readonly entity_id: number
    readonly entity_type: EntityGroup
    readonly field_stages: object
    readonly time_create: number
    readonly statusTypes: IStatusTypes


    constructor(struct: IEntityStageStruct, statusTypes: IStatusTypes) {
        this.entity_id = struct.entity_id
        this.entity_type = struct.entity_type
        this.field_stages = struct.field_stages || {}
        this.time_create = struct.time_create
        this.statusTypes = statusTypes
    }

    photos(time: number): IPhoto[] {
        const startDayTime = Func.truncSeconds(time)
        const deletedFlag = this.isDeletedInTime(time)
        const result: IPhoto[] = []
        deletedFlag && this.isDeletedOnDay(time) && result.push(this.deleteTypePhoto(time))
        deletedFlag || result.push(this.generalPhoto(time))
        this.isCreatedOnDay(startDayTime) && result.push(this.createTypePhoto(time))
        return result.concat(this.conversionPhotos(time))
    }

    private generalPhoto(time: number): IPhoto {
        const photo: IPhoto = this.emptyPhoto(time, undefined, true)
        Object.values(this.field_stages).forEach((stage: IFieldStages) => {
            if(EntityStage.isGeneralField(stage.field_name)) return;
            photo.values_lists[stage.field_name] = EntityStage.fetchFieldValue(stage.field_name, stage.stages, time)
        })
        photo.counters_values[StageFieldName.entities_counter] = 1
        return photo
    }

    protected deleteTypePhoto(time: number): IPhoto {
        const deleteAction = this.getTimeFieldValue(StageFieldName.deleted, time)
        const photo = this.emptyPhoto(time, deleteAction.init_user_id)
        photo.counters_values[StageFieldName.deleted] = 1
        return photo
    }

    protected createTypePhoto(time: number): IPhoto {
        const createAction = this.getTimeFieldValue(StageFieldName.created, time)
        const photo = this.emptyPhoto(time, createAction.init_user_id)
        photo.counters_values[StageFieldName.created] = 1
        return photo
    }

    private conversionPhotos(time: number): IPhoto[] {
        if(this.entity_type !== EntityGroup.leads) return []
        const statusConversion = new StatusConversion(this, time)
        return statusConversion.photos
    }

    protected emptyPhoto(time: number, user_id: number = 0, is_general: boolean = false): IPhoto {
        const atom = this.getAtom(time, user_id)
        return Object.assign(atom, {
            atom_id: assembleAtomId(atom),
            entity_type: this.entity_type,
            is_general,
            time,
            values_lists: {},
            metric_values: {},
            counters_values: {},
        })
    }

    protected getAtom(time: number, user_id: number): IAtom {
        const status = this.getTimeFieldValue(StageFieldName.status, time).value
        user_id = user_id || this.getTimeFieldValue(StageFieldName.responsible_user_id, time).value
        return Object.assign({}, status, {user_id})
    }

    addFieldAction(fieldStage: IFieldAction): void {
        this.addAsDefault(EntityStage.fetchFieldAction(fieldStage))
    }

    protected static fetchFieldAction(fieldStage: IFieldAction): IFieldAction {
        return {
            field_name: fieldStage.field_name,
            time: fieldStage.time,
            init_user_id: fieldStage.init_user_id,
            value: fieldStage.value
        }
    }

    private addAsDefault(fieldStage: IFieldAction): void {
        const fieldStages = this.createOrGetFieldStageValues(fieldStage.field_name)
        if(!this.time_create || this.time_create > fieldStage.time) {
            // @ts-ignore
            this.time_create = fieldStage.time
        }
        fieldStages[fieldStage.time] = fieldStage
    }

    protected static get defaultStatus(): IStatus {
        return {status_id: 0, pipeline_id: 0}
    }

    getFieldValue(field: IField): number|IStatus|any {
        return this.getFieldAction(field).value
    }

    getFieldAction(field: IField): IFieldAction {
        return this.getTimeFieldValue(field.field_name, field.time)
    }

    private getTimeFieldValue(fieldName: StageFieldName, timeSec: number): IFieldAction {
        const stages = this.createOrGetFieldStageValues(fieldName)
        return EntityStage.fetchFieldValue(fieldName, stages, timeSec)
    }

    protected static fetchFieldValue(fieldName: StageFieldName, stages: object, timeSec: number): IFieldAction {
        const target_time = this.getTargetTime(stages, timeSec)
        return target_time ? stages[target_time] : this.defaultFieldAction(fieldName)
    }

    protected static getTargetTime(fieldStages: object, timeSec: number): number {
        let last_time = 0, flag = false
        const stages = Object.values(fieldStages).reverse()
        const resFlag = stages.find((field_stage: IFieldAction) => {
            if(field_stage.time <= timeSec) flag = true
            last_time = field_stage.time
            return flag
        })
        return resFlag ? last_time : 0
    }

    private createOrGetFieldStageValues(fieldName: StageFieldName): object {
        return this.createOrGetFieldStages(fieldName).stages
    }

    private createOrGetFieldStages(fieldName: StageFieldName): IFieldStages {
        let field_stages = this.field_stages[fieldName]
        if(field_stages)
            return field_stages
        field_stages = EntityStage.defaultFieldsStages(fieldName)
        this.field_stages[fieldName] = field_stages
        return field_stages
    }

    isDeletedOnDay(timeSec: number): boolean {
        const startDay = Func.truncSeconds(timeSec)
        const endDayTime = startDay + 86400
        const lastDeleted = this.getTimeFieldValue(StageFieldName.deleted, endDayTime)
        const lastRecovery = this.getTimeFieldValue(StageFieldName.recovery, endDayTime)
        if(!lastDeleted.time)
            return false
        else if(lastDeleted.time <= lastRecovery.time)
            return false
        return startDay <= lastDeleted.time && endDayTime > lastDeleted.time
    }

    isDeletedInTime(time: number): boolean {
        const deleted_stages = this.field_stages[StageFieldName.deleted]
        if(!deleted_stages)
            return false

        const deleted_values: IFieldAction[] = Object.values(deleted_stages.stages)
        const target_deleted_value = EntityStage.findTargetFieldValue(deleted_values, time)
        if(!target_deleted_value) return false

        const recovery_values_stages = this.field_stages[StageFieldName.recovery]
        if(!recovery_values_stages)
            return true

        const target_recovery_value = EntityStage.findTargetFieldValue(Object.values(recovery_values_stages.stages), time)
        return !target_recovery_value || target_recovery_value.time < target_deleted_value.time
    }

    protected static findTargetFieldValue(values: IFieldAction[], time: number): IFieldAction|null {
        const filtered = values.filter(i => i.time <= time)
        return filtered[filtered.length - 1] || null
    }

    protected static defaultFieldsStages(name: StageFieldName): IFieldStages {
        return {field_name: name, stages: {}}
    }

    protected static defaultFieldAction(name: StageFieldName): IFieldAction {
        return {field_name: name, time: 0, init_user_id: 0, value: name === StageFieldName.status ? EntityStage.defaultStatus : 0}
    }

    isCreatedOnDay(timeMoment: number): boolean {
        const startDayTime = Func.truncSeconds(timeMoment)
        return this.time_create >= startDayTime && this.time_create < startDayTime + 86400
    }

    protected static isGeneralField(field_name: StageFieldName): boolean {
        return getGeneralFields().indexOf(field_name) !== -1
    }
}

class StatusConversion {
    private readonly entity: IEntityStage
    private readonly timeMoment: number
    private readonly fieldActions: IFieldAction[]
    private readonly momentResponsibleId: number
    private readonly _photos: object = {}

    constructor(entity: IEntityStage, timeMoment: number) {
        this.entity = entity
        this.timeMoment = timeMoment
        this.momentResponsibleId = entity.getFieldValue({field_name: StageFieldName.responsible_user_id, time: timeMoment})
        this.fieldActions = StatusConversion.fetchStatuses(entity, timeMoment)
        this.createConversionPhotos()
    }

    get photos(): IPhoto[] {
        return Object.values(this._photos)
    }

    private static fetchStatuses(entity: IEntityStageStruct, timeMoment: number): IFieldAction[] {
        const fields = entity.field_stages[StageFieldName.status] || {}
        const fieldValues: IFieldAction[] = Object.values(fields.stages)
        const startDay = Func.truncSeconds(timeMoment)
        return fieldValues.filter(i => i.time <= timeMoment && i.time > startDay)
    }

    private createConversionPhotos(): void {
        this.fieldActions.forEach((field, index, values) => this.createPhoto(field, values[index + 1]))
    }

    private createPhoto(beforeField: IFieldAction, afterField: IFieldAction): void {
        if(!afterField || !beforeField) return;
        const photo = this.createOrGetPhoto(beforeField)
        const duration = afterField.time - beforeField.time
        StatusConversion.addStatusDuration(photo, duration)
        StatusConversion.addStatusOutput(photo)
        this.addStatusCancelled(photo, afterField.value)
    }

    private createOrGetPhoto(field: IFieldAction): IPhoto {
        const atom = this.getAtom(field)
        const atomId = assembleAtomId(atom)
        if(this._photos[atomId]) return this._photos[atomId]
        return this.createEmptyPhoto(atomId, atom)
    }

    private getAtom(field: IFieldAction): IAtom {
        const user_id = this.entity.getFieldValue({field_name: StageFieldName.responsible_user_id, time: field.time})
        return {user_id, status_id: field.value.status_id, pipeline_id: field.value.pipeline_id}
    }

    private createEmptyPhoto(atom_id: string, atom: IAtom): IPhoto {
        const photo: IPhoto = {
            atom_id,
            entity_type: this.entity.entity_type,
            values_lists: {},
            metric_values: {},
            counters_values: {},
            is_general: false,
            pipeline_id: atom.pipeline_id,
            status_id: atom.status_id,
            time: this.timeMoment,
            user_id: atom.user_id
        }
        this._photos[photo.atom_id] = photo
        return photo
    }

    private static addStatusDuration(photo: IPhoto, duration: number): void {
        photo.metric_values[ValueName.status_durations] = (photo.metric_values[ValueName.status_durations] || 0) + duration
    }

    private static addStatusOutput(photo: IPhoto): void {
        photo.metric_values[ValueName.status_output_counter] = photo.metric_values[ValueName.status_output_counter] || 1
    }

    private addStatusCancelled(photo: IPhoto, nextStatus: IStatus): void {
        if(this.entity.statusTypes.isCancelled(nextStatus))
            photo.metric_values[ValueName.status_cancelled_counter] = 1
        photo.metric_values[ValueName.status_cancelled_counter] = photo.metric_values[ValueName.status_cancelled_counter] || 0
    }
}