import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import * as path from 'path';

export const basePath = '/tvo/security-scan/localstack/infra';

export interface AppStackProps extends cdk.StackProps {
  eventBusName: string;
  parameterTableName: string;
}
export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const inputQueue = Queue.fromQueueArn(
      this,
      'InputQueue',
      `arn:aws:sqs:${props?.env?.region || 'us-east-1'}:${props?.env?.account || '000000000000'}:tvo-mcp-github-issue-input-local`
    );

    // Lambda Function
    const lambdaFunction = new Function(this, 'GithubIssueFunction', {
      functionName: 'github-issue-lambda-local',
      runtime: Runtime.NODEJS_22_X,
      handler: 'src/entrypoint.handler',
      code: Code.fromAsset(path.join(__dirname, '../../dist/lambda.zip')),
      timeout: cdk.Duration.seconds(300),
      memorySize: 512,
      description: 'Lambda function for GithubIssue',
      environment: {
        AWS_STAGE: 'local',
        LOG_LEVEL: 'debug',
        TITVO_EVENT_BUS_NAME: props.eventBusName,
        TITVO_PARAMETER_TABLE_NAME: props.parameterTableName,
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    lambdaFunction.addEventSource(new SqsEventSource(inputQueue, {
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(5),
      reportBatchItemFailures: true,
    }));

    // Parámetros SSM para la Lambda
    new StringParameter(this, 'SSMParameterLambdaArn', {
      parameterName: `${basePath}/lambda/github-issue/function_arn`,
      stringValue: lambdaFunction.functionArn,
      description: 'ARN de la función Lambda de GithubIssue'
    });

    new StringParameter(this, 'SSMParameterLambdaName', {
      parameterName: `${basePath}/lambda/github-issue/function_name`,
      stringValue: lambdaFunction.functionName,
      description: 'Nombre de la función Lambda de GithubIssue'
    });

    new cdk.CfnOutput(this, 'CloudWatchLogGroupName', {
      value: lambdaFunction.logGroup.logGroupName,
      description: 'Nombre del grupo de logs de CloudWatch para GithubIssue'
    });
  }
}
