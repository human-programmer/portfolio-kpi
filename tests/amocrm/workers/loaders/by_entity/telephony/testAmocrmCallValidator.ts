import {TelephonyTestDataSets} from "./TelephonyTestDataSets";
import {AmocrmCallsValidator} from "../../../../../../workers/amocrm/loaders/telephony/AmocrmCallsValidator";
import {Generals} from "../../../../../../generals/Interfaces";
import AmocrmEntityGroup = Generals.AmocrmEntityGroup;
import {IAmocrmLoaders} from "../../../../../../workers/amocrm/interface";
import AmoNoteType = IAmocrmLoaders.AmoNoteType;
import {ITelephony} from "../../../../../../workers/amocrm/loaders/telephony/ITeleohony";
import IAmocrmCall = ITelephony.IAmocrmCall;
import {Func} from "../../../../../../generals/Func";

const chai = require('chai')

export async function testAmocrmCallValidator(): Promise<void> {
    describe('AmocrmCallValidator', () => {
        const testAmocrmNotes = TelephonyTestDataSets.amocrmLeadsNotes
        const validator = new AmocrmCallsValidator(AmocrmEntityGroup.leads)
        const convertedNotes = validator.formatting(testAmocrmNotes)
        const inputCalls = fetchCalls(testAmocrmNotes)
        chai.assert(convertedNotes.length === inputCalls.length)
        compare(inputCalls, convertedNotes)
    })
}

function compare (input: any[], output: IAmocrmCall[]): void {
    input.forEach(i => compareCalls(i, output.find(out => out.amocrmCallId == i.id), AmocrmEntityGroup.leads))
}

function compareCalls (amoCall: any, call: IAmocrmCall, amoEntityGroup: AmocrmEntityGroup): void {
    chai.assert(amoCall.id === call.amocrmCallId)
    chai.assert(amoCall.entity_id === call.amocrmEntityId.id)
    chai.assert(amoCall.responsible_user_id === call.amocrmUserId)
    chai.assert(amoEntityGroup === call.amocrmEntityId.type)
    chai.assert(amoCall.params.call_status === call.pragmaCallStatus)
    chai.assert(amoCall.params.link === call.linkToTalk)
    chai.assert(amoCall.params.source === call.source)
    chai.assert(amoCall.params.duration === call.duration)
    const expectPhone = Func.asPhone(amoCall.phone)
    chai.assert(expectPhone === call.phone)
}

function fetchCalls (amocrmNotes: any[]): any[] {
    return amocrmNotes.filter(i => i.note_type === AmoNoteType.call_in || i.note_type === AmoNoteType.call_out)
}

