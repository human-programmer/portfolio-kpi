import {Generals} from "./Interfaces";
import ILogWriter = Generals.ILogWriter;

const fs = require('fs')

export class LogJson implements ILogWriter {
    protected log: Object = {}
    protected readonly prefix: string
    protected containerName: string = ''
    readonly dir: string

    static create(node: any = {}): ILogWriter {
        node = typeof node === 'object' ? node : {}
        const referer = node.referer || 'undefined.referer'
        const module_code = node.referer || 'undefined.module_code'
        const prefix = 'STATIC_ERROR'
        return new LogJson(referer, module_code, prefix)
    }

    constructor(referer: string, module_code: string, prefix: string = '') {
        this.prefix = prefix
        this.dir = LogJson.targetDir + FileHandler.separator + 'logs' + FileHandler.separator + referer + FileHandler.separator + module_code + FileHandler.separator
    }

    private static get targetDir(): string {
        const {start_dir, dirs} = FileHandler.formatting(__dirname)
        const arr = dirs.filter(i => i)
        return start_dir + arr.splice(0, arr.length - 2).join(FileHandler.separator)
    }

    get fullFileName(): string {
        return this.dir + this.fileName
    }

    get fileName(): string {
        return (this.prefix ? this.prefix + '_' + LogJson.date : LogJson.date) + '.json'
    }

    add = (message: string, params?: any) => {
        this.log[`[${LogJson.timeStamp}] - ${message}`] = params
    }

    private static get timeStamp(): string {
        const date = new Date();
        return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`
    }

    private static get date() {
        const date = new Date();
        return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`
    }

    async sendError(exception: any, message: string = null): Promise<void> {
        try {
            this.add(message, exception)
            await this.save()
        } catch (e) {

        }
    }

    async save(): Promise<void>{
        const contentToSave = await this.initSave()
        await FileHandler.saveToFile(this.fullFileName, contentToSave)
        this.log = {}
    }

    private async initSave(): Promise<any> {
        const result = await Promise.all([
            this.contentToSave(),
            FileHandler.mkdir(this.dir),
        ])
        return result[0]
    }

    protected async contentToSave(): Promise<string> {
        const target: Object = await this.getOldContent()
        const log_container = {[this.fullContainerName]: this.log}
        Object.assign(target, log_container)
        return JSON.stringify(target)
    }

    protected async getOldContent() : Promise<any> {
        const str = await FileHandler.getFileContent(this.fullFileName)
        return LogJson.saveParse(str)
    }

    private static saveParse(str: any): any {
        try {
            str = typeof str === 'string' ? JSON.parse(str) : str
            return typeof str === 'object' ? str : {}
        } catch (e) {
            return str
        }
    }

    setContainer(container_name: string): void {
        this.containerName = container_name
    }

    private get fullContainerName() : string {
        return `[${LogJson.timeStamp}] ${this.containerName}`
    }
}

class FileHandler{
    static getFileContent = async (fileName: string): Promise<any> => {
        return new Promise<any>(async (res, rej) => {
            fs.readFile(fileName, 'utf8', (err, data) => err ? res('') : res(data))
        });
    }

    static issetFile = (fileName: string): Promise<any> => {
        return new Promise<any>((req) => {
            fs.access(fileName, error => req(!error))
        });
    }

    static async saveToFile(fileName: string, content: string): Promise<void> {
        if(!content) return;
        await new Promise((resolve, reject) => fs.writeFile(fileName, content, err => {
            err ? reject(err) : resolve(null)
        }))
    }

    static async mkdir(dirName: string): Promise<any> {
        let {start_dir, dirs} = FileHandler.formatting(dirName)
        const separator = FileHandler.separator
        do {
            start_dir = start_dir + separator + dirs.shift()
            await FileHandler.createDir(start_dir)
        } while (dirs.length)
    }

    static formatting(dirName: string): any {
        const separator = FileHandler.separator
        dirName = typeof dirName === 'string' ? dirName : (separator + 'default_services_logs')
        if(FileHandler.isWin32) {
            const regExpr = /^[CDE]:\\/
            const res = dirName.match(regExpr)
            let start_dir = res ? res[0] || '' : ''
            dirName = dirName.replace(start_dir, '')
            let dirs = dirName.split(separator).filter(i => i)
            return  {start_dir, dirs}
        }
        let dirs = dirName.split(separator).filter(i => i)
        return  {start_dir: '/', dirs}
    }

    static get separator(): string {
        return FileHandler.isWin32 ? '\\' : '/'
    }

    private static get isWin32(): boolean {
        return process.platform === 'win32'
    }

    static async createDir(dirName: string): Promise<void> {
        await new Promise(resolve => fs.mkdir(dirName, err => {
            resolve(err)
        }))
    }
}