import {Generals} from "../../../generals/Interfaces";
import EntityGroup = Generals.EntityGroup;
import {BasicDataBase} from "../../../generals/data_base/BasicDataBase";

export interface ITestEntity {
    readonly id: number
    readonly price: number
}

export class TestEntitiesFabric extends BasicDataBase {
    // static async createAndGetIds(account_id: number, quantity: number = 50): Promise<number[]> {
    //     const promises = []
    //     for(let i = 0; i < quantity; ++i)
    //         promises.push(TestEntitiesFabric.createEntity(account_id))
    //     return await Promise.all(promises)
    // }

    static async createTestEntities(account_id: number, quantity: number = 50): Promise<ITestEntity[]> {
        const promises = []
        for(let i = 0; i < quantity; ++i)
            promises.push(TestEntitiesFabric.createEntity(account_id))
        return await Promise.all(promises)
    }

    static async createEntity (account_id: number): Promise<ITestEntity> {
        const entities = TestEntitiesFabric.entitiesSchema
        const price = TestEntitiesFabric.randPrice()
        const sql = `INSERT INTO ${entities} (account_id, entity_type, price)
                    VALUES (${account_id}, ${EntityGroup.leads}, ${price})`
        const answer = await super.query(sql)
        const id = Number.parseInt(answer['insertId'])
        return {id, price}
    }

    private static randPrice(): number {
        return Math.ceil(Math.random() * 100)
    }

    static delayDeletion(ids: number[], ms: number = 2000): void {
        setTimeout(() => TestEntitiesFabric.delete(ids), ms)
    }

    static async delete(ids: number[]): Promise<void> {
        const entities = TestEntitiesFabric.entitiesSchema
        const condition = ids.map(id => `id = ${id}`).join(' OR ')
        const sql = `DELETE FROM ${entities} WHERE ${condition}`
        await super.query(sql)
    }
}