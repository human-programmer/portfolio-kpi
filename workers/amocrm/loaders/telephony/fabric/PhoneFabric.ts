import {BasicDataBase} from "../../../../../generals/data_base/BasicDataBase";
import {ITelephony} from "../ITeleohony";
import IPhone = ITelephony.IPhone;
import {Func} from "../../../../../generals/Func";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";

class PhoneFabric extends BasicDataBase {
    static async getPhones(phoneNumbers: Array<string>): Promise<IPhone[]> {
        const uniquePhones = Func.asUniqueStrings(phoneNumbers)
        const groups = await Promise.all(super.toSplit(uniquePhones, 100).map(i => PhoneFabric.getPhonesByPieces(i)))
        return [].concat(...groups)
    }
    static async getPhonesByPieces(phoneNumbers: Array<string>): Promise<IPhone[]> {
        await PhoneFabric.updatePhones(phoneNumbers)
        return await PhoneFabric.getExists(phoneNumbers)
    }

    private static async getExists(phones: Array<string>): Promise<IPhone[]> {
        const exists = await PhoneFabric.queryPhones(phones)
        return exists.map(i => PhoneFabric.phoneCreator(i))
    }

    private static async queryPhones(phones: Array<string>): Promise<any[]> {
        const condition = phones.map(i => `phone = '${i}'`).join(' OR ')
        if(!condition) return []
        const sql = `SELECT
                        id,
                        phone
                    FROM ${super.phonesSchema} 
                    WHERE ${condition}`
        return await super.query(sql, [], 'PhoneFabric -> queryPhones')
    }

    private static phoneCreator(phoneFomDb: any): IPhone {
        return {pragmaPhoneId: Number.parseInt(phoneFomDb.id), phone: phoneFomDb.phone}
    }

    private static async updatePhones (phoneNumbers: Array<string>): Promise<void> {
        const values = phoneNumbers.map(phone => `('${phone}')`).join(',')
        const sql = `INSERT INTO ${CRMDB.phonesSchema} (phone) 
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE
                        phone = VALUES(phone)`
        await super.query(sql, [], 'PhoneFabric -> createPhones')
    }
}