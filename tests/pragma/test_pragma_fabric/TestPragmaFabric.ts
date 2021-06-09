import {Pragma} from "../../../crm_systems/pragma/instarface/IPragma";
import IAccount = Pragma.IAccount;
import {TestPragmaAccounts} from "../accounts/TestPragmaAccounts";
import {IServer} from "../../../server/intrfaces";
import CrmName = IServer.CrmName;
import {Generals} from "../../../generals/Interfaces";
import IStatus = Generals.IStatus;
import {TestStatusesFabric} from "./statuses/TestStatusesFabric";
import {TestPipelinesFabric} from "./statuses/TestPipelinesFabric";
import {TestUsersFabric} from "./TestUsersFabric";
import {ITestEntity, TestEntitiesFabric} from "./TestEntitiesFabric";


export class TestPragmaFabric {
    static async uniqueAccount(crmName: CrmName = CrmName.amocrm): Promise<IAccount> {
        const fabric = new TestPragmaAccounts()
        return await fabric.createTestAccount(crmName)
    }

    static async uniqueStatuses(account_id: number, statusesQuantity: number = 50, pipelinesQuantity: number = 10): Promise<IStatus[]> {
        const entities = await Promise.all([
            TestStatusesFabric.createAndGetIds(statusesQuantity),
            TestPipelinesFabric.createAndGetIds(account_id, pipelinesQuantity),
        ])
        TestStatusesFabric.delayDeletion(entities[0])
        TestPipelinesFabric.delayDeletion(entities[1])
        return await TestPipelinesFabric.distributeStatuses(entities[1], entities[0])
    }

    static async uniqueUsersIds(account_id: number, quantity: number = 10): Promise<number[]> {
        const ids = await TestUsersFabric.createAndGetIds(account_id, quantity)
        TestUsersFabric.delayDeletion(ids)
        return ids
    }

    static async uniqueTestEntities(account_id: number, quantity: number = 10): Promise<ITestEntity[]> {
        const entities = await TestEntitiesFabric.createTestEntities(account_id, quantity)
        TestEntitiesFabric.delayDeletion(entities.map(i => i.id))
        return entities
    }
}