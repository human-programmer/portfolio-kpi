import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {IMain} from "../../../crm_systems/main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;
import {Configs} from "../../../generals/Configs";
import {HttpsClient} from "../../../crm_systems/main/HttpsClient";
import {IAmocrmLoaders} from "../../../workers/amocrm/interface";
import IAmocrmLoadJob = IAmocrmLoaders.IAmoJob;
import {TestAmocrmAccounts} from "../accounts/TestAmocrmAccounts";
import {AmocrmAccounts} from "../../../crm_systems/amocrm/components/accounts/AmocrmAccounts";
import IAccount = Amocrm.IAccount;
import {TestAmocrmNodes} from "../accounts_modules/TestAmocrmNodes";
import {TestAmocrmModules} from "../modules/TestAmocrmModules";
import IAccountModule = Amocrm.IAccountModule;
import IAmocrmJob = IAmocrmLoaders.IAmoJob;
import {IMainWorkers} from "../../../workers/main/interface";
import WorkName = IMainWorkers.WorkName;
import WorkerTarget = IMainWorkers.LoadWorkerTarget;
import IJob = IMainWorkers.IJob;

const code = 'Dashboard'
const subdomain = 'pragmadev'
const accId = 28967662
const referer = subdomain + '.amocrm.ru'

Configs.setIsMainThread(true)
// @ts-ignore
Configs.server._host = '185.152.139.30'


export class TestFabric {
    static account: IAccount

    static async init(): Promise<void> {
        if(TestFabric.account) return;
        const account = await AmocrmAccounts.self.createAnGetAccountByReferer(referer)
        // @ts-ignore
        TestFabric.account = account
        // @ts-ignore
        account._amocrmAccountId = accId
        // @ts-ignore
        await account.saveAmocrmInterface()
    }

    static async createLoadEntitiesJob(node?: IAmocrmNodeStruct): Promise<IAmocrmLoadJob> {
        return TestFabric.createLoadJob(WorkerTarget.entities, node)
    }

    static async createLoadCRMJob(node?: IAmocrmNodeStruct): Promise<IAmocrmLoadJob> {
        return TestFabric.createLoadJob(WorkerTarget.crm, node)
    }

    static async createLoadCustomFieldsJob(node?: IAmocrmNodeStruct): Promise<IAmocrmLoadJob> {
        return TestFabric.createLoadJob(WorkerTarget.customFields, node)
        return {
            work_name: WorkName.load,
            full_name: WorkName.load + ":" + WorkerTarget.customFields,
            node,
            target: WorkerTarget.customFields
        }
    }

    static async createLoadPipelinesJob(node?: IAmocrmNodeStruct): Promise<IAmocrmLoadJob> {
        return TestFabric.createLoadJob(WorkerTarget.pipelines, node)
    }

    static async createLoadUsersJob(node?: IAmocrmNodeStruct): Promise<IAmocrmLoadJob> {
        return TestFabric.createLoadJob(WorkerTarget.users, node)
    }

    static async createLoadJob(workTarget: WorkerTarget, node?: IAmocrmNodeStruct): Promise<IAmocrmLoadJob> {
        node = node || await TestFabric.getTestNodeStruct()
        return {
            work_name: WorkName.load,
            full_name: WorkName.load + ":" + workTarget,
            node,
            target: workTarget
        }
    }

    static async getTestNodeStruct(): Promise<IAmocrmNodeStruct> {
        const options = TestFabric.createOptions()
        const answer = await HttpsClient.executeRequest(options)
        return answer.body.result[0]
    }

    private static createOptions(): IRequestOptions {
        const body = {
            client_module_code: code,
            account_referer: referer,
            filter: {code, amocrm_referer: referer}
        }
        return {
            body,
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            uri: `http://${Configs.server.host}:${Configs.server.port}/amocrm/nodes/get`
        }
    }

    static async uniqueLoadUsersJob(): Promise<IAmocrmJob> {
        const node = await TestFabric.uniqueNodeStruct()
        return await TestFabric.createLoadUsersJob(node)
    }

    static async uniqueLoadPipelinesJob(): Promise<IAmocrmJob> {
        const node = await TestFabric.uniqueNodeStruct()
        return await TestFabric.createLoadPipelinesJob(node)
    }

    static async uniqueLoadCustomFieldsJob(): Promise<IAmocrmJob> {
        const node = await TestFabric.uniqueNodeStruct()
        return await TestFabric.createLoadPipelinesJob(node)
    }

    static async uniqueNodeStruct(): Promise<IAmocrmNodeStruct> {
        const node = await TestFabric.uniqueNode()
        return node.publicModel
    }

    static async uniqueNode(): Promise<IAccountModule> {
        return await TestFabric.TestNodes().createTestNode()
    }

    static TestNodes(): TestAmocrmNodes {
        const testModules = new TestAmocrmModules()
        const testAccounts = new TestAmocrmAccounts()
        return new TestAmocrmNodes(testModules, testAccounts)
    }
}