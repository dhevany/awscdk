
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from 'aws-lambda';

import {
  DynamoDBClient
} from '@aws-sdk/client-dynamodb';

import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';

// Create DynamoDB client
const client = new DynamoDBClient({});

const dynamodb = DynamoDBDocumentClient.from(client);

// DynamoDB table name from CDK environment
const TABLE_NAME = process.env.TABLE_NAME!;

// Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {

  try {

    // STEP 1: Insert student using POST
    if (event.httpMethod === 'POST') {

      let body: unknown;

      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: 'Invalid JSON request body'
          })
        };
      }

      if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body) ||
        !('id' in body) ||
        typeof body.id !== 'string' ||
        !body.id.trim()
      ) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: 'A non-empty string id is required'
          })
        };
      }

      await dynamodb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: body
        })
      );

      return {
        statusCode: 201,
        body: JSON.stringify({
          message: 'Student inserted successfully',
          item: body
        })
      };
    }

    // STEP 2: Retrieve student by ID
    if (
      event.httpMethod === 'GET' &&
      event.pathParameters?.id
    ) {

      const result = await dynamodb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            id: event.pathParameters.id
          }
        })
      );

      if (!result.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            message: 'Student not found'
          })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify(result.Item)
      };
    }

    // STEP 3: Retrieve all students
    if (event.httpMethod === 'GET') {

      const result = await dynamodb.send(
        new ScanCommand({
          TableName: TABLE_NAME
        })
      );

      return {
        statusCode: 200,
        body: JSON.stringify(result.Items || [])
      };
    }

    // Unsupported HTTP method
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: 'Method not allowed'
      })
    };

  } catch (error) {

    console.error('Lambda Error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal server error'
      })
    };
  }
};
