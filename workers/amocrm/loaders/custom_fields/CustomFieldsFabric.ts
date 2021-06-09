import {BasicDataBase} from "../../../../generals/data_base/BasicDataBase";
import {IAmocrmLoaders} from "../../interface";
import IAmocrmCustomField = IAmocrmLoaders.IAmocrmCustomField;
import ICustomField = IAmocrmLoaders.ICustomField;
import IAmocrmEnum = IAmocrmLoaders.IAmocrmEnum;
import IEnum = IAmocrmLoaders.IEnum;

export class CustomFieldsFabric extends BasicDataBase {
    static async save(customFields: Array<IAmocrmCustomField>): Promise<void> {
        const pieces = super.toSplit(customFields, 25)
        await Promise.all(pieces.map(piece => CustomFieldsFabric.savePiece(piece)))
    }

    private static async savePiece(customFields: Array<IAmocrmCustomField>): Promise<void> {
        if(!customFields.length) return;
        const exists = await CustomFieldsFabric.filterExistsCustomFields(customFields)
        const newFields = customFields.filter(i => !i.pragmaFieldId)

        await CustomFieldsFabric.saveCore(exists, newFields)
        await CustomFieldsFabric.saveOther(customFields)
    }

    private static async filterExistsCustomFields(customFields: Array<IAmocrmCustomField>): Promise<Array<IAmocrmCustomField>> {
        const existsInterfaces = await CustomFieldsFabric.getExistsInterfaces(customFields[0].amocrmAccountId)
        CustomFieldsFabric.addPragmaFieldId(existsInterfaces, customFields)
        return customFields.filter(i => i.pragmaFieldId)
    }

    private static addPragmaFieldId(interfaces: any, customFields: Array<IAmocrmCustomField>): void {
        interfaces.forEach(i => {
            const cf = customFields.find(cf => cf.amocrmFieldId == i.amocrmFieldId)
            if(cf) cf.pragmaFieldId = i.pragmaFieldId
        })
    }

    private static async getExistsInterfaces(amocrmAccountId: number): Promise<Array<any>> {
        const fieldsInterfaces = super.amocrmFieldsSchema
        const sql = `SELECT
                        field_id as amocrmFieldId,
                        pragma_field_id as pragmaFieldId
                     FROM ${fieldsInterfaces} 
                     WHERE account_id = ${amocrmAccountId}`
        return await super.query(sql, [], 'CustomFieldsFabric -> getExistsInterfaces')
    }

    private static async saveCore(existsFields: Array<IAmocrmCustomField>, newFields: Array<IAmocrmCustomField>): Promise<void> {
        await Promise.all([
            CustomFieldsFabric.createFields(newFields),
            CustomFieldsFabric.updateFields(existsFields)
        ])
    }

    private static async createFields(fields: Array<ICustomField>): Promise<void> {
        await Promise.all(fields.map(field => CustomFieldsFabric.create(field)))
    }

    private static async create(field: ICustomField): Promise<void> {
        const pragma = super.fieldsSchema
        const model = [field.pragmaAccountId, field.pragmaEntityType, field.title, field.pragmaFieldType]
        const sql = `INSERT INTO ${pragma} (account_id, entity_type, title, type)
                    VALUES (?,?,?,?)
                    ON DUPLICATE KEY UPDATE
                    title = VALUES(title)`
        const answer = await super.query(sql, model, 'CustomFieldsFabric -> create')
        field.pragmaFieldId = Number.parseInt(answer['insertId'])
    }

    private static async updateFields(fields: Array<ICustomField>): Promise<void> {
        await Promise.all(fields.map(field => CustomFieldsFabric.update(field)))
    }

    private static async update(field: ICustomField): Promise<void> {
        const pragma = super.fieldsSchema
        const sql = `UPDATE ${pragma} SET title = ?, type = ? WHERE id = ${field.pragmaFieldId}`
        await super.query(sql, [field.title, field.pragmaFieldType], 'CustomFieldsFabric -> update')
    }

    private static async saveOther(fields: Array<IAmocrmCustomField>): Promise<void> {
        await Promise.all([
            CustomFieldsFabric.saveInterfaces(fields),
            CustomFieldsFabric.saveEnums(fields)
        ])
    }

    private static async saveInterfaces(fields: Array<IAmocrmCustomField>): Promise<void> {
        const values = CustomFieldsFabric.createValuesString(fields)
        const sql = `INSERT INTO ${super.amocrmFieldsSchema} (field_id, pragma_field_id, account_id, entity_type, field_type)
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE
                    field_type = VALUES(field_type)`
        await super.query(sql, [], 'CustomFieldsFabric -> saveInterfaces')
    }

    private static createValuesString(fields: Array<IAmocrmCustomField>): string {
        return fields.map(f => {
            return `(${f.amocrmFieldId}, ${f.pragmaFieldId}, ${f.amocrmAccountId}, ${super.escape(f.amocrmEntityType)}, ${super.escape(f.amocrmFieldType)})`
        }).join(',')
    }

    private static async saveEnums(fields: Array<IAmocrmCustomField>): Promise<void> {
        CustomFieldsFabric.addFieldIdToEnums(fields)
        const enums = CustomFieldsFabric.fetchEnums(fields)
        await EnumsFabric.save(enums)
    }

    private static addFieldIdToEnums(fields: Array<ICustomField>): void {
        fields.forEach(cf => CustomFieldsFabric.addFieldId(cf.pragmaFieldId, cf.enums))
    }

    private static addFieldId(pragmaFieldId: number, enums: Array<IEnum>): void {
        enums.forEach(en => en.pragmaFieldId = pragmaFieldId)
    }

    private static fetchEnums(fields: Array<IAmocrmCustomField>): Array<IAmocrmEnum> {
        return [].concat(...fields.map(i => i.enums))
    }
}

export class EnumsFabric extends BasicDataBase {
    static async save(enums: Array<IAmocrmEnum>): Promise<void> {
        const pieces = super.toSplit(enums, 50)
        await Promise.all(pieces.map(piece => EnumsFabric.savePiece(piece)))
    }

    private static async savePiece(enums: Array<IAmocrmEnum>): Promise<void> {
        if(!enums.length) return;
        const existsEnums = await EnumsFabric.filterExistsEnums(enums)
        const newEnums = enums.filter(i => !i.pragmaEnumId)
        await EnumsFabric.saveCore(existsEnums, newEnums)
        await EnumsFabric.saveInterfaces(enums)
    }

    private static async filterExistsEnums(enums: Array<IAmocrmEnum>): Promise<Array<IAmocrmEnum>> {
        const interfaces = await EnumsFabric.getExistsInterfaces(enums)
        EnumsFabric.addPragmaEnumId(interfaces, enums)
        return enums.filter(en => en.pragmaEnumId)
    }

    private static async getExistsInterfaces(enums: Array<IAmocrmEnum>): Promise<Array<any>> {
        const condition = enums.map(en => `amocrm_id = ${en.amocrmEnumId}`).join(' OR ')
        const sql = `SELECT
                        pragma_id AS pragmaEnumId,
                        amocrm_id AS amocrmEnumId
                    FROM ${super.amocrmEnumsSchema} 
                    WHERE ${condition}`
        return await super.query(sql, [], 'EnumsFabric -> getExistsInterfaces')
    }

    private static addPragmaEnumId(interfaces: Array<any>, enums: Array<IAmocrmEnum>): void {
        interfaces.forEach(i => {
            const en = enums.find(en => en.amocrmEnumId == i.amocrmEnumId)
            if(en) en.pragmaEnumId = i.pragmaEnumId
        })
    }

    private static async saveCore(existsEnums: Array<IAmocrmEnum>, newEnums: Array<IAmocrmEnum>): Promise<void> {
        await Promise.all([
            EnumsFabric.updateEnums(existsEnums),
            EnumsFabric.createEnums(newEnums)
        ])
    }

    private static async createEnums(enums: Array<IEnum>): Promise<void> {
        await Promise.all(enums.map(en => EnumsFabric.create(en)))
    }

    private static async create(newEnum: IEnum): Promise<void> {
        const sql = `INSERT INTO ${super.enumsSchema} (field_id, sort, value)
                    VALUES (?,?,?)`
        const model = [newEnum.pragmaFieldId, newEnum.sort, newEnum.value]
        const answer = await super.query(sql, model, 'EnumsFabric -> create')
        newEnum.pragmaEnumId = Number.parseInt(answer['insertId'])
    }

    private static async updateEnums(enums: Array<IEnum>): Promise<void> {
        await Promise.all(enums.map(en => EnumsFabric.update(en)))
    }

    private static async update(existsEnum: IEnum): Promise<void> {
        const sql = `UPDATE ${super.enumsSchema} 
                    SET sort = ?,
                        value = ?
                    WHERE id = ${existsEnum.pragmaEnumId}`
        const model = [existsEnum.sort, existsEnum.value]
        await super.query(sql, model, 'EnumsFabric -> update')
    }

    private static async saveInterfaces(enums: Array<IAmocrmEnum>): Promise<void> {
        const values = enums.map(en => `(${en.pragmaEnumId}, ${en.pragmaAccountId}, ${en.amocrmEnumId})`)
        const sql = `INSERT INTO ${super.amocrmEnumsSchema} (pragma_id, pragma_account_id, amocrm_id)
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE
                        pragma_account_id = VALUES(pragma_account_id),
                        amocrm_id = VALUES(amocrm_id),
                        pragma_id = VALUES(pragma_id)`
        await super.query(sql, [], 'EnumsFabric -> saveInterfaces')
    }
}