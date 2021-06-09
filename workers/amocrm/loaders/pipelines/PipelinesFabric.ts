import {BasicDataBase} from "../../../../generals/data_base/BasicDataBase";
import {IAmocrmLoaders} from "../../interface";
import IPipeline = IAmocrmLoaders.IPipeline;
import IStatus = IAmocrmLoaders.IStatus;

export class PipelinesFabric extends BasicDataBase {
    static async save (pipelines: Array<IPipeline>): Promise<void> {
        const pieces = super.toSplit(pipelines)
        await Promise.all(pieces.map(piece => PipelinesFabric.savePiece(piece)))
    }

    private static async savePiece (pipelines: Array<IPipeline>): Promise<void> {
        const existsPipelines = await PipelinesFabric.filterExistsPipelines(pipelines)
        const newPipelines = pipelines.filter(i => !i.pragmaPipelineId)
        await Promise.all([
            PipelinesFabric.insertPipelines(newPipelines),
            PipelinesFabric.updatePipelines(existsPipelines)
        ])
        await Promise.all([
            PipelinesFabric.saveInterfaces(pipelines),
            PipelinesFabric.saveStatuses(pipelines)
        ])
    }

    private static async filterExistsPipelines(pipelines: Array<IPipeline>): Promise<Array<IPipeline>> {
        await PipelinesFabric.addPragmaPipelinesId(pipelines)
        return pipelines.filter(i => i.pragmaPipelineId)
    }

    private static async addPragmaPipelinesId(pipelines: Array<IPipeline>): Promise<void> {
        const interfaces = await PipelinesFabric.getExistsInterfaces(pipelines)
        interfaces.forEach(i => {
            const pipeline = pipelines.find(p => p.amocrmPipelineId == i.amocrmPipelineId)
            if(pipeline) pipeline.pragmaPipelineId = Number.parseInt(i.pragmaPipelineId)
        })
    }

    private static async getExistsInterfaces(pipelines: Array<IPipeline>): Promise<Array<any>> {
        const amocrm = super.amocrmPipelinesSchema
        const condition = pipelines.map(i => `${amocrm}.amocrm_id = ${i.amocrmPipelineId}`).join(' OR ')
        const sql = PipelinesFabric.sql(condition)
        return await super.query(sql, [], 'PipelinesFabric -> getExistsInterfaces')
    }

    private static sql (condition: string): string {
        const amocrm = super.amocrmPipelinesSchema
        return `SELECT 
                    ${amocrm}.pragma_id AS pragmaPipelineId,
                    ${amocrm}.amocrm_id AS amocrmPipelineId
                FROM ${amocrm}
                WHERE ${condition}`
    }

    private static async insertPipelines(pipelines: Array<IPipeline>): Promise<void> {
        await Promise.all(pipelines.map(i => PipelinesFabric.createPipeline(i)))
    }

    private static async createPipeline(pipeline: IPipeline): Promise<void> {
        await PipelinesFabric.insertPipeline(pipeline)
    }

    private static async insertPipeline(pipeline: IPipeline): Promise<void> {
        const sql = `INSERT INTO ${super.pipelinesSchema} (account_id, name, sort)
                    VALUES (?, ?, ?)`
        const model = [pipeline.pragmaAccountId, pipeline.title, pipeline.sort]
        const answer = await super.query(sql, model, 'PipelinesFabric -> insertPipeline')
        pipeline.pragmaPipelineId = Number.parseInt(answer['insertId'])
    }

    private static async saveInterfaces(pipelines: Array<IPipeline>): Promise<void> {
        const values = pipelines.map(i => `(${i.pragmaPipelineId}, ${i.pragmaAccountId}, ${i.amocrmPipelineId})`).join(',')
        const sql = `INSERT INTO ${super.amocrmPipelinesSchema} (pragma_id, pragma_account_id, amocrm_id)
                    VALUES ${values}
                    ON DUPLICATE KEY UPDATE 
                        pragma_id = VALUES(pragma_id),
                        pragma_account_id = VALUES(pragma_account_id),
                        amocrm_id = VALUES(amocrm_id)`
        await super.query(sql, [], 'PipelinesFabric -> saveInterfaces')
    }

    private static async updatePipelines(pipelines: Array<IPipeline>): Promise<void> {
        await Promise.all(pipelines.map(i => PipelinesFabric.updatePipeline(i)))
    }

    private static async updatePipeline(pipeline: IPipeline): Promise<void> {
        const pragma = super.pipelinesSchema
        const sql = `UPDATE ${pragma} SET name = ?, sort = ? WHERE id = ${pipeline.pragmaPipelineId}`
        await super.query(sql, [pipeline.title, pipeline.sort], 'PipelinesFabric -> updatePipeline')
    }


    private static async saveStatuses(pipelines: Array<IPipeline>): Promise<void> {
        PipelinesFabric.addPragmaPipelineIdToStatus(pipelines)
        const statuses = [].concat(...pipelines.map(i => i.statuses))
        await StatusesFabric.save(statuses)
    }

    private static addPragmaPipelineIdToStatus(pipelines: Array<IPipeline>): void {
        pipelines.forEach(i => PipelinesFabric.addId(i.pragmaPipelineId, i.statuses))
    }

    private static addId(pragmaPipelineId: number, statuses: Array<IStatus>): void {
        statuses.forEach(status => status.pragmaPipelineId = pragmaPipelineId)
    }
}

export class StatusesFabric extends BasicDataBase {
    static async save (statuses: Array<IStatus>): Promise<void> {
        const pieces = super.toSplit(statuses)
        await Promise.all(pieces.map(piece => StatusesFabric.savePiece(piece)))
    }

    private static async savePiece(statuses: Array<IStatus>): Promise<void> {
        const existsStatuses = await StatusesFabric.filterExistsStatuses(statuses)
        const newStatuses = statuses.filter(i => !i.pragmaStatusId)

        await this.saveCore(existsStatuses, newStatuses)
        await this.savePeriphery(statuses)
    }

    private static async saveCore(exists: Array<IStatus>, newStatuses: Array<IStatus>): Promise <void> {
        await Promise.all([
            StatusesFabric.insertStatuses(newStatuses),
            StatusesFabric.updateStatuses(exists)
        ])
    }

    private static async savePeriphery(statuses: Array<IStatus>): Promise<void> {
        await Promise.all([
            StatusesFabric.linkToPipeline(statuses),
            StatusesFabric.saveInterfaces(statuses)
        ])
    }

    private static async filterExistsStatuses(statuses: Array<IStatus>): Promise<Array<IStatus>> {
        const interfaces = await StatusesFabric.getExistsInterfaces(statuses)
        return statuses.filter(stat => {
            const i = interfaces.find(i => i.amocrmStatusId == stat.amocrmStatusId)
            if(i) stat.pragmaStatusId = i.pragmaStatusId
            return !!i
        })
    }

    private static async getExistsInterfaces(status: Array<IStatus>): Promise<Array<any>> {
        const amocrm = super.amocrmStatusesSchema
        const condition = status.map(i => `${amocrm}.amocrm_id = ${i.amocrmStatusId}`).join(' OR ')
        const sql = StatusesFabric.sql(condition)
        return await super.query(sql, [], 'StatusesFabric -> getExistsInterfaces')
    }

    private static sql (condition: string): string {
        const amocrm = super.amocrmStatusesSchema
        return `SELECT 
                    ${amocrm}.pragma_id AS pragmaStatusId,
                    ${amocrm}.amocrm_id AS amocrmStatusId
                FROM ${amocrm}
                WHERE ${condition}`
    }

    private static async insertStatuses(statuses: Array<IStatus>): Promise<void>{
        if(!statuses.length) return;
        await Promise.all(statuses.map(i => StatusesFabric.insertStatus(i)))
    }

    private static async insertStatus(status: IStatus): Promise<void>{
        const sql = `INSERT INTO ${super.statusesSchema} (name, color, sort)
                    VALUES (?, ?, ?)`
        const model = [status.title, status.color, status.sort]
        const answer = await super.query(sql, model, 'StatusesFabric -> insertStatus')
        status.pragmaStatusId = Number.parseInt(answer['insertId'])
    }

    private static async updateStatuses(statuses: Array<IStatus>): Promise<void>{
        if(!statuses.length) return;
        await Promise.all(statuses.map(i => StatusesFabric.updateStatus(i)))
    }

    private static async updateStatus(status: IStatus): Promise<void> {
        const pragma = super.statusesSchema
        const sql = `UPDATE ${pragma} SET name = ?, sort = ? WHERE id = ${status.pragmaStatusId}`
        await super.query(sql, [status.title, status.sort], 'StatusesFabric -> updateStatus')
    }

    private static async linkToPipeline(statuses: Array<IStatus>): Promise<void> {
        const values = statuses.map(i => `(${i.pragmaPipelineId}, ${i.pragmaStatusId})`).join(',')
        const links = super.statusesToPipelineSchema
        const sql = `INSERT INTO ${links} (pipeline_id, status_id) VALUES ${values} 
                    ON DUPLICATE KEY UPDATE
                        pipeline_id = VALUES(pipeline_id),
                        status_id = VALUES(status_id)`
        await super.query(sql, [], 'StatusesFabric -> linkToPipeline')
    }

    private static async saveInterfaces(statuses: Array<IStatus>): Promise<void> {
        const values = statuses.map(i => `(${i.pragmaStatusId}, ${i.amocrmStatusId})`).join(',')
        const amocrm = super.amocrmStatusesSchema
        const sql = `INSERT INTO ${amocrm} (pragma_id, amocrm_id) VALUES ${values} 
                    ON DUPLICATE KEY UPDATE
                        pragma_id = VALUES(pragma_id),
                        amocrm_id = VALUES(amocrm_id)`
        await super.query(sql, [], 'StatusesFabric -> saveInterfaces')
    }
}