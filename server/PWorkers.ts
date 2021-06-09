
const execSync = require('child_process').execSync

import { Worker } from 'worker_threads'
import {Generals} from "../generals/Interfaces";
import ILogWriter = Generals.ILogWriter;
import {LogJson} from "../generals/LogWriter";
import {IServer} from "./intrfaces";
import {Configs} from "../generals/Configs";
import {AmocrmWorker} from "../crm_systems/amocrm/AmocrmWorker";//не удалять, каждый воркер должен скомпилироваться
import {PragmaWorker} from "../crm_systems/pragma/PragmaWorker";//не удалять, каждый воркер должен скомпилироваться
import {AmoWorkersWorker} from "../workers/amocrm/AmoWorkersWorker";

export namespace PWorkers {
    import IResult = IServer.IResult;
    import IInputRequest = IServer.IInputRequest;
    import IWorkerMessage = IServer.IWorkerMessage;
    import TypeWorkerMessage = IServer.TypeWorkerMessage;

    export class IncomingRequest implements IWorkerMessage{
        private static lastId: number = 1
        private requestCallback: any
        readonly requestId
        readonly body: IInputRequest
        readonly type: TypeWorkerMessage = TypeWorkerMessage.api

        constructor(request: any) {
            this.requestId = IncomingRequest.getNeUniqueId()
            this.body = request
        }

        executeTrigger(answer: any): void {
            typeof this.requestCallback === 'function' && this.requestCallback(answer.body)
            this.requestCallback = null
        }

        async execute(): Promise<IResult> {
            return new Promise(resolve => this.requestCallback = resolve)
        }

        private static getNeUniqueId(): number {
            return this.lastId++
        }
    }

    export class RequestWorker {
        protected readonly workerPath: string
        private readonly logWriter: ILogWriter
        private worker: Worker
        protected requests: Array<IncomingRequest> = []

        constructor(path: string, worker_name: string) {
            this.workerPath = path
            this.logWriter = new LogJson('.Workers', worker_name)
            this.createNewWorker()
        }

        private createNewWorker(): void {
            this.worker = new Worker(this.workerPath)
            this.worker.on('message', this.workerMessageHandler)
            this.worker.on('error', this.workerErrorHandler)
            this.sendConfigs()
        }

        private sendConfigs(): void {
            const message: IWorkerMessage = {
                requestId: 0,
                type: TypeWorkerMessage.configs,
                body: Configs.configsModel
            }
            this.send(message)
        }

        private workerMessageHandler = (answer): any => {
            const requestId = answer.requestId
            const targetRequest = this.requests.find(request => request.requestId === requestId)
            targetRequest.executeTrigger(answer)
            this.deleteRequest(targetRequest)
        }

        private deleteRequest = (request: IncomingRequest): void => {
            const index = this.requests.indexOf(request)
            this.requests.splice(index, 1)
        }

        private workerErrorHandler = (error): void => {
            console.log(error)
            this.logWriter.sendError(error, 'Worker fatal error')
            this.createNewWorker()
        }

        async executeRequest (request: any): Promise<IResult> {
            const incomingRequest = new IncomingRequest(request)
            this.requests.push(incomingRequest)
            this.send(incomingRequest)
            return incomingRequest.execute()
        }

        private send(message: any): void {
            this.worker.postMessage(message)
        }
    }

    export class PragmaWorkers {
        private static _bitrix24RequestWorker: RequestWorker
        private static _amocrmRequestWorker: RequestWorker
        private static _amocrmWorkersWorker: RequestWorker
        private static _pragmaCrmWorker: RequestWorker

        static get bitrix24RequestWorker(): RequestWorker {
            if(PragmaWorkers._bitrix24RequestWorker)
                return PragmaWorkers._bitrix24RequestWorker

            const path = __dirname + '/../crm_systems/bitrix24/worker.js'
            PragmaWorkers._bitrix24RequestWorker = new RequestWorker(path, 'bitrix24_request_worker')

            return PragmaWorkers._bitrix24RequestWorker
        }

        static get amocrmRequestWorker(): RequestWorker {
            if(PragmaWorkers._amocrmRequestWorker)
                return PragmaWorkers._amocrmRequestWorker

            const path = __dirname + '/../crm_systems/amocrm/worker.js'
            PragmaWorkers._amocrmRequestWorker = new RequestWorker(path, 'amocrm_request_worker')

            return PragmaWorkers._amocrmRequestWorker
        }

        static get amocrmWorkersWorker(): RequestWorker {
            if(PragmaWorkers._amocrmWorkersWorker)
                return PragmaWorkers._amocrmWorkersWorker

            const path = __dirname + '/../workers/amocrm/worker.js'
            PragmaWorkers._amocrmWorkersWorker = new RequestWorker(path, 'amocrm_workers_worker')

            return PragmaWorkers._amocrmWorkersWorker
        }

        static get pragmaCrmWorker(): RequestWorker {
            if(PragmaWorkers._pragmaCrmWorker)
                return PragmaWorkers._pragmaCrmWorker

            const path = __dirname + '/../crm_systems/pragma/worker.js'
            PragmaWorkers._pragmaCrmWorker = new RequestWorker(path, 'pragma_crm_worker')

            return PragmaWorkers._pragmaCrmWorker
        }
    }
}

const tsc = 'node ' +  __dirname + '/../node_modules/typescript/bin/tsc'

function compileBitrix24Worker(): void {
    const bitrix24WorkerPath = __dirname + '/../crm_systems/bitrix24/path_handlers/Router.ts'
    execSync('tsc -sourcemap --module es6 --target esnext ' + bitrix24WorkerPath)
    console.log('bitrix24 worker compiled')
}

function compileAmocrmWorker(): void {
    const amocrmWorkerPath = __dirname + '/../crm_systems/amocrm/AmocrmWorker.ts'
    execSync('tsc --module es6 --target esnext ' + amocrmWorkerPath)
    console.log('amocrm worker compiled')
}

function compilePragmaWorker(): void {
    const pragmaWorkerPath = __dirname + '/../crm_systems/pragma/PragmaWorker.ts'
    execSync('tsc --module es6 --target esnext ' + pragmaWorkerPath)
    console.log('pragma worker compiled')
}