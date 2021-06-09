const mysql = require('mysql2')
import {Schemes} from "./Schemes";
import {Configs} from "../Configs";

let connection = null
let intervalId = null

function dataBaseConnection(){
    if(connection)
        return connection
    createNewConnection()
    setPeriodicRequest()
    return connection
}

function createNewConnection(): any {
    console.log('create db connect')
    const config = Configs.dbConnect
    connection = mysql.createConnection(config.mysql2Params)
    connection.connect(connectHandler)
    connection.on('error', errorHandler)
}

const connectHandler = (err): void => {
    if(err) throw err
    console.log('Database connection established')
}

const errorHandler = (error): void => {
    if(error.code === 'PROTOCOL_CONNECTION_LOST')
        return createNewConnection()
    throw error;
}

function setPeriodicRequest(): void {
    intervalId = intervalId || setInterval(() => CRMDB.query('SELECT 1'), 5000)
}

export class CRMDB extends Schemes{

    constructor() {
        super();
    }

    static query = async (sql: string, params: Array<string|number|boolean|Date> = []): Promise<Array<any>> => {
        return new Promise((res, rej) => {
            dataBaseConnection().query(sql, params, (error, results: Array<any>, fields) => {
                if(error)
                    rej(error)
                else
                    res(results)
            })
        })
    }

    static escape(data: any): string {
        return mysql.escape(data)
    }
}