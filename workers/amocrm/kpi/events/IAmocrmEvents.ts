import {IEvents} from "../../../pragma/kpi/IEvents";
import {IKPI} from "../../../pragma/kpi/IKPI";

export namespace IAmocrmEvents {
    import IEntityStageStruct = IEvents.IEntityStage;
    import IAccStage = IEvents.IAccStage;
    import IEntitiesStages = IEvents.IEntitiesStages;

    export enum AmoEventName {
        lead_added = 'lead_added',
        lead_deleted = 'lead_deleted',
        lead_status_changed = 'lead_status_changed',
        contact_added = 'contact_added',
        contact_deleted = 'contact_deleted',
        company_added = 'company_added',
        company_deleted = 'company_deleted',
        customer_added = 'customer_added',
        customer_deleted = 'customer_deleted',
        price_changed = 'sale_field_changed',
        responsible_changed = 'entity_responsible_changed',
    }

    export interface IAmoAccStage extends IAccStage {
        readonly entity_stages: IAmoEntitiesStages[]
    }

    export interface IAmoEntitiesStages extends IEntitiesStages{
        readonly entities: IAmoEntityStage[]
    }

    export interface IAmoEntityStage extends IEntityStageStruct {
        readonly amo_id: number
    }
}