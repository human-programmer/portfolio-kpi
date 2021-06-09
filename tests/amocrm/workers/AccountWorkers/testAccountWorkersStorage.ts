import {TestFabric} from "../TestFabric";
import {checkTESTAndGetActualStatuses, compareTestWorkerStatuses} from "../workers_fabric/testWorkersFabric";
import {AmoAccWorkersStorage} from "../../../../workers/amocrm/AmoAccWorkers";
import {IMainWorkers} from "../../../../workers/main/interface";
import IAccountWorkers = IMainWorkers.IAccountWorkers;
import {
    checkTestResultIsCompleted,
    checkTestResultIsWaitingToStart,
    checkTestStatusesIsCompleted,
    TestWorkersWithPlugs
} from "./testAccountWorkers";

const chai = require('chai')

export async function testAccountsWorkersStorage(): Promise<void> {
    describe('AccountsWorkersStorage', () => {
        it('getWorkerForRun', async () => {
            const storage = getTestWorkersStorage()
            const worker0 = await storage.getWorkerForRun(123)
            const worker1 = await storage.getWorkerForRun(123)
            const worker2 = await storage.getWorkerForRun(124)
            chai.assert(storage.accWorkers.length === 2)
            chai.assert(storage.accWorkers.length === storage.timeouts.length)
            chai.assert(worker0 === worker1)
        })
        it('createWorkerForRun', async () => {
            const storage = getTestWorkersStorage()
            const worker0 = await storage.createWorkerForRun(123)
            const worker1 = await storage.createWorkerForRun(123)
            chai.assert(storage.accWorkers.length === 2)
            chai.assert(storage.accWorkers.length === storage.timeouts.length)
            chai.assert(worker0 !== worker1)
        })
        it('findInBuffer', async () => {
            const {storage, workers} = await getTestWorkersFromStorage()
            const worker0 = storage.findInBuffer(workers[0].pragmaAccountId)
            chai.assert(worker0 === workers[0])
        })
        it('setDelayDeletionFromBuffer', async () => {
            const storage = new TestStorageForDelayDeletion()
            const worker0 = await storage.createWorkerForRun(123)
            const worker1 = await storage.createWorkerForRun(124)
            setTimeout(() => chai.assert(storage.accWorkers.length === 2), 80)
            setTimeout(() => chai.assert(storage.accWorkers.length === 0), 120)
        })
        it('runWithoutWaitingEnd', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const storage = getTestWorkersStorage()
            const result = await storage.runWithoutWaitingEnd(job.node.account.pragma_account_id, job)
            checkTestResultIsWaitingToStart(result)
        })
        it('runWithoutWaitingEnd check end', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const storage = await getTestWorkersStorage()
            chai.assert(storage.accWorkers.length === 0)
            await storage.runWithoutWaitingEnd(job.node.account.pragma_account_id, job)
            chai.assert(storage.accWorkers.length === 1)
            await delay(500)
            chai.assert(storage.accWorkers.length === 0)
            const completedStatuses = await storage.getStatuses(job.node.account.pragma_account_id)

            checkTestStatusesIsCompleted(completedStatuses)
        })
        it('runWithoutWaitingEnd check buffer', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const storage = await getTestWorkersStorage()
            chai.assert(storage.accWorkers.length === 0)
            await storage.runWithoutWaitingEnd(job.node.account.pragma_account_id, job)
            chai.assert(storage.accWorkers.length === 1)
            await delay(500)
            chai.assert(storage.accWorkers.length === 0)
        })
        it('runWithoutWaitingEnd compare with runWaitingEnd', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const storage = await getTestWorkersStorage()
            await storage.runWithoutWaitingEnd(job.node.account.pragma_account_id, job)
            const result = await storage.runWaitingEnd(job.node.account.pragma_account_id, job)
            const completedStatuses = await storage.getStatuses(job.node.account.pragma_account_id)
            compareTestWorkerStatuses(result.statuses, completedStatuses)
        })
        it('runWaitingEnd', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const storage = await getTestWorkersStorage()
            const result = await storage.runWaitingEnd(job.node.account.pragma_account_id, job)
            checkTestResultIsCompleted(result)
            await checkTESTAndGetActualStatuses(result)
        })
        it('statuses', async () => {
            const job = await TestFabric.createLoadCRMJob()
            const storage = await getTestWorkersStorage()
            // @ts-ignore
            const result = await storage.runWithoutWaitingEnd(job.node.account.pragma_account_id, job)
            const actualStatuses = await storage.getStatuses(job.node.account.pragma_account_id)
            compareTestWorkerStatuses(actualStatuses, result.statuses)
        })
    })
}

async function delayExecute(func: any, ...args: any[]): Promise<any> {
    return new Promise(resolve => setTimeout(() => resolve(func(...args)), 50))
}

async function getTestWorkersFromStorage(): Promise<any> {
    const storage = getTestWorkersStorage()
    return {storage, workers: await Promise.all([
            storage.getWorkerForRun(123),
            storage.getWorkerForRun(124),
            storage.getWorkerForRun(125),
            storage.getWorkerForRun(125),
        ])}
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function getTestWorkersStorage(): TestAccWorkersStorage {
    return new TestAccWorkersStorage()
}

export class TestAccWorkersStorage extends AmoAccWorkersStorage {
    readonly accWorkers: IAccountWorkers[] = []
    readonly timeouts: any[] = []

    constructor() {
        super()
    }

    protected async create(pragmaAccountId: number): Promise<IAccountWorkers> {
        return new TestWorkersWithPlugs(pragmaAccountId)
    }
    async getWorkerForRun(pragmaAccountId: number): Promise<IAccountWorkers> {
        return super.getWorkerForRun(pragmaAccountId)
    }

    async createWorkerForRun(pragmaAccountId: number): Promise<IAccountWorkers> {
        return super.createWorkerForRun(pragmaAccountId)
    }

    findInBuffer(pragmaAccountId: number): IAccountWorkers|null {
        return super.findInBuffer(pragmaAccountId)
    }
}

class TestStorageForDelayDeletion extends TestAccWorkersStorage {
    readonly delayDeletionFromBuffer: number = 100
}