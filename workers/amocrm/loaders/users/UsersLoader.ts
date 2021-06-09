import {IAmocrmLoaders} from "../../interface";
import {AmocrmLoader} from "../AmocrmLoader";
import {UsersFabric} from "./UsersFabric";
import IRestUser = IAmocrmLoaders.IRestUser;
import ILoadedUser = IAmocrmLoaders.ILoadedUser;
import {IBasic} from "../../../../generals/IBasic";
import asEmail = IBasic.asEmail;
import isValidEmail = IBasic.isValidEmail;

export class UsersLoader extends AmocrmLoader{
    protected readonly route: string = '/api/v4/users'

    protected fetchEntities(body: any): Array<ILoadedUser> {
        const usersArr = UsersLoader.fetchUsers(body)
        return this.formatting(usersArr)
    }

    private static fetchUsers(body: any): Array<any> {
        try {
            const users = body._embedded.users
            return Array.isArray(users) ? users : [users]
        } catch (e) {
            return []
        }
    }

    private formatting(usersArr: Array<any>): Array<ILoadedUser> {
        return usersArr.map(user => this.formattingUser(user)).filter(i => i)
    }

    private formattingUser(restUser: IRestUser): ILoadedUser|null {
        if(!UsersLoader.isValidUser(restUser)) return null

        const user: any = restUser
        user.rights = typeof restUser.rights === 'object' ? restUser.rights : {}
        const email = asEmail(user.email)

        return {
            pragmaAccountId: this.pragmaAccountId,
            amocrmUserId: user.id,
            email,
            name: user.name,
            lang: user.lang,
            isAdmin: !!user.rights.is_admin
        }
    }

    private static isValidUser(user: IRestUser): boolean {
        if(typeof user !== 'object')
            return false
        return isValidEmail(user.email);
    }

    protected async saveEntities(users: Array<ILoadedUser>): Promise<void> {
        await UsersFabric.save(users)
    }
}