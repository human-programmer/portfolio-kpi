import {IMainWorkers} from "../../main/interface";
import {Generals} from "../../../generals/Interfaces";

export namespace IKPI {
    import IJob = IMainWorkers.IJob;
    import EntityGroup = Generals.EntityGroup;

    export enum MetricName {
        /*         LEADS METRICS         */
        price = 'price',
        conversion = 'conversion',
        active_leads_counter = 'active_leads_counter',
        deleted_leads_counter = 'deleted_leads_counter',
        new_leads_counter = 'new_leads_counter',

        /*         CONTACTS METRICS         */
        deleted_contacts_counter = 'deleted_contacts_counter',
        active_contacts_counter = 'active_contacts_counter',
        new_contacts_counter = 'new_contacts_counter',

        /*         COMPANIES METRICS         */
        active_companies_counter = 'active_companies_counter',
        deleted_companies_counter = 'deleted_companies_counter',
        new_companies_counter = 'new_companies_counter',
    }

    export function getMetricNames() : MetricName[]{
        return Object.values(MetricName)
    }

    export function eventDependenciesOfMetrics(): any {
        return {
            [MetricName.price]: [EventName.price_changed],
            [MetricName.active_leads_counter]: [],
            [MetricName.deleted_leads_counter]: [],
            [MetricName.new_leads_counter]: [],
            [MetricName.deleted_contacts_counter]: [],
            [MetricName.active_contacts_counter]: [],
            [MetricName.new_contacts_counter]: [],
            [MetricName.active_companies_counter]: [],
            [MetricName.deleted_companies_counter]: [],
            [MetricName.new_companies_counter]: [],
        }
    }

    export function getCoreEvents(): EventName[] {
        return [
            EventName.lead_added,
            EventName.lead_deleted,
            EventName.lead_status_changed,
            EventName.contact_added,
            EventName.contact_deleted,
            EventName.company_added,
            EventName.company_deleted,
            EventName.customer_added,
            EventName.customer_deleted,
            EventName.responsible_changed,
            EventName.lead_restored,
            EventName.contact_restored,
            EventName.company_restored,
            EventName.customer_restored,
        ]
    }

    export enum ValueName {
        sum = 1,
        max,
        counter,
        min_nzero,
        counter_nzero,
        status_durations,
        status_output_counter,
        status_cancelled_counter,
    }

    export enum EventName {
        lead_added = 1,
        lead_deleted,
        lead_status_changed,
        contact_added,
        contact_deleted,
        company_added,
        company_deleted,
        customer_added,
        customer_deleted,
        responsible_changed,
        lead_restored,
        contact_restored,
        company_restored,
        customer_restored,
        price_changed,
    }

    export enum StageFieldName {
        status = 1,
        responsible_user_id,
        created,
        deleted,
        recovery,
        entities_counter,
        price,
    }

    export function isCounterField(fieldName: StageFieldName): boolean {
        return getCountersFields().indexOf(fieldName) !== -1
    }

    export function getCountersFields(): StageFieldName[] {
        return [
            StageFieldName.deleted,
            StageFieldName.created,
            StageFieldName.entities_counter,
        ]
    }

    export function isListField(fieldName: StageFieldName): boolean {
        return getListFields().indexOf(fieldName) !== -1
    }

    export function getListFields(): StageFieldName[] {
        return [
            StageFieldName.price,
        ]
    }

    export function getGeneralFields(): StageFieldName[] {
        return [
            StageFieldName.status,
            StageFieldName.responsible_user_id,
            StageFieldName.created,
            StageFieldName.deleted,
            StageFieldName.recovery,
        ]
    }

    export interface IAtomValues extends IMetricAtom {
        readonly values: object
    }

    export interface IMetricAtom extends IAtom{
        readonly metric_name: MetricName
    }

    export interface IEntityFieldStage extends IFieldAction, IEntityField{
    }

    export interface IEntityField extends IEntityAtom, IField {}

    export interface IFieldAction extends IField{
        readonly value: number|IStatus|any
        readonly init_user_id: number
    }

    export interface IField {
        readonly field_name: StageFieldName
        readonly time: number
    }

    export interface IEntityAtom extends IEntity{
        readonly time: number
    }

    export interface IEntity {
        readonly entity_id: number
        readonly entity_type: EntityGroup
    }

    export interface IPhoto extends IAtom{
        readonly atom_id: string
        readonly is_general: boolean
        readonly entity_type: EntityGroup
        readonly time: number
        readonly values_lists: object //списки значений, как для бюджета сделок
        readonly metric_values: object //некоторые готовые значения метрик (например конверсия тут)
        readonly counters_values: object //счётчики
    }

    export interface IAtom extends IStatus{
        readonly user_id: number
    }

    export interface IStatus {
        readonly status_id: number
        readonly pipeline_id: number
    }

    export interface IEvent extends IBasicEvent, IEventValuesModel{

    }

    export interface IEventValuesModel {
        readonly values_before: IEventValues
        readonly values_after: IEventValues
    }

    export interface IEventValues {
        readonly values: Array<number|IStatus>
    }

    export interface IBasicEvent {
        readonly time: number
        readonly name: EventName
        readonly entity_type: EntityGroup
        readonly user_id: number
        readonly entity_id: number
    }

    export interface IMetricsLoader{
        run(): Promise<any>
        stop(): Promise<any>
    }

    export interface IMetricLoadersFabric {
        createMetricsLoader(job: IJob): Promise<IMetricsLoader>
    }

    export function assembleAtomId(atom: IAtom): string {
        return `${atom.user_id}.${atom.pipeline_id}.${atom.status_id}`
    }
}