import {IMain} from "./interfaces/MainInterface";
import IHttpsClient = IMain.IHttpsClient;
import {IBasic} from "../../generals/IBasic";
import Error = IBasic.Error;
import Errors = IBasic.Errors;

const REQUEST = require('request')
const httpBuildQuery = require('http-build-query')


class RequestExecutor {
    static async execute(options: any): Promise<any> {
        let repeatCounter = 5
        try {
            return await RequestExecutor._execute(options)
        } catch ({error, info, body, options}) {
            return await RequestExecutor.ifToRepeat({error, info, body, options, repeatCounter})
        }
    }

    private static async ifToRepeat({error, info, body, options, repeatCounter}): Promise<any> {
        --repeatCounter
        const availableToRepeat = RequestExecutor.availableRepeat({error, options, repeatCounter})
        console.log('repeatCounterRequest:', repeatCounter, 'availableToRepeat:', availableToRepeat)
        if(availableToRepeat)
            return await RequestExecutor._execute(options)
        return {error, info, body, options}
    }

    private static availableRepeat ({options, error, repeatCounter}): boolean {
        if(!error) return false
        error = typeof error === 'object' ? error : {error}
        const availableRequest = error.address === '127.0.0.1' || error.address === 'localhost' || HttpsClient.isGet(options)
        const availableError = error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED'
        return (availableRequest || availableError) && repeatCounter > 0
    }

    private static async _execute(options: any): Promise<any> {
        return new Promise((resolve, reject) => {
            REQUEST(options, (error, info, body) => {
                info = info instanceof Object ? info : {}
                if(error) return reject({error, info, body, options})
                return resolve({error, info, body, options})
            })
        })
    }
}


export class HttpsClient implements IHttpsClient{
    protected constructor() {}

    async request (options: any): Promise<any> {
        return HttpsClient.executeRequest(options)
    }

    static async executeRequest (sendOptions: any): Promise<any> {
        sendOptions = sendOptions instanceof Object ? sendOptions : {}
        HttpsClient.formattingOptions(sendOptions)
        // console.log('send request <-----------------------------------')
        const {error, info, body, options} = await RequestExecutor.execute(sendOptions)
        // console.log('-------------------------------------->request answer', !!error)

        const fInfo = HttpsClient.filterInfo(info)
        HttpsClient.validAnswer({error, info, body, options})
        return {body, info: fInfo}
    }

    private static formattingOptions(options: any): void {
        options.json = true
        HttpsClient.buildGetQuery(options)
        HttpsClient.addTimeout(options)
    }

    private static buildGetQuery(options: any): void {
        if(HttpsClient.isGet(options))
            options.uri += '?' + httpBuildQuery(options.body)
    }

    private static addTimeout(options: any): any {
        options.timeout === HttpsClient.isGet(options) ? 3000 : 9000
    }

    static isGet(options: any): boolean {
        return options.method.toUpperCase() === 'GET'
    }

    private static validAnswer({error, info, body, options}): void {
        if(!error && info.statusCode < 400)
            return;
        error = HttpsClient.formattingError(error)
        options = Object.assign(options)
        if("Authorization" in options.headers)
            options.headers['Authorization'] = 'deleted'
        throw new Error('Invalid REST answer', Errors.invalidRestAnswerCode, {error, info, body, options})

    }

    private static formattingError(error): any {
        error = error || {}
        error = typeof error === 'object' ? error : {}
        const keys = Object.keys(error)
        const result: any = {}
        keys.forEach(key => result[key] = error[key])
        result.message = error.message
        return result
    }


    protected static filterInfo(info: any): any {
        return {
            statusCode: info.statusCode,
            statusMessage: info.statusMessage,
        }
    }
}