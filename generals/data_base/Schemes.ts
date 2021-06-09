import {Configs} from "../Configs";

export class Schemes {
    static get amocrmAccountsSchema(): string {
        return '`' + Schemes.amocrm_interface_db + '`.`account`'
    }

    static get amocrmPipelinesSchema(): string {
        return '`' + Schemes.amocrm_interface_db + '`.`pipelines`'
    }

    static get amocrmStatusesSchema(): string {
        return '`' + Schemes.amocrm_interface_db + '`.`statuses`'
    }

    static get amocrmUsersSchema(): string {
        return '`' + Schemes.amocrm_interface_db + '`.`users`'
    }

    static get amocrmModulesSchema(): string {
        return '`' + Schemes.amocrm_interface_db + '`.`modules`'
    }

    static get amocrmModulesTokensSchema(): string {
        return '`' + Schemes.amocrm_interface_db + '`.`modules_tokens`'
    }

    static get amocrmFieldsSchema(): string {
        return '`' + Schemes.amocrm_interface_db + '`.`field`'
    }

    static get amocrmEnumsSchema(): string {
        return '`' + Schemes.amocrm_interface_db + '`.`fields_options`'
    }

    static get amocrmEntitiesSchema(): string {
        return '`' + Schemes.amocrm_interface_db + '`.`entity`'
    }

    static get amocrmCallsSchema(): string {
        return '`' + Schemes.amocrm_interface_db + '`.`calls`'
    }

    static get accountSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`account`'
    }

    static get crmNameSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`crm_name`'
    }

    static get pipelinesSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`pipelines`'
    }

    static get statusesSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`statuses`'
    }

    static get statusesToPipelineSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`statuses_to_pipeline`'
    }

    static get fieldsSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`fields`'
    }

    static get enumsSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`enums`'
    }

    static get entitiesSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`entities`'
    }

    static get entitiesToEntitiesSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`entities_to_entities`'
    }

    static get entitiesToUserSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`entities_to_user`'
    }

    static get entitiesToStatusSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`entities_to_status`'
    }

    static get statusDurationSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`status_duration`'
    }

    static get enumsValuesSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`enum_values`'
    }

    static get stringValuesSchema(): string {
        return '`' + Schemes.pragmacrm_db + '`.`string_values`'
    }

    static get modulesSchema(): string {
        return '`' + Schemes.modules_db + '`.`modules`'
    }

    static get moduleToAccountSchema(): string {
        return '`' + Schemes.modules_db + '`.`module_to_account`'
    }

    static get redirectLinksSchema(): string {
        return '`' + Schemes.modules_db + '`.`redirect_links`'
    }

    static get modulesToGroupsSchema(): string {
        return '`' + Schemes.modules_db + '`.`modules_to_groups`'
    }

    static get moduleGroupsSchema(): string {
        return '`' + Schemes.modules_db + '`.`groups`'
    }

    static get nodesApiKeysSchema(): string {
        return '`' + Schemes.modules_db + '`.`api_keys`'
    }

    static get workResultsSchema(): string {
        return '`' + Schemes.modules_db + '`.`work_results`'
    }

    static get usersSchema(): string {
        return '`' + Schemes.pragma_users_db + '`.`users`'
    }

    static get departmentsSchema(): string {
        return '`' + Schemes.pragma_users_db + '`.`departments`'
    }

    static get usersToDepartmentsSchema(): string {
        return '`' + Schemes.pragma_users_db + '`.`user_to_departments`'
    }

    static get usersToAccountsSchema(): string {
        return '`' + Schemes.pragma_users_db + '`.`user_to_account`'
    }

    static get accessesSchema(): string {
        return '`' + Schemes.pragma_users_db + '`.`accesses`'
    }

    static get permissionsSchema(): string {
        return '`' + Schemes.pragma_users_db + '`.`permissions`'
    }

    static get bitrix24AccountSchema(): string {
        return '`' + Schemes.bitrix24_interface_db + '`.`account`'
    }

    static get bitrix24ModulesSchema(): string {
        return '`' + Schemes.bitrix24_interface_db + '`.`modules`'
    }

    static get bitrix24ModulesTokensSchema(): string {
        return '`' + Schemes.bitrix24_interface_db + '`.`modules_tokens`'
    }

    static get callsSchema(): string {
        return '`' + Schemes.telephony_db + '`.`calls`'
    }

    static get linksToTalkSchema(): string {
        return '`' + Schemes.telephony_db + '`.`links_to_talk`'
    }

    static get phonesSchema(): string {
        return '`' + Schemes.telephony_db + '`.`phones`'
    }

    static get phonesToEntitiesSchema(): string {
        return '`' + Schemes.telephony_db + '`.`phones_to_entities`'
    }

    static get callStatusesSchema(): string {
        return '`' + Schemes.telephony_db + '`.`statuses`'
    }

    static get bunchMetricsSchema(): string {
        return '`' + Schemes.metrics_db + '`.`bunch_metric_values`'
    }

    static get counterMetricsSchema(): string {
        return '`' + Schemes.metrics_db + '`.`counter_metric_values`'
    }

    static get defaultValuesOfMetricsSchema(): string {
        return '`' + Schemes.metrics_db + '`.`default_values`'
    }

    static get metricsSchema(): string {
        return '`' + Schemes.metrics_db + '`.`metrics`'
    }

    private static get amocrm_interface_db(): string {
        return Configs.dbNames.amocrm_interface
    }

    private static get bitrix24_interface_db(): string {
        return Configs.dbNames.bitrix24_interface
    }

    private static get pragma_users_db(): string {
        return Configs.dbNames.users
    }

    private static get modules_db(): string {
        return Configs.dbNames.modules
    }

    private static get pragmacrm_db(): string {
        return Configs.dbNames.pragmacrm
    }

    private static get telephony_db(): string {
        return Configs.dbNames.telephony
    }

    private static get metrics_db(): string {
        return Configs.dbNames.metrics
    }
}