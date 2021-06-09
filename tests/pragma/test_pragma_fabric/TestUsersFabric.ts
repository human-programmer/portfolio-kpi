import {BasicDataBase} from "../../../generals/data_base/BasicDataBase";

export class TestUsersFabric extends BasicDataBase {
    static async createAndGetIds(account_id: number, quantity: number = 10): Promise<number[]> {
        const promises = []
        for(let i = 0; i < quantity; ++i)
            promises.push(TestUsersFabric.createUser(account_id))
        return await Promise.all(promises)
    }

    static async createUser (account_id: number): Promise<number> {
        const users = TestUsersFabric.usersSchema
        const sql = `INSERT INTO ${users} (confirm_email)
                    VALUES (0)`
        const answer = await super.query(sql, [], 'TestUsersFabric -> createUser')
        const id = Number.parseInt(answer['insertId'])
        await TestUsersFabric.linkUser(account_id, id)
        return id
    }

    static delayDeletion(ids: number[], ms: number = 2000): void {
        setTimeout(() => TestUsersFabric.delete(ids), ms)
    }

    static async delete(ids: number[]): Promise<void> {
        const statuses = TestUsersFabric.usersSchema
        const condition = ids.map(id => `id = ${id}`).join(' OR ')
        const sql = `DELETE FROM ${statuses} WHERE ${condition}`
        await super.query(sql, [], 'TestUsersFabric -> delete')
    }

    static async linkUser(account_id: number, user_id: number): Promise<void> {
        const schema = BasicDataBase.usersToAccountsSchema
        const sql = `INSERT INTO ${schema} (account_id, user_id)
                    VALUES (${account_id}, ${user_id})`
        await super.query(sql, [], 'TestUsersFabric -> linkUser')
    }
}