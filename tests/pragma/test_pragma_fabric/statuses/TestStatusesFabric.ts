import {BasicDataBase} from "../../../../generals/data_base/BasicDataBase";

export class TestStatusesFabric extends BasicDataBase {
    static async createAndGetIds(quantity: number = 50): Promise<number[]> {
        const promises = []
        for(let i = 0; i < quantity; ++i)
            promises.push(TestStatusesFabric.createStatus())
        return await Promise.all(promises)
    }

    static async createStatus (): Promise<number> {
        const statuses = TestStatusesFabric.statusesSchema
        const sql = `INSERT INTO ${statuses} (name, color, sort)
                    VALUES ('qwe', 'rty', 10)`
        const answer = await super.query(sql, [], 'TestStatusesFabric -> createStatus')
        return Number.parseInt(answer['insertId'])
    }

    static delayDeletion(ids: number[], ms: number = 2000): void {
        setTimeout(() => TestStatusesFabric.delete(ids), ms)
    }

    static async delete(ids: number[]): Promise<void> {
        const statuses = TestStatusesFabric.statusesSchema
        const condition = ids.map(id => `id = ${id}`).join(' OR ')
        const sql = `DELETE FROM ${statuses} WHERE ${condition}`
        await super.query(sql, [], 'TestStatusesFabric -> delete')
    }
}