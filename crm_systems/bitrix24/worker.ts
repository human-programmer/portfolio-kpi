import { parentPort } from 'worker_threads'
import {Bitrix24Router} from "./path_handlers/Router";


parentPort.on('message', async request => {
    console.log('Income message')
    const answer = await Bitrix24Router.route(request)
    parentPort.postMessage(answer)
})

console.log('Bitrix24 worker running')