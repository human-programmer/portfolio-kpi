import {Bitrix24} from "../../interface/Bitrix24Interfaces";
import IRestApiGateway = Bitrix24.IRestApiGateway;
import IRequest = Bitrix24.IRequest;
import IRestApiStack = Bitrix24.IRestApiStack;
import {Bitrix24HttpsClient} from "../../Bitrix24HttpsClient";
import IAccountModule = Bitrix24.IAccountModule;
import IBatch = Bitrix24.IBatch;
import {IBasic} from "../../../../generals/IBasic";
import IError = IBasic.IError;
import {isValidBitrix24RestApiMethod} from "./MethodValidator";
import Error = IBasic.Error;
import Errors = IBasic.Errors;

const BATCH_SIZE = 50
const REQUEST_TIMEOUT = 500

export class Bitrix24ApiRequest implements IRequest{
    private static _maxId = 0
    readonly bitrix24Method: string;
    readonly id: number;
    private readonly _queryBody: any;
    private _executeHandlers: Array<any>
    private readonly path: string

    constructor(restApiPath: string, bitrix24Method: string, queryBody: any) {
        if(!(queryBody instanceof Object))
            queryBody = {}
        this.path = restApiPath
        this.id = Bitrix24ApiRequest.uniqueId
        this.bitrix24Method = bitrix24Method
        this._queryBody = queryBody
        this._executeHandlers = []
    }

    static get uniqueId(): number {
        return ++Bitrix24ApiRequest._maxId
    }

    executedTrigger(result: any): void {
        this._executeHandlers.forEach(handler => handler(result))
    }

    errorTrigger(error: IError): void {
        this._executeHandlers.forEach(handler => handler({body: error, info: {}}))
    }

    private executeEvent(handler: any): void {
        if(typeof handler === 'function' && !this._executeHandlers.find(i => i === handler))
            this._executeHandlers.push(handler)
    }

    async executed(): Promise<any> {
        return new Promise(resolve => this.executeEvent(resolve))
    }

    get isBatch(): boolean {
        return this.bitrix24Method === 'batch'
    }

    get queryBody(): any {
        return this._queryBody;
    }

    get bitrix24FullMethod(): string {
        return this.path + this.bitrix24Method
    }
}

export class Batch extends Bitrix24ApiRequest implements IBatch {
    readonly bitrix24Method: string;
    readonly id: number;
    readonly requests: Array<Bitrix24.IRequest>;

    constructor(apiPath: string, requests: Array<IRequest>) {
        super(apiPath, 'batch', {})
        this.requests = Array.isArray(requests) ? requests : []
    }

    get isBatch(): boolean {
        return true
    }

    executedTrigger(result: any): void {
        const res = Batch.formattingBatchResult(result)
        this.requests.forEach(request => request.executedTrigger(Batch.getRequestResult(request, res)))
        super.executedTrigger(res)
    }

    errorTrigger(error: IError): void {
        this.requests.forEach(request => request.errorTrigger(error))
        super.errorTrigger(error)
    }

    private static formattingBatchResult(result: any): any {
        result = result instanceof Object ? result : {}
        result.info = result.info instanceof Object ? result.info : {}
        result.body = result.body instanceof Object ? result.body : {}

        const answer = {
            body: {
                result: {},
                result_next: {},
                result_total: {},
                result_time: {},
                result_error: {}
            },
            info: {}
        }

        answer.info = result.info

        answer.body.result = result.body.result instanceof Object ? result.body.result : {}
        answer.body.result_next = result.body.result_next instanceof Object ? result.body.result_next : {}
        answer.body.result_total = result.body.result_total instanceof Object ? result.body.result_total : {}
        answer.body.result_time = result.body.result_time instanceof Object ? result.body.result_time : {}
        answer.body.result_error = result.body.result_error instanceof Object ? result.body.result_error : {}

        return answer
    }

    private static getRequestResult(request: IRequest, batchResult: any): any {
        if(batchResult.body.result_error && request.id in batchResult.body.result_error)
            return batchResult.body.result_error[request.id]

        return {
            body: {
                result: batchResult.body.result[request.id] || undefined,
                next: batchResult.body.result_next[request.id] || undefined,
                total: batchResult.body.result_total[request.id] || undefined,
                time: batchResult.body.result_time[request.id] || undefined,
            },
            info: batchResult.info
        }
    }

    get queryBody(): any {
        const cmd = {}
        this.requests.forEach(request => cmd[request.id] = request.bitrix24FullMethod)
        return {halt: 0, cmd}
    }
}

export class RestApiStack implements IRestApiStack {
    private readonly node: IAccountModule
    readonly bitrix24RequestsStack: Array<Bitrix24.IRequest>
    readonly bitrix24BatchStack: Array<Bitrix24.IRequest>

    constructor(node: IAccountModule) {
        this.node = node
        this.bitrix24RequestsStack = []
        this.bitrix24BatchStack = []
    }

    nextRequest(): Bitrix24.IRequest|null {
        if(this.bitrix24BatchStack.length)
            return this.bitrix24BatchStack.shift()

        const requests = this.bitrix24RequestsStack.splice(0, BATCH_SIZE)
        return requests.length ? this.node.createBitrix24RestApiBatch(requests) : null
    }

    push(request: Bitrix24.IRequest): void {
        request.isBatch ? this.bitrix24BatchStack.push(request) : this.bitrix24RequestsStack.push(request)
    }

    get size(): number {
        return this.bitrix24RequestsStack.length + this.bitrix24BatchStack.length
    }
}

export class Bitrix24RestApiGateway extends Bitrix24HttpsClient implements IRestApiGateway {
    protected readonly node: IAccountModule
    private readonly bitrix24Stack: IRestApiStack
    private bitrix24RunFlag: boolean = false
    protected static requestTimeout: number = REQUEST_TIMEOUT

    constructor(node: IAccountModule) {
        super(node)
        this.node = node
        this.bitrix24Stack = new RestApiStack(node)
    }

    async execute(request: Bitrix24.IRequest): Promise<any|IError> {
        const error = Bitrix24RestApiGateway.validMethod(request)
        if(error) return error

        this.bitrix24Stack.push(request)
        this.bitrix24Run()
        return request.executed()
    }

    private static validMethod(request: IRequest): IError|null {
        if(!isValidBitrix24RestApiMethod(request.bitrix24Method))
            return new Error('Invalid bitrix24 rest api method "' + request.bitrix24Method + '"', 1043)
        return null
    }

    private async bitrix24Run(): Promise<void> {
        if(this.bitrix24RunFlag) return;

        this.bitrix24RunFlag = true
        do {
            const request = this.bitrix24Stack.nextRequest()
            this.bitrix24RunFlag = !!request
            this.bitrix24RunFlag && await this.queryRequest(request)
        } while (this.bitrix24RunFlag)
    }

    private async queryRequest (request: IRequest): Promise<void> {
        try {
            const answer = await this.query(request)
            request.executedTrigger(answer)
        } catch (e) {
            const message = typeof e === 'string' ? e : e.message
            const error = new Error(message, Errors.serverErrorCode, e)
            request.errorTrigger(error)
        }
    }

    private async query(request: IRequest): Promise<any> {
        if(request.isBatch)
            return this.bitrix24Batch(request.bitrix24Method, request.queryBody)
        return this.bitrix24Query(request.bitrix24Method, request.queryBody)
    }

    private static delay(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 500))
    }
}