import { parentPort } from 'worker_threads'
import {AmocrmWorker} from "./AmocrmWorker";


parentPort.on('message', AmocrmWorker.self.handler)

console.log('Amocrm worker running')