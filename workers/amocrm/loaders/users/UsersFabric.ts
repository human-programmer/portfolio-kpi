import {IAmocrmLoaders} from "../../interface";
import ILoadedUser = IAmocrmLoaders.ILoadedUser;
import {BasicDataBase} from "../../../../generals/data_base/BasicDataBase";
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;

export class UsersFabric extends BasicDataBase{

    static async save(users: Array<ILoadedUser>): Promise<void> {
        if(!users.length) return;
        const pieces = super.toSplit(users)
        await Promise.all(pieces.map(piece => UsersFabric.savePiece(piece)))
    }

    private static async savePiece(users: Array<ILoadedUser>): Promise<void> {
        await UsersFabric.saveUsersToPragmaTable(users)
        await Promise.all([
            UsersFabric.linkUsersToAccount(users),
            UsersFabric.saveAmocrmInterfaces(users),
            UsersFabric.saveRights(users)
        ])
    }

    private static async saveUsersToPragmaTable(users: Array<ILoadedUser>): Promise<void> {
        const usersToUpdate = await UsersFabric.filterUsersToUpdate(users)
        const usersToCreate = users.filter(i => !i.pragmaUserId)
        await Promise.all([
            UsersFabric.update(usersToUpdate),
            UsersFabric.saveNewUsers(usersToCreate)
        ])
    }

    private static async filterUsersToUpdate(users: Array<ILoadedUser>): Promise<Array<ILoadedUser>> {
        const condition = UsersFabric.createUpdateFilterCondition(users)
        const sql = UsersFabric.sql(condition)
        const existsUsers = await super.query(sql)
        return existsUsers.map(exUser => {
            const targetUser = users.find(i => i.email === exUser.email)
            if(!targetUser) return null
            targetUser.pragmaUserId = Number.parseInt(exUser.pragmaUserId)
            return targetUser
        }).filter(i => i)
    }

    private static createUpdateFilterCondition(users: Array<ILoadedUser>): string {
        const pragma = super.usersSchema
        return users.map(user => `${pragma}.email = '${user.email}'`).join(' OR ')
    }

    private static sql(condition: string): string {
        const pragma = super.usersSchema
        return `SELECT 
                    ${pragma}.id AS pragmaUserId,
                    ${pragma}.email AS email,
                    ${pragma}.name AS name
                FROM ${pragma}
                WHERE ${condition}`
    }

    private static async update(users: Array<ILoadedUser>): Promise<void> {
        if(!users.length) return ;
        const pragma = super.usersSchema
        const values = users.map(user => `(${super.escape(user.email)},${super.escape(user.name)})`).join(',')
        const sql = `INSERT INTO ${pragma} (email, name)
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE
                    name = VALUES(name)`
        await super.query(sql, [], 'UsersFabric -> update')
    }

    private static async saveNewUsers(users: Array<ILoadedUser>): Promise<void> {
        await Promise.all(users.map(i => UsersFabric.saveNewUser(i)))
    }

    private static async saveNewUser(user: ILoadedUser): Promise<void> {
        user.pragmaUserId = await UsersFabric.insertOneUser(user)
    }

    private static async insertOneUser(user: ILoadedUser): Promise<number> {
        const pragma = super.usersSchema
        const model = [user.email, user.name, user.lang]
        const sql = `INSERT INTO ${pragma} (email, name, lang)
                    VALUES (?,?,?)
                    ON DUPLICATE KEY UPDATE
                    name = VALUES(name)`
        const answer = await super.query(sql, model, 'UsersFabric -> insertOneUser')
        return Number.parseInt(answer['insertId'])
    }

    private static async linkUsersToAccount(users: Array<ILoadedUser>): Promise<void> {
        const linkedUsers = users.filter(i => i.pragmaUserId)
        const values = linkedUsers.map(i => `(${i.pragmaAccountId}, ${i.pragmaUserId})`).join(',')
        const links = super.usersToAccountsSchema
        const sql = `INSERT INTO ${links} (account_id, user_id)
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE
                    user_id = VALUES(user_id)`
        await super.query(sql, [], 'UsersFabric -> linkUsersToAccount')
    }

    private static async saveAmocrmInterfaces(users: Array<ILoadedUser>): Promise<void> {
        const linkedUsers = users.filter(i => i.pragmaUserId && i.amocrmUserId)
        const values = linkedUsers.map(i => `(${i.amocrmUserId}, ${i.pragmaUserId})`).join(',')
        const amocrm = super.amocrmUsersSchema
        const sql = `INSERT INTO ${amocrm} (amo_id, pragma_id)
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE
                    pragma_id = VALUES(pragma_id)`
        await super.query(sql, [], 'UsersFabric -> saveAmocrmInterfaces')
    }

    private static async saveRights(users: Array<ILoadedUser>): Promise<void> {
        const admins = users.filter(i => i.isAdmin)
        if(!admins.length) return;
        const adminPermissionId = await UsersFabric.getAdminId()
        if(!adminPermissionId)
            throw Errors.internalError('adminPermissionId not found')
        const accesses = super.accessesSchema
        const values = admins.map(i => `(${i.pragmaAccountId}, ${i.pragmaUserId}, ${adminPermissionId})`).join(',')
        const sql = `INSERT INTO ${accesses} (account_id, user_id, permission_id)
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE account_id = VALUES(account_id)`
        await super.query(sql, [], 'UsersFabric -> saveRights')
    }

    private static async getAdminId(): Promise<number> {
        const permissions = super.permissionsSchema
        const sql = `SELECT id FROM ${permissions} WHERE name = 'admin' AND module_id IS NULL`
        const answer = await super.query(sql, [], 'UsersFabric -> getAdminId')
        return Number.parseInt(answer[0]['id'])
    }
}