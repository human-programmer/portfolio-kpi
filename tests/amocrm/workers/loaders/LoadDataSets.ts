const fs = require('fs')

export class LoadDataSets {
    private static readonly dir: string = __dirname + '/data_sets/'
    static getFileContent = (fileName: string): any => {
        fileName = LoadDataSets.dir + fileName
        const content = fs.readFileSync(fileName, 'utf8')
        return JSON.parse(content)
    }

    static async saveToFile(fileName: string, content: string): Promise<void> {
        fileName = LoadDataSets.dir + fileName
        await new Promise((resolve, reject) => fs.writeFile(fileName, content, err => {
            err ? reject(err) : resolve(null)
        }))
    }
}