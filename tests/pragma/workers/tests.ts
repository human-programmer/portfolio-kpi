import {testNewSuccessfulLeadsBudget} from "./kpi/calculators/leads/budget/AbstractNewBudget.test";

export async function testPragmaWorkers(): Promise<void> {
    await testNewSuccessfulLeadsBudget()
}