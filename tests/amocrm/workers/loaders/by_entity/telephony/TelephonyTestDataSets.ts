const fs = require('fs')

export class TelephonyTestDataSets {
    static get amocrmLeadsNotes(): Array<any> {
        return TelephonyTestDataSets.requestAnswer._embedded.notes
    }

    static get requestAnswer(): any {
        return {
            body: LoadDataSets.getFileContent('leadsNotesDataSets.json'),
            info: {statusCode: 200}
        }
    }
}

class LoadDataSets {
    private static readonly dir: string = __dirname + '/../data_sets/'
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