
import * as cdk from 'aws-cdk-lib';

import {
  ServerlessCdkProjectStack
} from '../lib/serverless-cdk-project-stack';

// Step 1: Create CDK application
const app = new cdk.App();

// Step 2: Create AWS CDK stack
new ServerlessCdkProjectStack(
  app,
  'ServerlessCdkProjectStack',
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'ca-central-1'
    }
  }
);

// Step 3: Generate CloudFormation template
app.synth();
