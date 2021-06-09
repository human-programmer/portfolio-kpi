import {IAmocrmLoaders} from "../../interface";
import IAmocrmCustomField = IAmocrmLoaders.IAmocrmCustomField;
import {Amocrm} from "../../../../crm_systems/amocrm/interface/AmocrmInterfaces";
import IAmocrmNodeStruct = Amocrm.IAmocrmNodeStruct;
import {IBasic} from "../../../../generals/IBasic";
import Errors = IBasic.Errors;
import IAmocrmEnum = IAmocrmLoaders.IAmocrmEnum;
import {Generals} from "../../../../generals/Interfaces";
import FieldType = Generals.FieldType;
import {Func} from "../../../../generals/Func";

export class FieldsValidator {
    static formattingFields(node: IAmocrmNodeStruct, fields: Array<any>): Array<IAmocrmCustomField> {
        return fields.map(cf => {
            const validator = new FieldsValidator(node, cf)
            return validator.formatting()
        })
    }

    private readonly field: any
    private readonly node: IAmocrmNodeStruct
    constructor(node: IAmocrmNodeStruct, inputField: any) {
        this.field = inputField
        this.node = node
    }

    formatting(): IAmocrmCustomField {
        return {
            amocrmAccountId: this.amocrmAccountId,
            amocrmEntityType: this.amocrmEntityType,
            amocrmFieldId: this.amocrmFieldId,
            amocrmFieldType: this.amocrmFieldType,
            pragmaAccountId: this.pragmaAccountId,
            pragmaEntityType: this.pragmaEntityType,
            pragmaFieldType: this.pragmaFieldType,
            title: this.title,
            enums: this.enums,
        }
    }

    private get amocrmAccountId(): number {
        return this.node.account.amocrm_account_id
    }

    private get pragmaAccountId(): number {
        return this.node.account.pragma_account_id
    }

    private get amocrmEntityType(): string {
        return '' + this.field.entity_type
    }

    private get amocrmFieldType(): string {
        return '' + this.field.type
    }

    private get pragmaEntityType(): number {
        return FieldsValidator.getPragmaGroupId(this.field.entity_type)
    }

    private get pragmaFieldType(): FieldType {
        return FieldsValidator.getPragmaFieldType(this.field.type)
    }

    private get title(): string {
        return '' + this.field.name
    }

    private get amocrmFieldId(): number {
        return Number.parseInt(this.field.id)
    }

    private get enums(): Array<IAmocrmEnum> {
        if(this.pragmaFieldType !== 'enums') return []
        const enums = Array.isArray(this.field.enums) ? this.field.enums : []
        return this.formattingEnums(enums)
    }

    private formattingEnums(fieldEnums: Array<any>): Array<IAmocrmEnum> {
        return fieldEnums.map(en => this.formattingEnum(en))
    }

    private formattingEnum(inputEnum: any): IAmocrmEnum {
        return {
            amocrmEnumId: Number.parseInt(inputEnum.id),
            pragmaAccountId: this.pragmaAccountId,
            sort: Number.parseInt(inputEnum.sort),
            value: '' + inputEnum.value
        }
    }

    private static getPragmaGroupId(amocrmEntityType: string): number {
        switch (amocrmEntityType) {
            case 'customers': return 1
            case 'leads': return 2
            case 'contacts': return 3
            case 'companies': return 4
            default:
                throw Errors.invalidRequest(`Unknown amocrm entity type "${amocrmEntityType}"`)
        }
    }

    private static getPragmaFieldType(amocrmFieldType: string): FieldType {
        return Func.toPragmaFieldType(amocrmFieldType)
    }
}