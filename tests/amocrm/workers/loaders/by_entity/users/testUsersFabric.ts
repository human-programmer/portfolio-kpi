import {CRMDB} from "../../../../../../generals/data_base/CRMDB";
import {IAmocrmLoaders} from "../../../../../../workers/amocrm/interface";
import ILoadedUser = IAmocrmLoaders.ILoadedUser;
import {IBasic} from "../../../../../../generals/IBasic";
import randomString = IBasic.randomString;
import {UsersFabric} from "../../../../../../workers/amocrm/loaders/users/UsersFabric";

const chai = require('chai')

let pragmaAccountId = 89209

export async function testUsersFabric(): Promise<void> {
    describe('UsersFabric', async () => {
        it('save', async () => {
            const usersToSave = TestLoadedUsers.generateUsersToSave()
            await UsersFabric.save(usersToSave)
            const actualUsers = await TestLoadedUsers.getUsers(usersToSave.map(i => i.pragmaUserId))
            // @ts-ignore
            compareUsers(usersToSave, actualUsers)
        })
        it('update', async () => {
            const usersToSave = TestLoadedUsers.generateUsersToSave(1)
            await UsersFabric.save(usersToSave)
            // @ts-ignore
            usersToSave.name = 'testNAMe'
            // @ts-ignore
            usersToSave.pragmaUserId = undefined
            await UsersFabric.save(usersToSave)
            const actualUsers = await TestLoadedUsers.getUsers(usersToSave.map(i => i.pragmaUserId))
            // @ts-ignore
            compareUsers(usersToSave, actualUsers)
        })
    })
}

export async function saveTestUniqueUsers(quantity: number = 200): Promise<Array<ILoadedUser>> {
    const users = TestLoadedUsers.generateUsersToSave(quantity)
    await UsersFabric.save(users)
    return users
}

class TestLoadedUsers extends CRMDB{
    static async findById(id: number): Promise<any|null> {
        const condition = `${super.usersSchema}.id = ?`
        return await TestLoadedUsers.singleSelect(condition, [id])
    }

    private static async singleSelect(condition: string, params: Array<number|string>): Promise<any|null> {
        const sql = TestLoadedUsers.sql(condition)
        const models = await super.query(sql, params)
        return models[0] || null
    }

    static async getUsers(id: Array<number>): Promise<ILoadedUser> {
        const pragma = super.usersSchema
        const condition = id.map(i => `${pragma}.id = ${i}`).join(' OR ')
        const sql = TestLoadedUsers.sql(condition)
        const users = await super.query(sql)
        // @ts-ignore
        return users.map(i => {
            i.isAdmin = i.accessName === 'admin'
            return i
        })
    }

    private static sql(condition: string): string {
        const pragma = super.usersSchema
        const toAccounts = super.usersToAccountsSchema
        const accesses = super.accessesSchema
        const permissions = super.permissionsSchema
        const amocrm = super.amocrmUsersSchema
        return `SELECT 
                     ${pragma}.id AS pragmaUserId,
                     ${pragma}.name AS name,
                     ${pragma}.email AS email,
                     ${pragma}.lang AS lang,
                     ${amocrm}.amo_id AS amocrmUserId,
                     ${toAccounts}.account_id AS pragmaAccountId,
                     ${permissions}.name AS accessName
                FROM ${pragma}
                    LEFT JOIN ${amocrm} ON ${amocrm}.pragma_id = ${pragma}.id
                    LEFT JOIN ${toAccounts} ON ${toAccounts}.user_id = ${pragma}.id
                    LEFT JOIN ${accesses} ON ${accesses}.user_id = ${pragma}.id
                    LEFT JOIN ${permissions} ON ${permissions}.id = ${accesses}.permission_id
                WHERE ${condition} 
                GROUP BY ${pragma}.id`
    }

    static generateUsersToSave(quantity: number = 200): Array<ILoadedUser> {
        let result = []
        const pragmaAccountId = Math.floor(Math.random() * 1000000)
        for (let i = 0; i < quantity; ++i)
            result.push(TestLoadedUsers.createUniqueUserStruct(pragmaAccountId))
        return result
    }

    private static createUniqueUserStruct(pragmaAccountId: number): ILoadedUser {
        const email =`${randomString(10)}@qwerty.io`
        setTimeout(() => TestLoadedUsers.deleteUsers([email]), 2000)

        return {
            amocrmUserId: Math.floor(Math.random() * 1000000),
            email,
            isAdmin: !!Math.round(Math.random()),
            lang: randomString(4),
            name: randomString(43),
            pragmaAccountId: pragmaAccountId
        }
    }

    private static async deleteUsers(emails: Array<string>): Promise<void> {
        const pragma = super.usersSchema
        const condition = emails.map(email => `${pragma}.email = '${email}'`).join(' OR ')
        const sql = `DELETE FROM ${pragma} WHERE ${condition}`
        await super.query(sql)
    }
}

function compareUsers(users0: Array<ILoadedUser>, users1: Array<ILoadedUser>): void {
    chai.assert(users0.length === users1.length)
    users0.forEach(user => compareUser(user, users1.find(i => i.pragmaUserId === user.pragmaUserId)))
}

function compareUser(user0: ILoadedUser, user1: ILoadedUser): void {
    chai.assert(user0.pragmaAccountId === user1.pragmaAccountId)
    chai.assert(user0.pragmaUserId === user1.pragmaUserId)
    chai.assert(user0.amocrmUserId === user1.amocrmUserId)
    chai.assert(user0.email === user1.email)
    chai.assert(user0.name === user1.name)
    chai.assert(user0.lang === user1.lang)
    chai.assert(user0.isAdmin === user1.isAdmin)
}