import {ITelephony} from "./ITeleohony";
import IAmocrmCall = ITelephony.IAmocrmCall;
import {Generals} from "../../../../generals/Interfaces";
import AmocrmEntityGroup = Generals.AmocrmEntityGroup;
import {IAmoEntityId} from "../entities/EntitiesFabric";
import CallStatus = ITelephony.CallStatus;
import {Func} from "../../../../generals/Func";
import {IAmocrmLoaders} from "../../interface";
import AmoNoteType = IAmocrmLoaders.AmoNoteType;

export class AmocrmCallsValidator {
    private readonly amocrmEntityGroup: AmocrmEntityGroup

    constructor(amocrmEntityGroup: AmocrmEntityGroup) {
        this.amocrmEntityGroup = amocrmEntityGroup
    }

    formatting(amoCalls: Array<any>): IAmocrmCall[] {
        return amoCalls.map(i => this.formattingCall(i)).filter(i => i)
    }

    private formattingCall(amoCall: any): IAmocrmCall|null {
        amoCall = AmocrmCallsValidator.basicFormatting(amoCall)
        if(!AmocrmCallsValidator.isAvailableCall(amoCall))
            return null
        return {
            amocrmCallId: AmocrmCallsValidator.fetchAmoCallId(amoCall),
            amocrmEntityId: this.fetchAmoEntityId(amoCall),
            amocrmUserId: AmocrmCallsValidator.fetchAmoUserId(amoCall),
            callDate: AmocrmCallsValidator.fetchCallDate(amoCall),
            duration: AmocrmCallsValidator.fetchDuration(amoCall),
            isCallIn: AmocrmCallsValidator.fetchIsCallIn(amoCall),
            pragmaCallId: null,
            pragmaCallStatus: AmocrmCallsValidator.fetchPragmaCallStatus(amoCall),
            pragmaEntityId: null,
            pragmaPhoneId: null,
            pragmaUserId: null,
            source: AmocrmCallsValidator.fetchSource(amoCall),
            linkToTalk: AmocrmCallsValidator.fetchLinkToTalk(amoCall),
            phone: AmocrmCallsValidator.fetchPhone(amoCall),
        }
    }

    private static isAvailableCall(amoCall: any): boolean {
        const amocrmCallId = AmocrmCallsValidator.fetchAmoCallId(amoCall)
        if(!amocrmCallId) return false
        return amoCall.note_type === AmoNoteType.call_in || amoCall.note_type === AmoNoteType.call_out
    }

    private static basicFormatting(amoCall: any): any {
        amoCall = typeof amoCall === 'object' ? amoCall : {}
        amoCall = typeof amoCall.params === 'object' ? amoCall.params : {}
        return amoCall
    }

    private static fetchAmoCallId(amoCall: any): number {
        return Number.parseInt(amoCall.id) || 0
    }

    private fetchAmoEntityId (amoCall: any): IAmoEntityId|null {
        const id = Number.parseInt(amoCall.id) || 0
        return id ? {id, type: this.amocrmEntityGroup} : null
    }

    private static fetchAmoUserId(amoCall: any): number {
        return Number.parseInt(amoCall.responsible_user_id) || 0
    }

    private static fetchCallDate(amoCall: any): Date {
        const time = Number.parseInt(amoCall.created_at)
        return new Date(time)
    }

    private static fetchDuration(amoCall: any): number {
        return Number.parseInt(amoCall.params.duration) || 0
    }

    private static fetchIsCallIn(amoCall: any): boolean {
        return amoCall.note_type === AmoNoteType.call_in
    }

    private static fetchPragmaCallStatus(amoCall: any): CallStatus {
        const amoCallStatus = AmocrmCallsValidator.fetchAmoCallStatus(amoCall)
        return AmocrmCallsValidator.amocrmStatusToPragma(amoCallStatus)
    }

    private static amocrmStatusToPragma (amoStatus: number): CallStatus {
        try {
            return Func.amoCallStatusToPragma(amoStatus)
        } catch (e) {
            return AmocrmCallsValidator.fetchDuration(amoStatus) ? CallStatus.talked : CallStatus.not_answered
        }
    }

    private static fetchAmoCallStatus(amoCall: any): number {
        return Number.parseInt(amoCall.params.call_status) || 0
    }

    private static fetchSource(amoCall: any): string {
        return amoCall.source || ''
    }

    private static fetchLinkToTalk(amoCall: any): string {
        const link = amoCall.params.link ? ('' + amoCall.params.link) : ''
        return link.trim()
    }

    private static fetchPhone(amoCall: any): string {
        return Func.asPhone(amoCall.params.phone)
    }
}