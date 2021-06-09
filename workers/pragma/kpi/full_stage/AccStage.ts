import {IEvents} from "../IEvents";
import IAccStage = IEvents.IAccStage;
import {Generals} from "../../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import IAccStageStruct = IEvents.IAccStageStruct;
import IEntitiesStages = IEvents.IEntitiesStages;
import IStagesMethods = IEvents.IStagesMethods;
import IEntityStage = IEvents.IEntityStage;
import {EntityStage} from "./EntityStage";
import IEntitiesStagesStruct = IEvents.IEntitiesStagesStruct;
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;
import IStatusTypes = IEvents.IStatusTypes;
import {IKPI} from "../IKPI";
import IFieldAction = IKPI.IFieldAction;
import IPhoto = IKPI.IPhoto;
import IEntityFieldStage = IKPI.IEntityFieldStage;
import IEntityField = IKPI.IEntityField;
import {Func} from "../../../../generals/Func";

abstract class AStagesMethods implements IStagesMethods{
    abstract readonly statusTypes: IStatusTypes
    abstract photos(dayTime: number): IPhoto[]
    protected abstract getEntities (entityGroup: EntityGroup): object

    addEntityFieldStage(fieldStage: IEntityFieldStage): void {
        this.getTargetEntity(fieldStage).addFieldAction(fieldStage)
    }

    getFieldAction(field: IEntityField): IFieldAction {
        return this.getTargetEntity(field).getFieldAction(field)
    }

    protected getTargetEntity(atom: IEntityField): IEntityStage {
        const entities = this.getEntities(atom.entity_type)
        let stage = entities[atom.entity_id]
        if(stage) return stage
        stage = this.createEntityStage(atom)
        entities[atom.entity_id] = stage
        return stage
    }

    private createEntityStage(atom: IEntityField): IEntityStage {
        return new EntityStage({
            field_stages: {},
            entity_id: atom.entity_id,
            entity_type: atom.entity_type,
            time_create: atom.time
        }, this.statusTypes)
    }
}

export class AccStage extends AStagesMethods implements IAccStage {
    readonly account_id: number
    readonly entity_stages: any
    readonly start_day: number
    readonly last_day: number
    readonly statusTypes: IStatusTypes

    constructor(struct: IAccStageStruct, statusTypes: IStatusTypes) {
        super()
        this.statusTypes = statusTypes
        this.account_id = struct.account_id
        this.start_day = struct.start_day
        this.last_day = struct.last_day
        this.entity_stages = this.createOrGetEntitiesStages(struct.entity_stages)
    }
    private createOrGetEntitiesStages(entity_stages: any): object {
        entity_stages = typeof entity_stages === "object" ? entity_stages : {}
        entity_stages[EntityGroup.leads] = this.createOrGetGroupStages(entity_stages, EntityGroup.leads)
        entity_stages[EntityGroup.contacts] = this.createOrGetGroupStages(entity_stages, EntityGroup.contacts)
        entity_stages[EntityGroup.companies] = this.createOrGetGroupStages(entity_stages, EntityGroup.companies)
        entity_stages[EntityGroup.customers] = this.createOrGetGroupStages(entity_stages, EntityGroup.customers)
        return entity_stages
    }

    private createOrGetGroupStages(entity_stages: any, group: EntityGroup): IEntitiesStages {
        const struct = typeof entity_stages[group] === "object" ? entity_stages[group] : AccStage.createNewStruct(group)
        return new EntitiesStages(struct, this.statusTypes)
    }

    protected static createNewStruct(group_name: EntityGroup): IEntitiesStagesStruct {
        return {entities: {}, group_name}
    }

    protected getEntities (entityGroup: EntityGroup): object {
        return this.entity_stages[entityGroup]
    }

    async saveAndMoveLastDay(): Promise<void> {

    }

    photos(momentTime: number): IPhoto[] {
        const photos = this.photosByGroups(momentTime)
        return [].concat(...Object.values(photos))
    }

    photosByGroups(momentTime: number): object {
        const entities: IEntitiesStages[] = Object.values(this.entity_stages)
        const photoGroups: object = {}
        entities.forEach(i => photoGroups[i.group_name] = i.photos(momentTime))
        return photoGroups
    }
}

export class EntitiesStages extends AStagesMethods implements IEntitiesStages {
    readonly entities: object
    readonly group_name: EntityGroup
    readonly statusTypes: IStatusTypes

    constructor(struct: IEntitiesStagesStruct, statusTypes: IStatusTypes) {
        super()
        this.statusTypes = statusTypes
        this.entities = typeof struct.entities === "object" ? struct.entities : {}
        this.group_name = struct.group_name
    }

    protected getEntities(entityGroup: EntityGroup): object {
        if(entityGroup !== this.group_name)
            throw Errors.internalError('Invalid "entityGroup": "' + entityGroup + '"')
        return this.entities
    }

    photos(momentTime: number): IPhoto[] {
        const dayTime = Func.truncSeconds(momentTime)
        const allEntities: IEntityStage[] = Object.values(this.entities)
        const activeInDay = allEntities.filter((i: IEntityStage) => i.time_create <= momentTime && !i.isDeletedInTime(dayTime))
        const collector = new PhotoCollector()
        activeInDay.forEach((i, index) => {
            collector.addPhotos(i.photos(momentTime))
        })
        return collector.photos
    }
}

class PhotoCollector {
    private readonly groupPhotos: object = {}
    constructor() {
    }

    get photos(): IPhoto[] {
        return Object.values(this.groupPhotos)
    }

    addPhotos(photos: IPhoto[]): void {
        photos.forEach(photo => this.addPhoto(photo))
    }

    addPhoto(addedPhoto: IPhoto): void {
        const oldPhoto = this.getTargetPhoto(addedPhoto)
        PhotoCollector.mergeObjects(oldPhoto.values_lists, addedPhoto.values_lists)
        PhotoCollector.mergeObjects(oldPhoto.metric_values, addedPhoto.metric_values)
        PhotoCollector.mergeCounters(oldPhoto.counters_values, addedPhoto.counters_values)
    }

    private getTargetPhoto(addedPhoto: IPhoto): IPhoto {
        let group = this.groupPhotos[addedPhoto.atom_id]
        if(!group)
            this.groupPhotos[addedPhoto.atom_id] = group = PhotoCollector.copyEmptyPhoto(addedPhoto)
        return group
    }

    private static copyEmptyPhoto(photo: IPhoto): IPhoto {
        return {
            atom_id: photo.atom_id,
            entity_type: photo.entity_type,
            is_general: true,
            metric_values: {},
            values_lists: {},
            counters_values: {},
            pipeline_id: photo.pipeline_id,
            status_id: photo.status_id,
            time: photo.time,
            user_id: photo.user_id
        }
    }

    private static mergeObjects(oldObject: object, addedObject: object): void {
        const addedFieldNames = Object.keys(addedObject)
        addedFieldNames.forEach(fieldName => {
            const list = PhotoCollector.fetchAndCreateList(oldObject, fieldName)
            const value = typeof addedObject[fieldName] === "object" ? addedObject[fieldName].value : addedObject[fieldName]
            list.push(value)
        })
    }

    private static mergeCounters(oldObject: object, addedObject: object): void {
        const addedCounters = Object.keys(addedObject)
        addedCounters.forEach(fieldName => {
            oldObject[fieldName] = oldObject[fieldName] || 0
            oldObject[fieldName] += addedObject[fieldName]
        })
    }

    private static fetchAndCreateList(targetObj: object, key: number|string): any[] {
        let list = targetObj[key]
        if(list) return list
        targetObj[key] = list = []
        return list
    }
}