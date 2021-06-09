import {CRMDB} from "./CRMDB";
import {IBasic} from "../IBasic";
import Errors = IBasic.Errors;

export class BasicDataBase extends CRMDB {
    static toSplit(arr: Array<any>, size: number = 50): Array<any> {
        let quantity = Math.ceil(arr.length / size) || 1
        const result = []
        do {
            const start = (quantity - 1) * size
            const path = arr.slice(start, start + size)
            path.length && result.push(path)
        } while (--quantity > 0)
        return result
    }

    static async query(sql: string, params: Array<string|number|boolean|Date> = [], methodName?: string): Promise<Array<any>> {
        try {
            return await super.query(sql, params)
        } catch (e) {
            const error = typeof e === 'object' ? e : {err_message: '' + e}
            error.sql = sql
            throw Errors.innerError(`Error in method "${methodName}"`, error)
        }
    }
}