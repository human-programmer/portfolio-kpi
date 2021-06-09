import {Conductor} from "./Conductor";
import {Configs} from "../generals/Configs";
import {Process} from "./Process";
import {IBasic} from "../generals/IBasic";
import Errors = IBasic.Errors;
import {IServer} from "./intrfaces";
import Result = IServer.Result;
import {LogJson} from "../generals/LogWriter";

const Express = require("express")
Configs.setIsMainThread(true)
const processName = Configs.isDev ? 'dev_services' : 'services'
Process.setProcessName(processName)
Process.reset()

console.log('run ' + processName)

Conductor.runWorkers()

const app = new Express()
const PORT = Configs.server.port

app.use(Express.json())
app.use(Express.urlencoded({ extended: true }))

app.use('/', Conductor.handler)

app.use((err, req, res, next): void => {
    console.log('error', err)
    if(err) {
        res.status(501).send(err)
        LogJson.create().sendError(err, 'Unhandled error')
    }
})

app.use(function(err, req, res, next) {
    if(!err) return next();
    const error = Errors.internalError(err)
    console.error(error);
    res.send(new Result(error));
});

app.listen(PORT, err => console.error(err))

module.exports = app