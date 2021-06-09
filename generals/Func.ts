import {IBasic} from "./IBasic";
import {Generals} from "./Interfaces";
import EntityGroup = Generals.EntityGroup;
import Errors = IBasic.Errors;
import FieldType = Generals.FieldType;
import {ITelephony} from "../workers/amocrm/loaders/telephony/ITeleohony";
import CallStatus = ITelephony.CallStatus;
import {IEvents} from "../workers/pragma/kpi/IEvents";
import {IAmocrmEvents} from "../workers/amocrm/kpi/events/IAmocrmEvents";
import AmoEventName = IAmocrmEvents.AmoEventName;
import {IKPI} from "../workers/pragma/kpi/IKPI";
import EventName = IKPI.EventName;


export class Func {
    static asStringForDB (value: any, length: number = 256): string {
        value = '' + value
        value = value.trim().slice(0, length).trim()
        return value
    }

    static asFloatForDB(value: any): number {
        let val = '' + value
        val = val.replace(/[^\d+.]/g, '')
        if(!val) return 0.0
        let float = Number.parseFloat(val)
        const str = float.toFixed(3)
        return Number.parseFloat(str)
    }

    static toPragmaEntityType(amocrmEntityType: string): EntityGroup {
        switch (amocrmEntityType) {
            case 'leads':
                return EntityGroup.leads
            case 'contacts':
                return EntityGroup.contacts
            case 'companies':
                return EntityGroup.companies
            case 'customers':
                return EntityGroup.customers
            default:
                throw Errors.internalError(`Invalid amocrmEntityType: "${amocrmEntityType}"`)
        }
    }

    static isLeadType(entity_type: EntityGroup): boolean {
        switch (entity_type) {
            case EntityGroup.leads:
                return true
            default: return false
        }
    }

    static toPragmaFieldType(amocrmFieldType: string): FieldType {
        switch (amocrmFieldType) {
            case 'radiobutton':
            case 'select':
                return FieldType.enums
            case 'multiselect':
                return FieldType.multienums
            case 'date_time':
            case 'date':
            case 'birthday':
                return FieldType.date
            case 'text':
            case 'textarea':
            case 'url':
                return FieldType.string
            case 'numeric':
                return FieldType.float
            default:
                return FieldType.unknown
        }
    }

    static asUniqueStrings(values: any): Array<number> {
        values = Array.isArray(values) ? values : [values]
        values = values.map(i => ('' + i).trim())
        values = values.filter((ref, index) => values.indexOf(ref) === index)
        return values
    }

    static asUniqueNumbers(values: any): Array<number> {
        values = Array.isArray(values) ? values : [values]
        values = values.map(i => Number.parseInt(i)).filter(i => i)
        values = values.filter((ref, index) => values.indexOf(ref) === index)
        return values
    }

    static asPhone(phone: any): string|null {
        phone = '' + phone
        phone = phone.replace(/\D+/g, '')
        return phone.length > 18 ? null : ''
    }

    static amoCallStatusToPragma (status: number): CallStatus {
        switch (status) {
            case 1:
                return CallStatus.voice_message
            case 2:
                return CallStatus.call_back_later
            case 3:
                return CallStatus.not_here
            case 4:
                return CallStatus.talked
            case 5:
                return CallStatus.wrong_number
            case 6:
                return CallStatus.not_answered
            case 7:
                return CallStatus.busy
            default:
                throw Errors.invalidRequest('Invalid amocrm call status: "' + status + '"')
        }
    }

    static truncSeconds(seconds: number): number {
        const days = Math.trunc(seconds / 86400)
        return days * 86400
    }

    static truncDate(date: Date): Date {
        const days = Math.trunc(date.getTime() / 86400 / 1000)
        return new Date(days * 86400 * 1000)
    }

    static ceilDate(date: Date): Date {
        const days = Math.ceil(date.getTime() / 86400 / 1000)
        return new Date(days * 86400 * 1000)
    }

    static randomOnIntervalForTests(start: number, end: number): number {
        if(start > end) throw Errors.internalError("Invalid interval")
        let result = Func.randomNumber(end)
        while (result < start) {
            result = Func.randomNumber(end)
        }
        return result
    }

    static randomNumber(end: number = 10): number{
        return Math.trunc(Math.random() * end)
    }

    static pragmaToAmoEventName(pragmaEventName: EventName) : AmoEventName|null {
        switch (pragmaEventName){
            case EventName.lead_added:
                return AmoEventName.lead_added
            case EventName.lead_deleted:
                return AmoEventName.lead_deleted
            case EventName.lead_status_changed:
                return AmoEventName.lead_status_changed
            case EventName.contact_added:
                return AmoEventName.contact_added
            case EventName.contact_deleted:
                return AmoEventName.contact_deleted
            case EventName.company_added:
                return AmoEventName.company_added
            case EventName.company_deleted:
                return AmoEventName.company_deleted
            case EventName.customer_added:
                return AmoEventName.customer_added
            case EventName.customer_deleted:
                return AmoEventName.customer_deleted
            case EventName.price_changed:
                return AmoEventName.price_changed
            case EventName.responsible_changed:
                return AmoEventName.responsible_changed
            default:
                return null
        }
    }

    static amoToPragmaEventName(pragmaEventName: AmoEventName) : EventName|null {
        switch (pragmaEventName){
            case AmoEventName.lead_added:
                return EventName.lead_added
            case AmoEventName.lead_deleted:
                return EventName.lead_deleted
            case AmoEventName.lead_status_changed:
                return EventName.lead_status_changed
            case AmoEventName.contact_added:
                return EventName.contact_added
            case AmoEventName.contact_deleted:
                return EventName.contact_deleted
            case AmoEventName.company_added:
                return EventName.company_added
            case AmoEventName.company_deleted:
                return EventName.company_deleted
            case AmoEventName.customer_added:
                return EventName.customer_added
            case AmoEventName.customer_deleted:
                return EventName.customer_deleted
            case AmoEventName.price_changed:
                return EventName.price_changed
            case AmoEventName.responsible_changed:
                return EventName.responsible_changed
            default:
                return null
        }
    }
}