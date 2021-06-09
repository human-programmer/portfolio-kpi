import {HttpsClient} from "../main/HttpsClient";
import {Bitrix24} from "./interface/Bitrix24Interfaces";
import IOAuthData = Bitrix24.IOAuthData;
import InstallData = Bitrix24.InstallData;
import {IBasic} from "../../generals/IBasic";
import Error = IBasic.Error;
import IError = IBasic.IError;
import IAccountModule = Bitrix24.IAccountModule;
import IHttpsClient = Bitrix24.IHttpsClient;
import {IMain} from "../main/interfaces/MainInterface";
import IRequestOptions = IMain.IRequestOptions;
import Errors = IBasic.Errors;

export class RefreshData implements InstallData{
    readonly accessToken: string
    readonly refreshToken: string
    readonly shutdownTimeSec: number

    constructor(answer: any) {
        this.accessToken = answer.access_token
        this.refreshToken = answer.refresh_token
        this.shutdownTimeSec = answer.expires
    }

    static validAnswer(answer: any): boolean {
        return answer instanceof Object &&
            answer.access_token &&
            answer.refresh_token &&
            answer.expires
    }
}

export class Bitrix24HttpsClient extends HttpsClient implements IHttpsClient {
    protected readonly node: IAccountModule

    constructor(node: IAccountModule) {
        super();
        this.node = node
    }

    async oauthToken(queryParams: IOAuthData): Promise<InstallData|IError> {
        const options = Bitrix24HttpsClient.getOAuthOptions(queryParams)
        const answer = await this.request(options)
        const body = Bitrix24HttpsClient.safeParsing(answer.body)
        if(RefreshData.validAnswer(body))
            return new RefreshData(body)
        return Errors.crmAuthorization(answer)
    }

    private static safeParsing(content: any|string): any {
        try {
            return typeof content === 'string' ? JSON.parse(content) : content
        } catch (e) {
            return content
        }
    }

    private static getOAuthOptions(queryParams: IOAuthData): any {
        return {
            method: "GET",
            uri: 'https://oauth.bitrix.info/oauth/token?' + queryParams.toString()
        }
    }

    async bitrix24Query(bitrix24Method: string, params: any): Promise<any> {
        return this.bitrix24Request(bitrix24Method, 'GET', params)
    }

    async bitrix24Batch(bitrix24Method: string, params: any): Promise<any> {
        return this.bitrix24Request(bitrix24Method, 'POST', params)
    }

    private async bitrix24Request(bitrix24Method: string, method: string, params: any): Promise<any> {
        params = (params instanceof Object) ? params : {}
        await this.node.bitrix24Refresh()
        params.auth = this.node.bitrix24AccessToken

        const options: IRequestOptions = {
            uri: this.bitrix24Path + bitrix24Method,
            body: params,
            method,
        }

        const answer = await this.request(options)
        this.validQueryAnswer(answer)
        return answer
    }

    private validQueryAnswer(answer: any): void {

    }

    get bitrix24Path(): string {
        return `https://${this.node.account.bitrix24Referer}/rest/`
    }
}