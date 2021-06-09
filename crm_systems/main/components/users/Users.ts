import {PragmaUsers} from "../../../pragma/components/users/PragmaUsers";
import {IMain} from "../../interfaces/MainInterface";
import IUser = IMain.IUser;
import IUpdateUserStruct = IMain.IUpdateUserStruct;
import IMainUserStruct = IMain.IMainUserStruct;
import {CRMDB} from "../../../../generals/data_base/CRMDB";
import ICreateUserStruct = IMain.ICreateUserStruct;
import IUserStruct = IMain.IUserStruct;
import {IBasic} from "../../../../generals/IBasic";
import validPhoneExcept = IBasic.validPhoneExcept;
import asPhone = IBasic.asPhone;
import validEmailExcept = IBasic.validEmailExcept;
import asEmail = IBasic.asEmail;
import Errors = IBasic.Errors;

export class MainUser implements IUser {
    private _pragmaUserId: number;
    private _email: string;
    private _confirmEmail: boolean;
    private _phone: string | null;
    private _name: string
    private _surname: string;
    private _middleName: string;
    private _lang: string;

    constructor(model: any) {
        this._pragmaUserId = model.pragma_user_id
        this._email = model.email
        this._confirmEmail = !!model.confirm_email
        this._phone = model.phone || ''
        this._name = model.name || ''
        this._surname = model.surname || ''
        this._middleName = model.middle_name || ''
        this._lang = model.lang || ''
    }

    async update(struct: IUpdateUserStruct): Promise<void> {
        this.set(struct)
        await PragmaUsers.updateUser(struct)
    }

    private set(struct: IMainUserStruct): void {
        this._surname = struct.surname
        this._middleName = struct.middle_name
        this._lang = struct.lang
        this._name = struct.name
    }

    async setPhone(phone: string): Promise<void> {
        validPhoneExcept(phone)
        phone = asPhone(phone)
        if(phone === this.phone) return;
        this._phone = phone
        await UsersSchema.setPhone(this.pragmaUserId, this.phone)
    }

    async setConfirmEmail(): Promise<void> {
        this._confirmEmail = true
        await UsersSchema.setConfirmEmail(this.pragmaUserId)
    }

    compareEmail(email: string): boolean {
        if(!MainUser.validEmail(email) || !this.email) return false
        return email === this.email
    }

    comparePhone(phone: string): boolean {
        if(!MainUser.validPhone(phone) || !this.phone) return false
        return this.phone === phone
    }

    static validEmail(email: any): boolean {
        try {
            validEmailExcept(email)
        } catch (e) {
            return false
        }
        return true
    }

    static validPhone(phone: any): boolean {
        try {
            validPhoneExcept(phone)
        } catch (e) {
            return false
        }
        return true
    }

    toString(): string {
        return JSON.stringify(this.publicModel)
    }

    get publicModel(): IUserStruct {
        return {
            pragma_user_id: this.pragmaUserId,
            confirm_email: this.confirmEmail,
            email: this.email,
            lang: this.lang,
            phone: this.phone,
            surname: this.surname,
            middle_name: this.middleName,
            name: this.name,
        }
    }

    get pragmaUserId(): number {
        return this._pragmaUserId;
    }

    get email(): string {
        return this._email;
    }

    get confirmEmail(): boolean {
        return this._confirmEmail;
    }

    get phone(): string | null {
        return this._phone;
    }

    get name(): string {
        return this._name;
    }

    get surname(): string {
        return this._surname;
    }

    get middleName(): string {
        return this._middleName;
    }

    get lang(): string {
        return this._lang;
    }
}

export class UsersSchema extends CRMDB{
    static async findByEmail(email: string): Promise<any|null> {
        if(!MainUser.validEmail(email))
            return null
        email = UsersSchema.asEmail(email)
        const condition = `${super.usersSchema}.email = ?`
        return await UsersSchema.singleSelect(condition, [email])
    }

    static async findByPhone(phone: string): Promise<any|null> {
        if(!MainUser.validPhone(phone))
            return null
        phone = UsersSchema.asPhone(phone)
        const condition = `${super.usersSchema}.phone = ?`
        return await UsersSchema.singleSelect(condition, [phone])
    }

    static async findById(id: number): Promise<any|null> {
        const condition = `${super.usersSchema}.id = ?`
        return await UsersSchema.singleSelect(condition, [id])
    }

    private static async singleSelect(condition: string, params: Array<number|string>): Promise<any|null> {
        const sql = UsersSchema.sql(condition)
        const models = await super.query(sql, params)
        return models[0] || null
    }

    private static sql(condition: string): string {
        const usersSchema = super.usersSchema
        return `SELECT 
                     ${usersSchema}.id AS pragma_user_id,
                     ${usersSchema}.name AS name,
                     ${usersSchema}.surname AS surname,
                     ${usersSchema}.middle_name AS middle_name,
                     ${usersSchema}.email AS email,
                     ${usersSchema}.confirm_email AS confirm_email,
                     ${usersSchema}.phone AS phone,
                     ${usersSchema}.lang AS lang
                FROM ${usersSchema} 
                WHERE ${condition}`
    }

    static async createUser(user: ICreateUserStruct): Promise<number> {
        UsersSchema.validStructToCreate(user)
        const schema = super.usersSchema
        const sql = `INSERT INTO ${schema} (email, phone, name, surname, middle_name, lang)
                    VALUES(?, ?, ?, ?, ?, ?)`
        const model = [
            user.email ? UsersSchema.asEmail(user.email) : null,
            user.phone ? UsersSchema.asPhone(user.phone) : null,
            user.name,
            user.surname,
            user.middle_name,
            user.lang
        ]
        const result = await CRMDB.query(sql, model)
        return Number.parseInt(result['insertId'])
    }

    private static validStructToCreate(user: ICreateUserStruct): void {
        UsersSchema.validString(user.name, 'name', 256)
        UsersSchema.validString(user.surname, 'surname', 256)
        UsersSchema.validString(user.middle_name, 'middle_name', 256)
        UsersSchema.validString(user.email, 'email', 256)
        UsersSchema.validString(user.phone, 'phone', 18)
        UsersSchema.validString(user.lang, 'lang', 6)
    }

    private static validString(str: string, valueName: string, maxLength: number): void {
        if(str.length > maxLength)
            throw Errors.invalidRequest(`The maximum length of a "${valueName}" value ${maxLength} characters`)
    }

    static async setPhone(pragmaUserId: number, phone: string): Promise<void> {
        phone = UsersSchema.asPhone(phone)
        const users = super.usersSchema
        const sql = `UPDATE ${users} SET ${users}.phone = ? WHERE ${users}.id = ${pragmaUserId}`
        await super.query(sql, [phone])
    }

    static async setConfirmEmail(pragmaUserId: number): Promise<void> {
        const users = super.usersSchema
        const sql = `UPDATE ${users} SET ${users}.confirm_email = 1 WHERE ${users}.id = ${pragmaUserId}`
        await super.query(sql)
    }

    static async updateUser(struct: IUpdateUserStruct): Promise<void> {
        const users = super.usersSchema
        const sql = `UPDATE ${users} SET 
                        ${users}.surname = ?,
                        ${users}.middle_name = ?,
                        ${users}.lang = ?,
                        ${users}.name = ?
                    WHERE ${users}.id = ${struct.pragma_user_id}`
        const model = [
            struct.surname,
            struct.middle_name,
            struct.lang,
            struct.name,
        ]
        await super.query(sql, model)
    }

    private static asEmail(email: any): string {
        return asEmail(email)
    }

    private static asPhone(phone: any): string {
        return asPhone(phone)
    }
}