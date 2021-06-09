import {Interfaces} from "./Interfaces";
import IAlias = Interfaces.IAlias;
import IOtherParams = Interfaces.IOtherParams;

export class Alias implements IAlias{
    private readonly _entity_type: string
    private readonly _field_type: string
    private readonly _field_name: string
    private readonly _title: string
    private readonly _mode: string

    constructor({entity_type, field_type, field_name, title, mode}: IAlias) {
        this._entity_type = entity_type;
        this._field_type = field_type;
        this._field_name = field_name;
        this._title = title;
        this._mode = mode;
    }

    get entity_type(): string{
        return this._entity_type;
    }

    get field_type(): string{
        return this._field_type;
    }

    get field_name(): string{
        return this._field_name;
    }

    get alias(): string{
        return `{${this.shortAlias}}`
    }

    get shortAlias(): string{
        if (this.mode)
            return `${this.field_name}.${this.entity_type}.${this.mode}`
        return `${this.field_name}.${this.entity_type}`
    }

    get title(): string{
        return this._title;
    }

    get mode(): string{
        return this._mode;
    }

    get value(): string | Date{
        return ''
    }
}

class DefaultsAliasModels {
    static get models() {
        return [
            {
                entity_type: 'def',
                field_type: 'date',
                field_name: 'current_d',
                title: 'Текущая дата',
            },
            {
                entity_type: 'def',
                field_type: 'date_time',
                field_name: 'current_dt',
                title: 'Текущая дата и время',
            },
            {
                entity_type: 'leads',
                field_type: 'text',
                field_name: 'name',
                title: 'Название',
            },
            {
                entity_type: 'leads',
                field_type: 'numeric',
                field_name: 'price',
                title: 'Бюджет',
            },
            {
                entity_type: 'leads',
                field_type: 'user_id',
                field_name: 'user_id',
                title: 'Ответственный',
            },
            {
                entity_type: 'contacts',
                field_type: 'text',
                field_name: 'name',
                title: 'Название',
            },
            {
                entity_type: 'contacts',
                field_type: 'text',
                field_name: 'phone',
                title: 'Телефон',
            },
            {
                entity_type: 'contacts',
                field_type: 'user_id',
                field_name: 'user_id',
                title: 'Ответственный',
            },
            {
                entity_type: 'companies',
                field_type: 'text',
                field_name: 'name',
                title: 'Название',
            },
            {
                entity_type: 'companies',
                field_type: 'user_id',
                field_name: 'user_id',
                title: 'Ответственный',
            },
        ]
    }
}

export class ApiAliasModels {
    static formattingApiModels(models) {
        return models.map(i => ApiAliasModels.formattingModel(i))
    }

    static formattingModel(model){
        return {
            entity_type: model.entity_type,
            field_type: model.type,
            field_name: model.id,
            title: model.name,
        }
    }
}

export class AliasFabric {
    protected readonly otherParams: IOtherParams
    constructor(otherParams: IOtherParams) {
        this.otherParams = otherParams
    }

    getAliases(): IAlias[]{
        const models = this.getAllModels()
        return models.map(i => new Alias(i))
    }

    private getAllModels() {
        const models = this.getModels()
        return AliasFabric.addModeModels(models)
    }

    private getModels() {
        const apiModels = ApiAliasModels.formattingApiModels(this.otherParams.customFields)
        return [].concat(DefaultsAliasModels.models, apiModels)
    }

    private static addModeModels(models) {
        return [].concat(...models.map(model => AliasFabric.createModelsFromModel(model)))
    }

    private static createModelsFromModel(model) {
        if (!AliasFabric.isAvailableType(model)) return []

        if (model.field_type === 'numeric')
            return AliasFabric.getNumericModels(model)
        else if (model.field_type === 'legal_entity')
            return AliasFabric.getLegalModels(model)
        else
            return [model]
    }

    private static getNumericModels(model) {
        const textModeModel = AliasFabric.getTextModeModel(model)
        return [textModeModel, model]
    }

    private static getTextModeModel(model) {
        const newModel = Object.assign({}, model)
        newModel.mode = 'text'
        newModel.title = newModel.title + ' (прописью)'
        return newModel
    }

    private static getLegalModels(model) {
        return [
            AliasFabric.fetchAddressModel(model),
            AliasFabric.fetchKppModel(model),
            AliasFabric.fetchNameModel(model),
            AliasFabric.fetchVatIdModel(model),
            AliasFabric.fetchTaxModel(model),
        ]
    }

    private static fetchAddressModel(model) {
        const newModel = Object.assign({}, model)
        newModel.title = newModel.title + ' (адрес)'
        newModel.mode = 'address'
        return newModel
    }

    private static fetchKppModel(model) {
        const newModel = Object.assign({}, model)
        newModel.title = newModel.title + ' (КПП)'
        newModel.mode = 'kpp'
        return newModel
    }

    private static fetchNameModel(model) {
        const newModel = Object.assign({}, model)
        newModel.title = newModel.title + ' (название организации)'
        newModel.mode = 'name'
        return newModel
    }

    private static fetchVatIdModel(model) {
        const newModel = Object.assign({}, model)
        newModel.title = newModel.title + ' (ИНН)'
        newModel.mode = 'id'
        return newModel
    }

    private static fetchTaxModel(model) {
        const newModel = Object.assign({}, model)
        newModel.title = newModel.title + ' (ОГРНИП)'
        newModel.mode = 'tax'
        return newModel
    }

    static isAvailableType(model) {
        switch (model.field_type) {
            case 'user_id':
            case 'text':
            case 'streetaddress':
            case 'numeric':
            case 'select':
            case 'multiselect':
            case 'radiobutton':
            case 'date_time':
            case 'date':
            case 'legal_entity':
            case 'checkbox':
                return true
            default:
                return false
        }
    }
}