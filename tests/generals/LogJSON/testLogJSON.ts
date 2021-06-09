import {LogJson} from "../../../generals/LogWriter";

const chai = require('chai')
const fs = require('fs')

class TestLogJSON extends LogJson {

    get testPrefix(): string {
        return this.prefix
    }

    get testDir() : string {
        return this.dir
    }

    get testLog(): Object {
        return this.log
    }

    async contentToSave(): Promise<string> {
        return super.contentToSave()
    }

    async getOldContent() : Promise<any> {
        return super.getOldContent()
    }

    async getSavedContent(): Promise<any> {
        const content = await this.loadFileContent()
        return JSON.parse(content)
    }

    private async loadFileContent(): Promise<any> {
        return new Promise<any>(async (res, rej) => {
            fs.readFile(this.fullFileName, 'utf8', (err, data) => err ? rej(err) : res(data))
        })
    }
}

export async function testLogJSON(): Promise<void> {
    describe('LogJSON' , async () => {
        it('create', () => {
            const testReferer = 'testReferer0'
            const testModule = 'testModule0'
            const testPrefix = 'testPrefix'
            const testLog = new TestLogJSON(testReferer, testModule, testPrefix)
            chai.assert(testLog.testPrefix === testPrefix)
            const dirs = testLog.testDir.split(process.platform === 'win32' ? '\\' : '/').filter(i => i)
            chai.assert(dirs[dirs.length - 1] === testModule)
            chai.assert(dirs[dirs.length - 2] === testReferer)
        })

        it('add', () => {
            const testLog = new TestLogJSON('testReferer', 'testModule', 'testPrefix')
            testLog.add('qwerty', '4545564345345345')
            chai.assert(Object.keys(testLog.testLog).length === 1)
            testLog.add('wer', 'sdfsdf')
            chai.assert(Object.keys(testLog.testLog).length === 2)
            testLog.add('gfhfg', '56u56')
            chai.assert(Object.keys(testLog.testLog).length === 3)
        })

        it('save', async () => {
            const testLog = new TestLogJSON('testReferer', 'testModule', 'testPrefix')
            const param1 = '4545564345345345'
            const param2 = '45t5t45y45y45y'
            testLog.add('qwerty', param1)
            testLog.add('wer', param2)

            await testLog.save()
            chai.assert(Object.keys(testLog.testLog).length === 0)

            let savedContent = await testLog.getSavedContent()
            savedContent = Object.values(savedContent)
            const values = Object.values(savedContent[savedContent.length - 1])
            chai.assert(values.indexOf(param1) !== -1)
            chai.assert(values.indexOf(param2) !== -1)
        })

        it('sendError', async () => {
            const testLog = new TestLogJSON('testReferer', 'testModule', 'testPrefix')
            const param1 = '4545564345345345'
            const param2 = '45t5t45y45y45y'
            testLog.add('qwerty', param1)
            testLog.add('wer', param2)

            await testLog.sendError('any error', 'any error message')
            chai.assert(Object.keys(testLog.testLog).length === 0)

            let savedContent = await testLog.getSavedContent()
            savedContent = Object.values(savedContent)
            const values = Object.values(savedContent[savedContent.length - 1])
            chai.assert(values.indexOf(param1) !== -1)
            chai.assert(values.indexOf(param2) !== -1)
            chai.assert(values.indexOf('any error') !== -1)
        })
    })
}
