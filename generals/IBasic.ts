import {IMain} from "../crm_systems/main/interfaces/MainInterface";

const chai = require('chai')
import {Generals} from "./Interfaces";
import ILogWriter = Generals.ILogWriter;
import {LogJson} from "./LogWriter";
import {IServer} from "../server/intrfaces";

export namespace IBasic {
    import IModule = IMain.IModule;
    import IInputQuery = IServer.IInputQuery;
    import IInputRequest = IServer.IInputRequest;

    export interface IFullRequest {
        readonly basePath: string
        readonly query: {
            readonly client_module_code: string
            readonly account_referer?: string
            readonly data?: any
            readonly filter?: any
        }
    }

    export interface IError {
        readonly error: true
        readonly message: string
        readonly code: number
        readonly data: any
        toString(): string
    }

    export interface IHandler {
        readonly actualMethod: string
        readonly query: any
        readonly logWriter: ILogWriter
    }

    export class Error implements IError{
        readonly error: true = true
        readonly message: string
        readonly code: number
        readonly data: any

        constructor(message: string, code: number, data: any = {}) {
            this.message = message
            this.code = code
            this.data = Error.dataFormatting(data)
        }

        private static dataFormatting(data: any): any {
            if(typeof data !== 'object') return data
            try {
                return JSON.parse(JSON.stringify(data))
            } catch (e) {
                return {}
            }
        }

        toString(): string {
            return JSON.stringify({message: this.message, code: this.code, data: this.data})
        }
    }

    export class Errors{
        static readonly notFoundCode:number = 1044
        static readonly serverErrorCode:number = 1000
        static readonly internalErrorCode:number = 1011
        static readonly invalidRequestCode:number = 1001
        static readonly externalCrmDisabledCode:number = 1500
        static readonly unknownHttpMethodCode:number = 1501
        static readonly crmAuthorizationCode:number = 1502
        static readonly duplicateErrorCode:number = 1503
        static readonly invalidEmailCode:number = 1504
        static readonly invalidPhoneCode:number = 1505
        static readonly invalidCode:number = 1506
        static readonly invalidRestAnswerCode:number = 1506
        static createError(message: string, code: number): IError {
            return new Error(message, code)
        }
        static get externalCrmDisabled(): IError {
            return new Error('External crm disabled', this.externalCrmDisabledCode)
        }
        static unknownHttpMethod(method: string = ''): IError {
            return new Error('Unknown http method "' + method + "'", Errors.unknownHttpMethodCode)
        }
        static crmAuthorization(data: any): IError {
            return new Error('Authorization error', Errors.crmAuthorizationCode, data)
        }
        static internalError(error: any = 'Internal Error'): IError {
            const data = Errors.formattingError(error)
            const message = typeof error === 'string' ? error : 'Internal Error'
            return new Error(message, Errors.internalErrorCode, data)
        }
        static invalidRequestMethod(actualMethod: string): IError {
            return Errors.invalidRequest('Invalid request method "' + actualMethod + '"')
        }
        static invalidRequest(message: string): IError {
            return new Error(message, Errors.invalidRequestCode)
        }
        static duplicateError(message: string = 'Duplicate Error'): IError {
            return new Error(message, Errors.duplicateErrorCode)
        }
        static invalidEmail(): IError {
            return new Error('Invalid email', Errors.invalidEmailCode)
        }
        static invalidPhone(): IError {
            return new Error('Invalid phone', Errors.invalidPhoneCode)
        }
        static invalid(field: string): IError {
            return new Error('Invalid phone "' + field + '"', Errors.invalidCode)
        }
        static innerError(message: string, error: any): IError {
            const data = Errors.formattingError(error)
            return new Error(message, Errors.internalErrorCode, data)
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
    }

    export function testError (error: any, expectedCode: number, message: string = null): void {
        if(typeof error === 'string')
            error = JSON.parse(error)
        chai.assert(error.error === true)
        chai.assert(error.code === expectedCode)
        chai.assert(!!error.toString())
        message && chai.assert(error.message === message)
    }

    export class Query implements IInputQuery {
        readonly client_module_code: string
        readonly account_referer: string|null
        readonly data: any

        constructor(query: IInputQuery) {
            this.client_module_code = query.client_module_code
            this.account_referer = query.account_referer || null
            this.data = query.data || {}
        }

    }

    export function asEmail(email: any): string {
        email = ('' + email)
        validEmailExcept(email)
        email = email.trim().toLowerCase()
        return email
    }

    export function isValidEmail(email: any): boolean {
        try {
            validEmailExcept(email)
        } catch (e) {
            return false
        }
        return true
    }

    export function validEmailExcept(email: any): void {
        email = ('' + email)
        if(!email || typeof email !== 'string')
            throw Errors.invalidEmail()
        const invalidFlag = !email.match(/.*?@.*?\..*?/g) || !!email.trim().match(/\s+/g)
        if(invalidFlag)
            throw Errors.invalidEmail()
        if(email.length > 256)
            throw new Error('Exceeded the maximum size 256 characters', Errors.invalidEmailCode)
    }

    export function asPhone(phone: any): string {
        validPhoneExcept(phone)
        return phone.trim()
    }

    export function validPhoneExcept(phone: any): void {
        phone = ('' + phone).trim()
        if(!phone || !!phone.match(/\D+/g))
            throw Errors.invalidPhone()
        if(phone.length > 18)
            throw new Error('Exceeded the maximum size 18 characters', Errors.invalidPhoneCode)
        if(phone.length < 4)
            throw new Error('Minimum phone size 4 characters', Errors.invalidPhoneCode)
    }

    export function isValidPhone(phone: any): boolean {
        if(!phone) return false
        phone = ('' + phone).trim()
        if(!phone || !!phone.match(/\D+/g))
            return false
        if(phone.length > 18)
            return false
        if(phone.length < 4)
            return false
        return true
    }

    export function asLowerVarchar(str: string, length: number): string {
        return asVarchar(str, length).toLowerCase()
    }

    export function asUpperVarchar(str: string, length: number): string {
        return asVarchar(str, length).toUpperCase()
    }

    export function asVarchar(str: string, length: number): string {
        if(typeof str !== 'string')
            str = ''
        return str.trim().slice(0, length).trim()
    }

    export function randomString(length: number): string {
        let result = ''
        do {
            result += Math.random().toString(36).substring(2)
            result = result.substring(0, length)
        }while (result.length < length)
        return result
    }
}