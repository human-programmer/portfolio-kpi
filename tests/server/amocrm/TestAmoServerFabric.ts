import {TestAmocrmNodes} from "../../amocrm/accounts_modules/TestAmocrmNodes";
import {TestAmocrmModules} from "../../amocrm/modules/TestAmocrmModules";
import {TestAmocrmAccounts} from "../../amocrm/accounts/TestAmocrmAccounts";
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAccountModule = Amocrm.IAccountModule;
import IGetNodesQuery = Amocrm.IGetNodesQuery;
import IInputNodesRequest = Amocrm.IInputNodesRequest;
import {IServer} from "../../../server/intrfaces";
import RequestCrmName = IServer.RequestCrmName;
import RequestEntity = IServer.RequestEntity;
import INodesFilter = Amocrm.INodesFilter;

export class TestAmoServerFabric {
    static async createGetNodesRequest(): Promise<any> {
        const node = await TestAmoServerFabric.uniqueNode()
        return {request: TestAmoServerFabric._createGetNodesRequest(node), node}
    }

    private static _createGetNodesRequest(node: IAccountModule): IInputNodesRequest {
        // @ts-ignore
        const filter: INodesFilter = {code: [node.module.code], pragma_account_id: [node.account.pragmaAccountId]}
        const query: IGetNodesQuery = {filter, client_module_code: node.module.code}
        return TestAmoServerFabric._createNodesRequest(query, 'get')
    }

    private static _createNodesRequest(query: any, method: string): IInputNodesRequest {
        return {
            crmName: RequestCrmName.amocrm,
            entity: RequestEntity.nodes,
            method,
            query
        }
    }

    static async uniqueNode(): Promise<IAccountModule> {
        return await TestAmoServerFabric.TestNodes().createTestNode()
    }

    static TestNodes(): TestAmocrmNodes {
        const testModules = new TestAmocrmModules()
        const testAccounts = new TestAmocrmAccounts()
        return new TestAmocrmNodes(testModules, testAccounts)
    }
}