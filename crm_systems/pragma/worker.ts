import { parentPort } from 'worker_threads'
import {PragmaWorker} from "./PragmaWorker";

parentPort.on('message', PragmaWorker.self.handler)

console.log('Pragma worker running')