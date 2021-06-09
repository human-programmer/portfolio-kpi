import {BasicDataBase} from "../../../../../generals/data_base/BasicDataBase";
import {ITelephony} from "../ITeleohony";
import ILinkToTalk = ITelephony.ILinkToTalk;
import {CRMDB} from "../../../../../generals/data_base/CRMDB";

class LinksToTalkFabric extends BasicDataBase {
    static async save(links: ILinkToTalk[]): Promise<void> {
        const promises = super.toSplit(links).map(i => LinksToTalkFabric.saveByPiece(i))
        await Promise.all(promises)
    }
    static async saveByPiece(links: ILinkToTalk[]): Promise<void> {
        const values = links.map(i => `(${i.pragmaCallId}, '${i.link}')`).join(',')
        if(!values) return;
        const sql = `INSERT INTO ${CRMDB.linksToTalkSchema} (call_id, link)
                    VALUES ${values}`
        await super.query(sql, [], 'LinksToTalkFabric -> saveByPiece')
    }
}