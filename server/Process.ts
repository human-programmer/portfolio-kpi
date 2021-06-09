import {Configs} from "../generals/Configs";

const fs = require('fs')

export class Process {
    private static process_name: string
    static setProcessName(name: string): void {
        Process.process_name = name
    }

    static reset(): void {
        const oldPid = Process.getOldPid()
        try{
            oldPid && process.kill(oldPid)
        }catch (e) {

        } finally {
            Process.saveCurrentPID()
        }
    }

    private static getOldPid(): number|null {
        const content = Process.getContent()
        return content.servicesPID || null
    }
    private static getContent = (): any => {
        const content = Process.getFileContent()
        return content[Process.process_name] || {}
    }
    private static getFileContent = (): any => {
        const str = Process.readFile()
        if(!str) return {}
        return JSON.parse(str)
    }

    private static readFile(): string {
        try {
            return fs.readFileSync(Process.file, 'utf8')
        } catch (e) {
            return ''
        }
    }

    private static saveCurrentPID(): void {
        Process.saveToFile(process.pid)
    }

    private static async saveToFile(PID: number|null): Promise<void> {
        const oldContent = Process.getContent()
        oldContent.servicesPID = PID
        oldContent.dateCreate = Array.isArray(oldContent.dateCreate) ? oldContent.dateCreate : []
        Configs.isMainThread && oldContent.dateCreate.push(Process.timeStamp)
        Process.writeToFile(oldContent)
    }

    private static writeToFile(content: any): void {
        const old = Process.getFileContent()
        if(Configs.isDev)
            old.dev_services = content
        else
            old.services = content
        const str = JSON.stringify(old)
        fs.writeFileSync(Process.file, str)
    }

    private static get timeStamp(): string {
        const date = new Date();
        return `${date.getFullYear()}.${date.getMonth()}.${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`
    }

    private static get file(): string {
        return __dirname + '/../../process.json'
    }
}