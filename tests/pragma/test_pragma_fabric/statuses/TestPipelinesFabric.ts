import {Generals} from "../../../../generals/Interfaces";
import IStatus = Generals.IStatus;
import {BasicDataBase} from "../../../../generals/data_base/BasicDataBase";

const statusQuantity = 5

export class TestPipelinesFabric extends BasicDataBase {
    static async createAndGetIds(account_id: number, quantity: number = 10): Promise<number[]> {
        const promises = []
        for(let i = 0; i < quantity; ++i)
            promises.push(TestPipelinesFabric.createPipeline(account_id))
        return await Promise.all(promises)
    }

    static async createPipeline (account_id: number): Promise<number> {
        const statuses = TestPipelinesFabric.pipelinesSchema
        const sql = `INSERT INTO ${statuses} (account_id, name, sort)
                    VALUES (${account_id}, 'qwe', 10)`
        const answer = await super.query(sql, [], 'TestPipelinesFabric -> createPipeline')
        return Number.parseInt(answer['insertId'])
    }

    static delayDeletion(ids: number[], ms: number = 2000): void {
        setTimeout(() => TestPipelinesFabric.delete(ids), ms)
    }

    static async delete(ids: number[]): Promise<void> {
        const statuses = TestPipelinesFabric.pipelinesSchema
        const condition = ids.map(id => `id = ${id}`).join(' OR ')
        const sql = `DELETE FROM ${statuses} WHERE ${condition}`
        await super.query(sql, [], 'TestPipelinesFabric -> delete')
    }

    static async distributeStatuses(pipelines_id: number[], statuses_id: number[]): Promise<IStatus[]> {
        statuses_id = [].concat(statuses_id)
        const arr = await Promise.all([].concat(...pipelines_id.map(async (pipeline_id, index) => {
            const statusesPack = statuses_id.splice(index * statusQuantity, statusQuantity)
            await TestPipelinesFabric.addStatuses(pipeline_id, statusesPack)
            return statusesPack.map(status_id => {
                return {pipeline_id, status_id}
            })
        })))
        return [].concat(...arr)
    }

    static async addStatuses(pipeline_id: number, statuses_id: number[]): Promise<void> {
        const values = statuses_id.map(id => `(${pipeline_id}, ${id})`).join(',')
        const schema = BasicDataBase.statusesToPipelineSchema
        const sql = `INSERT INTO ${schema} (pipeline_id, status_id)
                    VALUES ${values}`
        await super.query(sql, [], 'TestPipelinesFabric -> addStatuses')
    }
}