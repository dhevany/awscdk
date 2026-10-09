
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class ServerlessCdkProjectStack extends cdk.Stack {

  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {

    super(scope, id, props);

    // STEP 1: Create DynamoDB table
    const table = new dynamodb.Table(this, 'StudentItemsTable', {
      tableName: 'StudentItems',

      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },

      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // STEP 2: Create Lambda IAM execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    // DynamoDB full access
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonDynamoDBFullAccess'
      )
    );

    // CloudWatch Logs access
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

     
    // STEP 3: Create Lambda function
    const itemsFunction = new nodejs.NodejsFunction(
      this,
      'ItemsFunction',
      {
        runtime: lambda.Runtime.NODEJS_22_X,

        // Path to your existing Lambda file
        entry: path.join(process.cwd(), 'lambda', 'lambda.ts'),

        handler: 'handler',

        role: lambdaRole,

        environment: {
          TABLE_NAME: table.tableName
        }
      }
    );


    // STEP 4: Grant DynamoDB permissions
    table.grantReadWriteData(itemsFunction);

    // STEP 5: Create API Gateway
    const api = new apigateway.RestApi(this, 'StudentItemsApi', {
      restApiName: 'Student Items API'
    });

    const items = api.root.addResource('items');

    const integration = new apigateway.LambdaIntegration(
      itemsFunction
    );

    // Insert item
    items.addMethod('POST', integration);

    // Retrieve all items
    items.addMethod('GET', integration);

    // Retrieve one item
    const singleItem = items.addResource('{id}');
    singleItem.addMethod('GET', integration);

    // STEP 6: Output API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: table.tableName
    });

  } // End constructor

} // End class
