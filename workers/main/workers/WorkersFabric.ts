import {BasicDataBase} from "../../../generals/data_base/BasicDataBase";
import {IMainWorkers} from "../interface";
import IWorkerStatus = IMainWorkers.IWorkerStatus;
import WorkerStatus = IMainWorkers.WorkerStatus;
import IWorkerResult = IMainWorkers.IWorkerResult;
import IWorkerResultBody = IMainWorkers.IWorkerResultBody;

class WorkersFabricSaver extends BasicDataBase {
    static async save(worker_result: IWorkerResult): Promise<void> {
        const accId = worker_result.job.node.account.pragma_account_id
        await WorkersFabricSaver.saveStatuses(accId, worker_result.statuses)
    }

    private static async saveStatuses(pragmaAccountId: number, statuses: IWorkerStatus[]): Promise<void> {
        const filterStatuses = WorkersFabricSaver.filterAvailableStatuses(statuses)
        await Promise.all(filterStatuses.map(i => WorkersFabricSaver.saveStatus(pragmaAccountId, i)))
    }

    private static filterAvailableStatuses(statuses: IWorkerStatus[]): IWorkerStatus[] {
        return statuses.filter(i => i.status_name === WorkerStatus.error || i.status_name === WorkerStatus.completed)
    }

    private static async saveStatus(pragmaAccountId: number, status: IWorkerStatus): Promise<void> {
        const values = WorkersFabricSaver.createValuesString(pragmaAccountId, status)
        const sql = `INSERT INTO ${BasicDataBase.workResultsSchema} (account_id, job_name, result_status, loaded, start_date, duration_ms, error)
                    VALUES ${values}`
        const model = WorkersFabricSaver.createQueryModel(status)
        await super.query(sql, model, "WorkersFabric -> saveByPieces")
    }

    private static createQueryModel(status: IWorkerStatus): Array<any> {
        const errorString = WorkersFabricSaver.fetchErrorString(status)
        const duration = WorkersFabric.fetchDurationTime(status)
        return [status.start_date, duration, errorString]
    }

    private static createValuesString(pragmaAccountId: number, status: IWorkerStatus): string {
        const loaded = WorkersFabricSaver.fetchLoaded(status)
        return `(${pragmaAccountId}, '${status.full_work_name}', '${status.status_name}', '${loaded}', ?, ?, ?)`
    }

    private static fetchLoaded(status: IWorkerStatus): number {
        const body:any = typeof status.result_body === "object" ? status.result_body : {}
        const add_info:any = typeof body.add_info === "object" ? body.add_info : {}
        return add_info.loaded || 0
    }

    private static fetchErrorString(status: IWorkerStatus): string|null {
        const result_body: any = typeof status.result_body === 'object' ? status.result_body : {}
        if(result_body.error)
            return WorkersFabricSaver.safeToString(result_body.error)
        return null
    }

    private static fetchDurationTime(status: IWorkerStatus): number {
        if(!status.start_date) return 0
        const end_date = status.completion_date || new Date()
        return end_date.getTime() - status.start_date.getTime()
    }

    private static safeToString(error: any): string|null {
        try {
            return JSON.stringify(error)
        } catch (e) {
            return 'error'
        }
    }
}

export class WorkersFabric extends WorkersFabricSaver {
    static async getStatuses(pragmaAccountId: number): Promise<IWorkerStatus[]> {
        const rows = await WorkersFabric.queryStatuses(pragmaAccountId)
        return WorkersFabric.formattingRows(rows)
    }
    private static async queryStatuses(pragmaAccountId: number): Promise<IWorkerStatus[]> {
        const sql = `SELECT
                        job_name as full_work_name,
                        result_status as status_name,
                        loaded as loaded,
                        start_date as start_date,
                        duration_ms,
                        error as error
                    FROM ${WorkersFabricSaver.workResultsSchema} 
                        INNER JOIN (
                            SELECT
                                    account_id,
                                    job_name as alias_job_name,
                                    MAX(start_date) as alias_start_date
                                FROM ${WorkersFabricSaver.workResultsSchema} 
                                WHERE account_id = ${pragmaAccountId}
                                GROUP BY job_name) alias 
                            ON alias.alias_job_name = job_name AND alias.alias_start_date = start_date
                    WHERE ${WorkersFabricSaver.workResultsSchema}.account_id = ${pragmaAccountId}
                    GROUP BY job_name`
        return await super.query(sql, [], 'WorkersFabric -> queryStatuses')
    }

    private static formattingRows(rows: Array<any>): Array<IWorkerStatus> {
        return rows.map(i => {
            const endTime = i.start_date ? Number.parseInt(i.duration_ms) + i.start_date.getTime() : 0
            return {
                full_work_name: i.full_work_name,
                status_name: i.status_name,
                start_date: i.start_date,
                completion_date: new Date(endTime),
                result_body: WorkersFabric.fetchResultBody(i),
                duration_ms: endTime - i.start_date.getTime(),
            }
        })
    }

    private static fetchResultBody(row: any): IWorkerResultBody {
        return {add_info: {loaded: row.loaded, total: -1}, error: WorkersFabric.fetchError(row)}
    }

    private static fetchError (row: any): any {
        if(!row.error) return null
        let error
        try {
            error = JSON.parse(row.error)
        } catch (e){

        } finally {
            return error || row.error
        }
    }
}