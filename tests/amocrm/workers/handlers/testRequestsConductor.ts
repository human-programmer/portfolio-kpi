import {RequestsConductor} from "../../../../workers/amocrm/RequestsConductor";
import {InstallEventHandler} from "../../../../workers/amocrm/handlers/InstallEventHandler";
import {IAmocrmLoaders} from "../../../../workers/amocrm/interface";
import IInstallEventRequest = IAmocrmLoaders.IInstallEventRequest;
import {IMainWorkers} from "../../../../workers/main/interface";
import IAccWorkersStorage = IMainWorkers.IAccWorkersStorage;
import {checkTestResultIsWaitingToStart} from "../AccountWorkers/testAccountWorkers";
import {TestAccWorkersStorage} from "../AccountWorkers/testAccountWorkersStorage";
import WorkerMethods = IAmocrmLoaders.WorkerMethods;
import {TestFabric} from "../TestFabric";
import createInstallEventRequest = IAmocrmLoaders.createInstallEventRequest;

const chai = require('chai')

export async function testRequestsConductor(): Promise<void> {
    describe('Workers RequestsConductor', () => {
        describe(WorkerMethods.install_module_event, () => {
            it('InstallEventHandler', async () => {
                const node = await TestFabric.uniqueNode()
                const request = createInstallEventRequest(node.publicModel)
                const conductor = new TestRequestsConductor()
                const result = await conductor.execute(request)
                checkTestResultIsWaitingToStart(result.result)
            })
        })
    })
}

class TestRequestsConductor extends RequestsConductor {
    constructor() {
        super()
    }


    protected createInstallHandler(request: IInstallEventRequest) : InstallEventHandler {
        return new TestInstallEventHandler(request)
    }
}

class TestInstallEventHandler extends InstallEventHandler {
    private testStorage: any

    protected get workersStorage(): IAccWorkersStorage {
        if(this.testStorage) return this.testStorage
        this.testStorage = new TestAccWorkersStorage()
        return this.testStorage
    }
}