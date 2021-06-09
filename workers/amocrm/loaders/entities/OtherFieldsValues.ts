import {BasicDataBase} from "../../../../generals/data_base/BasicDataBase";
import {CRMDB} from "../../../../generals/data_base/CRMDB";
import {IOtherFieldsValues} from "./EntitiesFabric";

export class OthersFieldsValuesFabric extends BasicDataBase {
    static async save (values: Array<IOtherFieldsValues>): Promise<void> {
        await Promise.all([
            UsersLinks.save(values),
            StatusesLinks.save(values),
            DurationFabric.save(values),
        ])
    }
}

class UsersLinks extends BasicDataBase {
    static async save (values: Array<IOtherFieldsValues>): Promise<void> {
        const pieces = UsersLinks.toSplit(values, 100)
        await Promise.all(pieces.map(i => UsersLinks.saveToPiece(i)))
    }

    private static async saveToPiece (values: Array<IOtherFieldsValues>): Promise<void> {
        const valuesString = UsersLinks.fetchUsersValues(values)
        if(!valuesString) return;
        const sql = `INSERT INTO ${CRMDB.entitiesToUserSchema} (entity_id, user_id) 
                    VALUES ${valuesString}
                    ON DUPLICATE KEY UPDATE 
                        entity_id = VALUES(entity_id),
                        user_id = VALUES(user_id)`
        await UsersLinks.query(sql, [], 'UsersLinks -> saveToPiece')
    }

    private static fetchUsersValues(values: Array<IOtherFieldsValues>): string {
        return values.filter(v => v.user).map(v => {
            if(!v.pragmaEntityId || !v.user.value) return null
            return `(${v.pragmaEntityId}, ${v.user.value})`
        }).filter(i => i).join(',')
    }
}

class StatusesLinks extends BasicDataBase {
    static async save (values: Array<IOtherFieldsValues>): Promise<void> {
        const pieces = StatusesLinks.toSplit(values, 100)
        await Promise.all(pieces.map(i => StatusesLinks.saveToPiece(i)))
    }

    private static async saveToPiece (values: Array<IOtherFieldsValues>): Promise<void> {
        const valuesString = StatusesLinks.fetchStatusValues(values)
        if(!valuesString) return;
        const sql = `INSERT INTO ${CRMDB.entitiesToStatusSchema} (entity_id, pipeline_id, status_id) 
                    VALUES ${valuesString}
                    ON DUPLICATE KEY UPDATE 
                        entity_id = VALUES(entity_id),
                        pipeline_id = VALUES(pipeline_id),
                        status_id = VALUES(status_id)`
        await StatusesLinks.query(sql, [], 'StatusesLinks -> saveToPiece')
    }

    private static fetchStatusValues(values: Array<IOtherFieldsValues>): string {
        return values
            .filter(v => v.pipeline && v.status)
            .map(v => {
                if(!v.pragmaEntityId || !v.pipeline.value || !v.status.value)
                    return null
                return `(${v.pragmaEntityId}, ${v.pipeline.value}, ${v.status.value})`
            }).filter(i => i).join(',')
    }
}

class DurationFabric extends BasicDataBase {
    static async save (values: Array<IOtherFieldsValues>): Promise<void> {
        const pieces = DurationFabric.toSplit(values, 50)
        await Promise.all(pieces.map(i => DurationFabric.saveToPiece(i)))
    }

    private static async saveToPiece (values: Array<IOtherFieldsValues>): Promise<void> {
        const newLinks = await DurationFabric.filterNew(values)
        await DurationFabric.insert(newLinks)
    }

    private static async insert (values: Array<IOtherFieldsValues>): Promise<void> {
        const valuesString = DurationFabric.fetchDurationValues(values)
        if(!valuesString) return;
        const sql = `INSERT INTO ${CRMDB.statusDurationSchema} (status_id, entity_id, pipeline_id, user_id, entry_date) VALUES ${valuesString}`
        await DurationFabric.query(sql, [], 'DurationFabric -> saveToPiece')
    }

    private static async filterNew(values: Array<IOtherFieldsValues>): Promise<Array<IOtherFieldsValues>> {
        const exists = await DurationFabric.queryExists(values)
        return values.filter(val => !exists.find(ex => ex.pragmaEntityId == val.pragmaEntityId))
    }

    private static async queryExists(value: Array<IOtherFieldsValues>): Promise<Array<any>> {
        const condition = value.filter(i => i.pragmaEntityId).map(i => `entity_id = ${i.pragmaEntityId}`).join(' OR ')
        if(!condition) return []
        const sql = `SELECT 
                        entity_id as pragmaEntityId 
                    FROM ${CRMDB.statusDurationSchema} 
                    WHERE ${condition}
                    GROUP BY entity_id`
        return DurationFabric.query(sql, [], 'DurationFabric -> queryExists')
    }

    private static fetchDurationValues(values: Array<IOtherFieldsValues>): string {
        return values
            .filter(v => v.pipeline && v.status)
            .map(v => {
                if(!v.pragmaEntityId || !v.pipeline.value || !v.status.value)
                    return null
                const user: any = v.user || {}
                const date_update = v.date_update ? v.date_update.value : new Date()
                return `(${v.status.value}, ${v.pragmaEntityId}, ${v.pipeline.value}, ${user.value ? user.value : null}, ${super.escape(date_update)})`
            }).filter(i => i).join(',')
    }
}