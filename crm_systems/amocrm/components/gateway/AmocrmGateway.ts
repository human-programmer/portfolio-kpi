import {Amocrm} from "../../interface/AmocrmInterfaces";
import IGateway = Amocrm.IGateway;
import {Generals} from "../../../../generals/Interfaces";
import ILogWriter = Generals.ILogWriter;
import {HttpsClient} from "../../../main/HttpsClient";
import {IMain} from "../../../main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;



export class AmocrmRequest {
    readonly priority: number
    private resolveHandler: any
    private rejectHandler: any
    readonly options: IRequestOptions
    readonly logWriter: ILogWriter

    constructor(request: IRequestOptions, logWriter: ILogWriter) {
        this.options = request
        this.priority = Number.parseInt('' + request.priority) || 5
        this.logWriter = logWriter
    }

    resolveTrigger(result: any): void {
        this.resolveHandler && this.resolveHandler(result)
    }

    rejectTrigger(result: any): void {
        setTimeout(() => {
            this.logWriter.sendError(result, "Amocrm request error")
        })
        this.rejectHandler(result)
    }

    async executed(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.resolveHandler = resolve
            this.rejectHandler = reject
        })
    }
}

export class AmocrmRequestStack {
    private logWriter: ILogWriter
    protected stack: Array<AmocrmRequest> = []
    private gateways: Array<number> = []
    private nextResolveFunc: any
    private recursiveHandlerFunc: any

    constructor(logWriter: ILogWriter, size = 6) {
        this.logWriter = logWriter
        this.gatewaysInit(size)
    }

    private gatewaysInit(size: number): void {
        const time = new Date().getTime() - 2000
        for(let i = 0; i < size; ++i)
            this.gateways.push(time)
    }

    get size(): number {
        return this.stack.length
    }

    async next(): Promise<AmocrmRequest> {
        const promise: Promise<AmocrmRequest> = new Promise(resolve => this.nextResolveFunc = resolve)
        this.run()
        return promise
    }

    add(request: AmocrmRequest): void {
        const index = this.getIndexToInsert(request.priority)
        this.stack.splice(index, 0, request)
        this.run()
    }

    private getIndexToInsert(priority: number): number {
        let i = this.stack.find((i, index, stack) => i.priority == priority && (!index || stack[index - 1].priority < priority))
        i = i || this.stack.find(i => i.priority > priority)
        return i ? this.stack.indexOf(i) : this.stack.length
    }

    private run(): void {
        if(this.size && !this.recursiveHandlerFunc && this.nextResolveFunc) {
            this.recursiveHandlerFunc = this.runRecursive
            this.runRecursive()
        }
    }

    private async runRecursive(): Promise<any> {
        await this.gatewaysHandler()
        this.recursiveHandlerFunc = null
        this.run()
    }

    private async gatewaysHandler(): Promise<void> {
        try {
            await this._gatewaysHandler()
        } catch (error) {
            this.logWriter.sendError('AmocrmRequestStack ERROR', error)
        }
    }

    private async _gatewaysHandler(): Promise<void> {
        this.gateways.forEach(this.gatewayHandler)
        return await this.timeoutHandler()
    }

    private timeoutHandler(): Promise<void> {
        const timeout = this.timeout
        if(timeout)
            return new Promise(resolve => setTimeout(resolve, timeout))
    }

    private gatewayHandler = (lastTime: number, index): void => {
        if(!this.size || !this.nextResolveFunc) return;

        const currentTime = new Date().getTime()
        if((currentTime - lastTime) > 1000) {
            this.nextResolveFunc(this.get)
            this.nextResolveFunc = null
            this.gateways[index] = currentTime
        }
    }

    private get get(): AmocrmRequest {
        return this.stack.pop()
    }

    private get timeout(): number {
        const timeout = this.minTime - (new Date().getTime() - 1000)
        return timeout > 0 ? timeout + 10 : 0
    }

    private get minTime(): number {
        let dateTime = this.gateways[0]
        this.gateways.forEach(time => {
            if(time < dateTime)
                dateTime = time
        })
        return dateTime
    }
}

export class AmocrmGateway extends HttpsClient implements IGateway {
    private readonly stack: AmocrmRequestStack

    constructor(logWriter: ILogWriter) {
        super()
        this.stack = new AmocrmRequestStack(logWriter)
        this.run()
    }

    private async run(): Promise<any> {
        while(true) {
            const amocrmQuery = await this.stack.next()
            this.amocrmRequest(amocrmQuery)
        }
    }

    private async amocrmRequest(amocrmRequest: AmocrmRequest): Promise<void> {
        try {
            await this._amocrmRequest(amocrmRequest)
        } catch (error) {
            amocrmRequest.rejectTrigger(error)
        }
    }

    private async _amocrmRequest(amocrmRequest: AmocrmRequest): Promise<any> {
        const answer = await this.request(amocrmRequest.options)
        amocrmRequest.resolveTrigger(answer)
    }

    async execute(requestOptions: IRequestOptions, logWriter: ILogWriter): Promise<any> {
        const amocrmRequest = new AmocrmRequest(requestOptions, logWriter)
        this.stack.add(amocrmRequest)
        return await amocrmRequest.executed()
    }
}