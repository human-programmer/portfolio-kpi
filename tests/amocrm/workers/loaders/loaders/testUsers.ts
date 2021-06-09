import {UsersLoader} from "../../../../../workers/amocrm/loaders/users/UsersLoader";
import {LoadDataSets} from "../LoadDataSets";
import {TestFabric} from "../../TestFabric";
import {CRMDB} from "../../../../../generals/data_base/CRMDB";
import {IAmocrmLoaders} from "../../../../../workers/amocrm/interface";
import IAmocrmJob = IAmocrmLoaders.IAmoJob;

const chai = require('chai')

export async function testSetsUsers(): Promise<void> {
    describe('testSetsLoadUsers', () => {
        it('run with test data sets', async () => {
            const job = await TestFabric.uniqueLoadUsersJob()
            await loadTestUsers(job)
            await checkActualUsers(job.node.account.pragma_account_id)
        })
    })
}


// @ts-ignore
export class TestUsersLoader extends UsersLoader {
    private async restQuery(): Promise<any> {
        return TestUsersLoader.amocrmTestUsersAnswer
    }

    static get pragmaTestUsers(): Array<any> {
        const amoUsers = TestUsersLoader.amocrmTestUsers
        return amoUsers.map(i => {
            return {
                surname: '',
                middle_name: '',
                lang: i.lang,
                name: i.name,
                email: i.email,
                phone: '',
                amocrmUserId: Number.parseInt(i.id),
                isAdmin: !!i.rights.is_admin
            }
        })
    }

    static get amocrmTestUsers(): Array<any> {
        return TestUsersLoader.amocrmTestUsersAnswer.body._embedded.users
    }

    static get amocrmTestUsersAnswer(): any {
        return LoadDataSets.getFileContent('UsersLoader' + '.json')
    }
}

export async function loadTestUsers(job: IAmocrmJob): Promise<void> {
    await safeClearAllUsers()
    const usersLoader = new TestUsersLoader(job)
    await usersLoader.run()
    setTimeout(() => safeClearAllUsers(), 2000)
}

async function checkActualUsers(pragmaAccountId: number): Promise<void> {
    const users = TestUsersLoader.pragmaTestUsers
    const actual = await getActualUsersInAccount(pragmaAccountId)
    compareUsers(actual, users)
}

async function getActualUsersInAccount(pragmaAccountId: number): Promise<Array<any>> {
    const users = await getUsersInAccount(pragmaAccountId)
    return formattingUsers(users)
}

function formattingUsers(users: Array<any>): Array<any> {
    return users.map(i => {
        i.isAdmin = i.permission_id == 2
        i.phone = i.phone ? i.phone : ''
        return i
    })
}

async function safeClearAllUsers(): Promise<void> {
    if(process.platform === 'win32') {
        const sql = `DELETE FROM ${CRMDB.usersSchema} WHERE 1`
        await CRMDB.query(sql)
    }
}

async function getUsersInAccount(pragmaAccountId: number): Promise<Array<any>> {
    const pragma = CRMDB.usersSchema
    const amocrm = CRMDB.amocrmUsersSchema
    const accesses = CRMDB.accessesSchema
    const links = CRMDB.usersToAccountsSchema
    const sql = `SELECT
                     ${amocrm}.amo_id as amocrmUserId,
                     ${pragma}.id as pragmaUserId,
                     ${pragma}.surname,
                     ${pragma}.middle_name,
                     ${pragma}.lang,
                     ${pragma}.name,
                     ${pragma}.email,
                     ${pragma}.phone,
                     ${accesses}.permission_id
                FROM ${links}
                    INNER JOIN ${pragma} ON ${pragma}.id = ${links}.user_id
                    INNER JOIN ${amocrm} ON ${amocrm}.pragma_id = ${pragma}.id
                    LEFT JOIN ${accesses} ON ${accesses}.user_id = ${pragma}.id
                WHERE ${links}.account_id = ${pragmaAccountId} `
    return await CRMDB.query(sql)
}
function compareUsers(actual: Array<any>, users: Array<any>): void {
    chai.assert(actual.length === users.length)
    actual.forEach(a => compareUser(a, users.find(i => i.amocrmUserId == a.amocrmUserId)))
}

function compareUser(actual: any, user: any): void {
    chai.assert(actual.surname === user.surname)
    chai.assert(actual.middle_name === user.middle_name)
    chai.assert(actual.lang === user.lang)
    chai.assert(actual.name === user.name)
    chai.assert(actual.email === user.email)
    chai.assert(actual.phone === user.phone)
    chai.assert(actual.amocrmUserId === user.amocrmUserId)
    chai.assert(actual.isAdmin === user.isAdmin)
}