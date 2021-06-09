import {Configs} from "../../../generals/Configs";

const chai = require('chai')

class TestConfigs extends Configs {

    protected static get params(): any {
        return TestConfigs.testModel
    }

    static get testModel(): any {
        return {
            DB_CONNECT: {
                host: '127.0.0.1',
                dbname: 'pragma_crm_test',
                user: 'root',
                password: 'root',
            },
            DB_NAMES: {
                amocrm_interface: 'amocrm_interface_test',
                bitrix24_interface: 'bitrix_interface_dev',
                dashboard: 'pragma_crm',
                calculator: 'pragma_calculator',
                pragmacrm: 'pragma_crm_test',
                modules: 'pragma_modules',
                users: 'pragma_users',
                storage: 'pragma_storage',
                additional_storage: 'pragma_storage_additional_dev',
                market: 'pragma_market_dev',
            },
            SERVICES_SERVER: {
                port: '19000',
                host: '127.0.0.1',
            },
        }
    }
}

export async function testConfigs(): Promise<void> {
    describe('Configs', () => {
        it('isHosting', () => {
            chai.assert(Configs.isHosting === false)
        })

        it('isDevPath', () => {
            const deployPath = '\\services\\generals'
            const devPath = '\\services_dev\\generals'
            chai.assert(Configs.isDevPath(deployPath) === false)
            chai.assert(Configs.isDevPath(devPath) == true)
        })

        it('DB_CONNECT', () => {
            const dbConnect = TestConfigs.dbConnect
            const expect = TestConfigs.testModel.DB_CONNECT
            chai.assert(dbConnect.host === expect.host)
            chai.assert(dbConnect.user === expect.user)
            chai.assert(dbConnect.password === expect.password)
        })

        it('DB_NAMES', () => {
            const dbNames = TestConfigs.dbNames
            const expect = TestConfigs.testModel.DB_NAMES
            chai.assert(dbNames.amocrm_interface === expect.amocrm_interface)
            chai.assert(dbNames.bitrix24_interface === expect.bitrix24_interface)
            // chai.assert(dbNames.dashboard === expect.dashboard)
            chai.assert(dbNames.calculator === expect.calculator)
            chai.assert(dbNames.pragmacrm === expect.pragmacrm)
            chai.assert(dbNames.modules === expect.modules)
            chai.assert(dbNames.users === expect.users)
        })

        it('SERVICES_SERVER', () => {
            const server = TestConfigs.server
            const expect = TestConfigs.testModel.SERVICES_SERVER
            chai.assert(server.port === expect.port)
        })
    })
}