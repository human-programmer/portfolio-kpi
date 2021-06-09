import {IBasic} from "./IBasic";
import Errors = IBasic.Errors;


const fs = require('fs')
const ini = require('ini')


class DbConnect {
    private _user: string
    private _host: string
    private _password: string
    private _db_name: string

    constructor(model: any) {
        this._user = model.user
        this._host = model.host
        this._password = model.password
        this._db_name = model.db_name
    }

    get mysql2Params(): any {
        return {
            user: this.user,
            host: this.host,
            password: this.password,
        }
    }

    get user(): string {
        return this._user
    }

    get host(): string {
        return this._host
    }

    get password(): string {
        return this._password
    }

    get db_name(): string {
        return this._db_name
    }
}

class DbNames {
    private _model: any
    constructor(model: any) {
        DbNames.validModel(model)
        this._model = model
    }

    get telephony(): string {
        return this._model.telephony
    }

    get amocrm_interface(): string {
        return this._model.amocrm_interface
    }

    get bitrix24_interface(): string {
        return this._model.bitrix24_interface
    }

    get dashboard(): string {
        return this._model.dashboard
    }

    get calculator(): string {
        return this._model.calculator
    }

    get pragmacrm(): string {
        return this._model.pragmacrm
    }

    get modules(): string {
        return this._model.modules
    }

    get users(): string {
        return this._model.users
    }

    get metrics(): string {
        return this._model.metrics
    }

    private static validModel(model: any): void {
        if(typeof model !== "object")
            throw Errors.invalidRequest(`Invalid DB_NAMES model`)
        if(!model.amocrm_interface)
            throw DbNames.throwError('amocrm_interface')
        if(!model.bitrix24_interface)
            throw DbNames.throwError('bitrix24_interface')
        if(!model.dashboard)
            throw DbNames.throwError('dashboard')
        if(!model.calculator)
            throw DbNames.throwError('calculator')
        if(!model.pragmacrm)
            throw DbNames.throwError('pragmacrm')
        if(!model.modules)
            throw DbNames.throwError('modules')
        if(!model.users)
            throw DbNames.throwError('users')
    }

    private static throwError(fieldName: string): void {
        throw Errors.invalidRequest(`Invalid "${fieldName}" field in DB_NAMES model`)
    }
}

class ServerConfig {
    private _port
    private _host
    private _modules_port

    constructor(model) {
        this._port = model.port
        this._host = model.host
        this._modules_port = model.modules_port
    }

    get port(): string {
        return this._port
    }

    get host(): string {
        return this._host
    }

    get modules_port() {
        return this._modules_port;
    }
}


export class Configs {
    private static _isMainThread: boolean = true
    private static _config: any
    private static _dbConfig: DbConnect
    private static _dbNames: DbNames
    private static _server: ServerConfig

    static get isMainThread(): boolean {
        return Configs._isMainThread
    }

    static setIsMainThread(flag: boolean): void {
        Configs._isMainThread = flag
    }

    static get amocrmRedirectUri(): string {
        return Configs.serverUrl + '/api/lib/OAuth/core.php'
    }

    static get serverUrl(): string {
        return 'https://' + Configs.serverDomain
    }

    static get serverDomain(): string {
        return Configs.isDev ? 'smart-dev.pragma.by' : 'smart.pragma.by'
    }

    static get dbNames(): DbNames {
        Configs.checkLoad()
        return Configs._dbNames
    }

    static get dbConnect(): DbConnect {
        Configs.checkLoad()
        return Configs._dbConfig
    }

    static get server(): ServerConfig {
        Configs.checkLoad()
        return Configs._server
    }

    private static checkLoad(): void {
        if(Configs._dbConfig && Configs._server && Configs._dbNames) return;
        Configs.load()
    }

    private static load(): void {
        Configs._dbConfig = new DbConnect(Configs.configsModel.DB_CONNECT)
        Configs._dbNames = new DbNames(Configs.configsModel.DB_NAMES)
        Configs._server = new ServerConfig(Configs.configsModel.SERVICES_SERVER)
    }

    static setConfigsModel(config: any): void {
        Configs._config = config
    }

    static get configsModel(): any {
        if(Configs._config) return Configs._config
        Configs._config = Configs.params
        Configs.validModel(Configs._config)
        return Configs._config
    }

    protected static get params(): any {
        if(!Configs.isMainThread && !Configs._config)
            throw Errors.internalError('No configuration defined for the child process')

        if(Configs.isMainThread) {
            console.log('LOAD CONFIGS')
            const content = ini.parse(fs.readFileSync(Configs.fileName, 'utf-8'))
            console.log('CONFIGS LOADED')
            return content
        }
        return Configs._config
    }

    private static get fileName(): string {
        if(Configs.isDev)
            return Configs.dir + 'dev.ini'
        return Configs.dir + 'deploy.ini'
    }

    private static get dir(): string {
        if(Configs.isHosting)
            return '/var/www/pragma-biz/data/node_projects/configs/'
        return 'C:\\node_projects\\configs\\'
    }

    static get isDev(): boolean {
        return !Configs.isHosting || Configs.isDevPath(__dirname)
    }

    static isDevPath(path: string): boolean {
        if(Configs.isHosting)
            return !path.match(/\/services\/generals$/)
        return !path.match(/\\services\\generals$/)
    }

    static get isHosting(): boolean {
        return process.platform !== 'win32'
    }

    private static validModel(model: any): void {
        const flag = "DB_CONNECT" in model && "DB_NAMES" in model && "SERVICES_SERVER" in model
        if(!flag)
            throw Errors.invalidRequest("Invalid configs model")
    }
}