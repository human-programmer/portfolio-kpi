import {TestAmocrmAccounts} from "./TestAmocrmAccounts";
import {
    AmocrmAccount,
    AmocrmAccountBuffer,
    IAmoAccountParams
} from "../../../crm_systems/amocrm/components/accounts/AmocrmAccounts";
import {AmocrmGateway} from "../../../crm_systems/amocrm/components/gateway/AmocrmGateway";
import {LogJson} from "../../../generals/LogWriter";
import {Amocrm} from "../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAccount = Amocrm.IAccount;
import IAmocrmAccountStruct = Amocrm.IAmocrmAccountStruct;


const chai = require('chai')

const testAccounts = new TestAmocrmAccounts()
testAccounts.testParamsCreator = getTestAccountParams

function getTestAccountParams(): IAmoAccountParams {
    return {
        id: 12234,
        subdomain: 'testSubdomain',
        country: 'by',
        createdAt: 1234567890,
        createdBy: 67567,
        currency: 'USD',
        currencySymbol: '$',
        isTechnical: true,
        name: 'TEST NAME',
    }
}

function checkAccount(account: IAccount): void {
    const params = getTestAccountParams()
    chai.assert(account.amocrmAccountId === params.id)
    chai.assert(account.amocrmSubdomain === params.subdomain)
    chai.assert(account.amocrmCountry === params.country)
    chai.assert(account.amocrmCreatedAt === params.createdAt)
    chai.assert(account.amocrmCreatedBy === params.createdBy)
    chai.assert(account.amocrmCurrency === params.currency)
    chai.assert(account.amocrmCurrencySymbol === params.currencySymbol)
    chai.assert(account.amocrmIsTechnical === params.isTechnical)
    chai.assert(account.amocrmName === params.name)
}

function compareAccounts(acc1: IAccount, acc2: IAccount): void {
    chai.assert(acc1.amocrmReferer === acc2.amocrmReferer)
    chai.assert(acc1.pragmaAccountId === acc2.pragmaAccountId)
    chai.assert(acc1.amocrmAccountId === acc2.amocrmAccountId)
    chai.assert(acc1.amocrmCountry === acc2.amocrmCountry)
    chai.assert(acc1.amocrmCreatedAt === acc2.amocrmCreatedAt)
    chai.assert(acc1.amocrmCreatedBy === acc2.amocrmCreatedBy)
    chai.assert(acc1.amocrmCurrency === acc2.amocrmCurrency)
    chai.assert(acc1.amocrmCurrencySymbol === acc2.amocrmCurrencySymbol)
    chai.assert(acc1.amocrmIsTechnical === acc2.amocrmIsTechnical)
    chai.assert(acc1.amocrmName === acc2.amocrmName)
}


async function getTestAccount (): Promise<IAccount> {
    const time = new Date().getTime()
    const params: IAmoAccountParams = {
        id: time << 5,
        subdomain: 'testSubdomain_' + time,
        country: 'by',
        createdAt: Math.ceil(time / 1000),
        createdBy: (time >> 5) - 1,
        currency: 'USD',
        currencySymbol: '$',
        isTechnical: true,
        name: 'TEST NAME ' + time,
    }
    const account = await testAccounts.createAndGetAmocrmAccount(params.subdomain)
    // @ts-ignore
    account.setAll(params)
    // @ts-ignore
    await account.saveAmocrmInterface()
    return account
}

export async function testAmocrmAccounts(): Promise<void> {
    describe('Amocrm Accounts', () => {

        describe('methods', () => {

            it('Buffer', async () => {
                await testAccounts.clearAllTests()

                const buffer = new AmocrmAccountBuffer()
                const account1 = await getTestAccount()
                buffer.add(account1)
                chai.assert(buffer.size === 1)
                chai.assert(buffer.findByAmocrmId(account1.amocrmAccountId) === account1)
                chai.assert(buffer.findBySubdomain(account1.amocrmSubdomain) === account1)
                chai.assert(await testAccounts.findByAmocrmId(account1.amocrmAccountId) === account1)
                chai.assert(await testAccounts.findByAmocrmSubdomain(account1.amocrmSubdomain) === account1)

                const account2 = await getTestAccount()
                buffer.add(account2)
                chai.assert(buffer.size === 2)
                chai.assert(buffer.findByAmocrmId(account2.amocrmAccountId) === account2)
                chai.assert(buffer.findBySubdomain(account2.amocrmSubdomain) === account2)
                chai.assert(await testAccounts.findByAmocrmId(account2.amocrmAccountId) === account2)
                chai.assert(await testAccounts.findByAmocrmSubdomain(account2.amocrmSubdomain) === account2)

                await testAccounts.clearAllTests()
            })

            it('createAndGetAmocrmAccount', async () => {
                await testAccounts.clearAllTests()

                const testSubdomain = 'testSubdomain'
                const account = await testAccounts.createAndGetAmocrmAccount(testSubdomain)
                chai.assert(account instanceof AmocrmAccount)
                chai.assert(account.amocrmSubdomain === testSubdomain)
                chai.assert(account.amocrmReferer === testSubdomain + '.amocrm.ru')
                chai.assert(account.amocrmGateway instanceof AmocrmGateway)
                chai.assert(account.logWriter instanceof LogJson)

                chai.assert(!!account.pragmaAccountId)
                chai.assert(account.amocrmAccountId === 0)
                chai.assert(account.amocrmName === '')
                chai.assert(account.amocrmCreatedAt === 0)
                chai.assert(account.amocrmCreatedBy === 0)
                chai.assert(account.amocrmCountry === '')
                chai.assert(account.amocrmCurrency === '')
                chai.assert(account.amocrmCurrencySymbol === '')
                chai.assert(account.amocrmIsTechnical === false)

                await testAccounts.clearAllTests()
            })

            it('saveAmocrmInterface', async () => {
                await testAccounts.clearAllTests()

                const params = getTestAccountParams()
                const account = await testAccounts.createAndGetAmocrmAccount(params.subdomain)
                // @ts-ignore
                account.setAll(params)
                // @ts-ignore
                await account.saveAmocrmInterface()

                checkAccount(account)
                testAccounts.clearBufferTest()
                const account2 = await testAccounts.createAndGetAmocrmAccount(params.subdomain)
                chai.assert(!!account2)
                chai.assert(account !== account2)
                chai.assert(account2.pragmaAccountId === account.pragmaAccountId)
                checkAccount(account2)

                await testAccounts.clearAllTests()
            })

            it('findByAmocrmId', async () => {
                await testAccounts.clearAllTests()

                const testAccount = await testAccounts.createTestDefaultAccount()
                testAccounts.clearBufferTest()

                const acc1 = await testAccounts.findByAmocrmId(testAccount.amocrmAccountId)
                chai.assert(testAccount !== acc1)
                compareAccounts(testAccount, acc1)

                await testAccounts.clearAllTests()
            })

            it('findByAmocrmSubdomain', async () => {
                await testAccounts.clearAllTests()

                const testAccount = await testAccounts.createTestDefaultAccount()
                testAccounts.clearBufferTest()

                const acc1 = await testAccounts.findByAmocrmSubdomain(testAccount.amocrmSubdomain)
                chai.assert(testAccount !== acc1)
                compareAccounts(testAccount, acc1)

                await testAccounts.clearAllTests()
            })

            it('publicModel', async () => {
                await testAccounts.clearAllTests()

                const testAccount = await testAccounts.createTestDefaultAccount()
                const model = testAccount.publicModel

                checkAccountModel(testAccount, model)

                await testAccounts.clearAllTests()
            })

            it('clear test accounts', async () => {
                await testAccounts.clearAllTests()
            })
        })
    })
}

export function checkAccountModel(account: IAccount, model: IAmocrmAccountStruct) {
    chai.assert(account.pragmaAccountId === model.pragma_account_id)
    chai.assert(Math.abs(account.timeCreateSeconds - model.pragma_time_create) <= 1)
    chai.assert(account.amocrmAccountId === model.amocrm_account_id)
    chai.assert(account.amocrmReferer === model.amocrm_referer)
    chai.assert(account.amocrmSubdomain === model.amocrm_subdomain)
    chai.assert(account.amocrmCountry === model.amocrm_country)
    chai.assert(account.amocrmCreatedAt === model.amocrm_created_at)
    chai.assert(account.amocrmCreatedBy === model.amocrm_created_by)
    chai.assert(account.amocrmIsTechnical === model.amocrm_is_technical)
    chai.assert(account.amocrmName === model.amocrm_name)
}