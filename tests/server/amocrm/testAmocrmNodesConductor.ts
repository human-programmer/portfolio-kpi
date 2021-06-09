import {PWorkers} from "../../../server/PWorkers";
import {AmocrmNodesConductor} from "../../../server/conductors/amocrm/AmocrmNodesConductor";
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {TestAmoServerFabric} from "./TestAmoServerFabric";

const chai = require('chai')
const chaiHttp = require('chai-http')
const app = require("./../../../server/app");

chai.use(chaiHttp)


// export async function testAmocrmNodesConductor(): Promise<void> {
//     describe('AmocrmNodesConductor', () => {
//         it('get', (done) => {
//             chai.assert(true)
//         })
//     })
// }
//
// class TestAmocrmNodesConductor extends AmocrmNodesConductor {
//     static async sendInstallEvent(node: IAmocrmNodeStruct): Promise<any> {
//         return await super.sendInstallEvent(node)
//     }
//
//     protected static get pragmaCrmWorker(): any {
//         return new WorkerPlugs()
//     }
//
//     protected static get amoWorkerWorker(): any {
//         return new WorkerPlugs()
//     }
//
//     protected static get amoQueueWorker(): any {
//         return new WorkerPlugs()
//     }
// }
//
// class WorkerPlugs {
//     async executeRequest(request): re
// }