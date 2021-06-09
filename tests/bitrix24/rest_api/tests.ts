import {testRequest} from "./RequestTest";
import {testBatch} from "./BatchTest";
import {testRestApiGateway} from "./RestApiGatewayTest";
import {testBitrix24RestApiStack} from "./RestApiCtackTest";

export async function testBitrix24RestApiGateway(): Promise<void> {
    await testRequest()
    await testBatch()
    await testRestApiGateway()
    await testBitrix24RestApiStack()
}