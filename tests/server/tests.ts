import {testAmocrmNodesConductor} from "./amocrm/testAmocrmNodesConductor";
import {PWorkers} from "../../server/PWorkers";

import PragmaWorkers = PWorkers.PragmaWorkers;

PragmaWorkers.amocrmWorkersWorker
PragmaWorkers.amocrmRequestWorker
PragmaWorkers.pragmaCrmWorker

export async function testServer(): Promise<void> {
    await testAmocrmNodesConductor()
}