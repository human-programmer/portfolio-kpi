import {Process} from "../../server/Process";
import {Configs} from "../../generals/Configs";
import {ModulesConductor} from "./ModulesConductor";
import {LogJson} from "../../generals/LogWriter";

const Express = require("express")
const PizZip = require('pizzip');

Configs.setIsMainThread(true)
const processName = Configs.isDev ? 'mini-services-dev' : 'mini-services'
Process.setProcessName(processName)
Process.reset()

console.log('run ' + processName + ' on port: ' + Configs.server.modules_port)

const app = new Express()

app.use(Express.json())
app.use(Express.urlencoded({ extended: true }))

app.use('/', ModulesConductor.handler)

app.use((err, req, res, next): void => {
    console.log('error', err)
    if(err) {
        res.status(501).send(err)
        LogJson.create().sendError(err, 'Unhandled error')
    }
})

app.listen(Configs.server.modules_port, err => console.error(err))

module.exports = app