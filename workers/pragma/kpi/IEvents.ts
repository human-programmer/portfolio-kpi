import {Generals} from "../../../generals/Interfaces";
import {IKPI} from "./IKPI";

export namespace IEvents {

    import EntityGroup = Generals.EntityGroup;
    import ITimeInterval = Generals.ITimeInterval;
    import IAtomValues = IKPI.IAtomValues;
    import IAtom = IKPI.IAtom;
    import MetricName = IKPI.MetricName;
    import EventName = IKPI.EventName;
    import IEntityFieldStage = IKPI.IEntityFieldStage;
    import IStatus = IKPI.IStatus;
    import IField = IKPI.IField;
    import IFieldAction = IKPI.IFieldAction;
    import IPhoto = IKPI.IPhoto;
    import IEvent = IKPI.IEvent;
    import IEntityField = IKPI.IEntityField;

    export interface IMetric {
        readonly name: MetricName
        readonly title: string
        readonly time_update: number
        readonly event_names: EventName
    }

    export interface IAccStage extends IAccStageStruct, IStagesMethods{
        saveAndMoveLastDay(): Promise<void>
        photosByGroups(momentTime: number): object
    }

    export interface IAccStageStruct {
        readonly account_id: number
        readonly start_day: number
        readonly last_day: number
        readonly entity_stages: any
    }

    export interface IEntitiesStages extends IStagesMethods, IEntitiesStagesStruct{
    }

    export interface IEntitiesStagesStruct {
        readonly group_name: EntityGroup
        readonly entities: object
    }

    export interface IStagesMethods {
        photos(momentTime: number): IPhoto[]
        getFieldAction(field: IEntityField): number|IStatus|any
        addEntityFieldStage(fieldStage: IEntityFieldStage): void
    }

    export interface IStatusTypes {
        isActive(status: IStatus): boolean
        isSuccess(status: IStatus): boolean
        isCancelled(status: IStatus): boolean
    }

    export interface IEntityStage extends IEntityStageStruct{
        readonly statusTypes: IStatusTypes
        getFieldValue(field: IField): number|IStatus|any
        getFieldAction(field: IField): IFieldAction
        addFieldAction(fieldStage: IFieldAction): void
        photos(timeMoment: number): IPhoto[]
        isDeletedOnDay(timeMoment: number): boolean
        isCreatedOnDay(timeMoment: number): boolean
        isDeletedInTime(timeMoment: number): boolean
    }

    export interface IEntityStageStruct {
        readonly entity_id: number
        readonly entity_type: EntityGroup
        readonly time_create: number
        readonly field_stages: object
    }


    export interface IEventsCalc {
        readonly atomValues: IAtomValues[]
        setAtomEvents(events: IEvent[], startDay: number): void
    }

    export interface IEventLoader{
        setEventsConverterFabric(fabric: IEventsConverterFabric): void
        loadEvents(eventNames: EventName[], interval: ITimeInterval): Promise<IEvent[]>
    }

    export interface IEventsConverterFabric {
        createConverter(metricNames: MetricName[]): IConverter
    }

    export interface IConverter {
        convert(externalCrmEvents: any[]): Promise<IEvent[]>
    }

    export interface IStageCalculatorFabric {
        readonly stage: IFullStage
        createSliceCalculator(metricNames: MetricName[]): IStageCalculator
    }

    export interface IStageCalculator {
        updateStage(events: IEvent[]): void
    }

    export interface IFullStage {
        readonly values_tree: IValuesTree
        readonly acc_stage: IAccStage
    }

    export interface IMetricCalc {
        calcAsOneDay(photos: IPhoto[], metricNames: MetricName[]): IAtomValues[]
    }

    export interface IValuesTree extends IValuesTreeStruct{
        readonly metricNames: MetricName[]
        readonly needsNextUpdating: boolean
        readonly lastDay: number
        setValuesAndMoveDayIndex(values: IAtomValues[], day_time: number): void
        save(): Promise<void>
    }

    export interface IValuesTreeStruct {
        readonly start_day: number
        readonly values_length: number
        readonly update_time: number
        readonly model: object
    }
}