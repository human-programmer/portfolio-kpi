import { parentPort } from 'worker_threads'
import {AmoWorkersWorker} from "./AmoWorkersWorker";


parentPort.on('message', AmoWorkersWorker.self.handler)

console.log('Amocrm worker workers running')