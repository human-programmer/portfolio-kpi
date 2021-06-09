import {BasicDataBase} from "../../../../../generals/data_base/BasicDataBase";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";

class PhonesToEntitiesFabric extends BasicDataBase {
    static async save(links: Array<Array<number>>): Promise<void> {
        const promises = super.toSplit(links, 100).map(i => PhonesToEntitiesFabric.saveByPiece(i))
        await Promise.all(promises)
    }
    static async saveByPiece(links: Array<Array<number>>): Promise<void> {
        const values = links.map(i => `(${i[0]}, ${i[1]})`).join(',')
        if(!values) return;
        const sql = `INSERT INTO ${CRMDB.phonesToEntitiesSchema} (phone_id, entity_id) 
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE
                        phone_id = VALUES(phone_id)`
        await super.query(sql, [], 'PhonesToEntitiesFabric -> saveByPiece')
    }
}