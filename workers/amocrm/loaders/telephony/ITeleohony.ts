import {IAmoEntityId} from "../entities/EntitiesFabric";

export namespace ITelephony {
    export enum CallStatus {
        voice_message = 1,
        call_back_later = 2,
        not_here = 3,
        talked = 4,
        wrong_number = 5,
        not_answered = 6,
        busy = 7,
    }

    export interface IPhone {
        readonly pragmaPhoneId: number
        readonly phone: string
    }

    export interface ILinkToTalk {
        readonly pragmaCallId: number
        readonly link: string
    }

    export interface IAmocrmCall extends ICall {
        readonly amocrmCallId: number
        readonly amocrmEntityId: IAmoEntityId|null
        readonly amocrmUserId: number
    }

    export interface ICall {
        readonly pragmaCallId: number
        readonly pragmaCallStatus: CallStatus
        readonly pragmaPhoneId: number|null
        readonly pragmaEntityId: number|null
        readonly pragmaUserId: number|null
        readonly callDate: Date
        readonly duration: number
        readonly source: string
        readonly isCallIn: boolean
        readonly linkToTalk?: string
        readonly phone?: string|null
    }
}