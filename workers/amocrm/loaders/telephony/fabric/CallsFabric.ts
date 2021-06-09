import {BasicDataBase} from "../../../../../generals/data_base/BasicDataBase";
import {ITelephony} from "../ITeleohony";
import IAmocrmCall = ITelephony.IAmocrmCall;
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {Func} from "../../../../../generals/Func";

class AmocrmCallsFabric extends BasicDataBase {
    static async addPragmaCallId(pragmaAccountId: number, calls: IAmocrmCall[]): ProcessingInstruction<void> {
        const interfaces = await AmocrmCallsFabric.getInterfaces(pragmaAccountId, calls)
        AmocrmCallsFabric._addPragmaCallId(interfaces, calls)
    }


    private static _addPragmaCallId(interfaces: any[], calls: IAmocrmCall[]): void {
        interfaces.forEach(i => {
            const call = calls.find(c => c.amocrmCallId == i.amocrmCallId)
            if(!call) return;
            // @ts-ignore
            call.pragmaCallId = Number.parseInt(i.pragmaCallId)
        })
    }

    private static async getInterfaces (pragmaAccountId: number, calls: IAmocrmCall[]): Promise<Array<any>> {
        const promises = super.toSplit(calls).map(i => AmocrmCallsFabric.getInterfacesByPieces(pragmaAccountId, i))
        const interfaces = await Promise.all(promises)
        return [].concat(...interfaces)
    }

    private static async getInterfacesByPieces (pragmaAccountId: number, calls: IAmocrmCall[]): Promise<Array<any>> {
        const ids = Func.asUniqueNumbers(calls.map(i => i.amocrmCallId))
        const condition = ids.map(id => `amocrm_call_id = ${id}`).join(' OR ')
        if(!condition) return [];
        const sql = `SELECT
                        amocrm_call_id AS amocrmCallId,
                        pragma_call_id AS pragmaCallId
                    FROM ${CRMDB.amocrmCallsSchema} 
                    WHERE account_id = ${pragmaAccountId} AND (${condition})`
        return await super.query(sql, [], 'AmocrmCallsFabric -> getInterfaces')
    }
}

export class CallsFabric extends BasicDataBase {
    private readonly pragmaAccountId: number

    constructor(pragmaAccountId: number) {
        super()
        this.pragmaAccountId = pragmaAccountId
    }

    async save(calls: IAmocrmCall[]): Promise<void> {
        await AmocrmCallsFabric.addPragmaCallId(this.pragmaAccountId, calls)
        const toSaveCalls = calls.filter(i => i.pragmaCallId)
        await this.saveNewCalls(toSaveCalls)
    }

    private async saveNewCalls(calls: IAmocrmCall[]): Promise<IAmocrmCall[]> {
        await Promise.all(calls.map(i => this.saveOne(i)))
    }

    async saveOne(call: IAmocrmCall): Promise<void> {
        const sql = `INSERT INTO ${CRMDB.callsSchema} (status_id, phone_id, entity_id, user_id, account_id, call_date, duration, source)
                    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        account_id = VALUES(account_id)`
        const model = [call.pragmaCallStatus, call.pragmaPhoneId, call.pragmaEntityId, call.pragmaUserId, this.pragmaAccountId, call.callDate, call.duration, call.source]
        const answer = await CallsFabric.query(sql, model, 'CallsFabric -> saveOne')
        // @ts-ignore
        call.pragmaCallId = answer['insertId'] ? Number.parseInt(answer['insertId']) : 0
    }
}