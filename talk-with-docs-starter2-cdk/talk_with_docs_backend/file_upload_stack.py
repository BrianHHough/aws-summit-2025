from aws_cdk import (
    Stack,
    RemovalPolicy,
    Duration,
    aws_s3 as s3,
    aws_dynamodb as ddb,
    aws_iam as iam,
    aws_guardduty as guardduty,
    aws_lambda as _lambda, 
    aws_events as events, 
    aws_events_targets as targets,
    aws_sqs as sqs
)

from constructs import Construct


class FileUploadStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Define CORS rules for the buckets
        cors_rule = s3.CorsRule(
            allowed_methods=[
                s3.HttpMethods.GET,
                s3.HttpMethods.POST,
                s3.HttpMethods.PUT,
                s3.HttpMethods.DELETE,
                s3.HttpMethods.HEAD,
            ],
            allowed_origins=[
                "http://localhost:3000",
                "https://drw40d51ah01b.cloudfront.net"
            ],
            allowed_headers=["*"],
            exposed_headers=["ETag"]
        )

        # Raw uploads bucket
        self.upload_bucket = s3.Bucket(
            self, "UploadBucket",
            removal_policy=RemovalPolicy.RETAIN,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            cors=[cors_rule]
        )

        # Final (clean) files bucket
        self.final_bucket = s3.Bucket(
            self, "FinalBucket",
            removal_policy=RemovalPolicy.RETAIN,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            cors=[cors_rule]
        )

        # Quarantine bucket
        self.quarantine_bucket = s3.Bucket(
            self, "QuarantineBucket",
            removal_policy=RemovalPolicy.RETAIN,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            cors=[cors_rule]
        )

        # DynamoDB Table for tracking file metadata and scan status
        self.document_metadata_table = ddb.Table(
            self, "DocumentMetadataTable",
            partition_key=ddb.Attribute(
                name="document_id",
                type=ddb.AttributeType.STRING
            ),
            billing_mode=ddb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN
        )

        # Add GSI if you want to query by user_id
        self.document_metadata_table.add_global_secondary_index(
            index_name="user_id-index",
            partition_key=ddb.Attribute(name="user_id", type=ddb.AttributeType.STRING)
        )

        # Create service role ARN for GuardDuty Malware Protection
        guardduty_service_role_arn = f"arn:aws:iam::{self.account}:role/aws-service-role/malware-protection.guardduty.amazonaws.com/AWSServiceRoleForAmazonGuardDutyMalwareProtection"
        
        # Add bucket policy to allow GuardDuty Malware Protection service role to access the upload bucket
        self.upload_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AllowGuardDutyMalwareProtection",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("malware-protection.guardduty.amazonaws.com")],
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectTagging",
                    "s3:PutObjectTagging",
                    "s3:ListBucket"
                ],
                resources=[
                    self.upload_bucket.bucket_arn,
                    f"{self.upload_bucket.bucket_arn}/*"
                ]
            )
        )

        # Dead Letter Queue for failed GuardDuty events
        self.guardduty_dlq = sqs.Queue(
            self, "GuardDutyDLQ",
            removal_policy=RemovalPolicy.RETAIN,  # so we don't lose failed events
        )

        # Lambda to process GuardDuty findings
        self.guardduty_findings_lambda = _lambda.Function(
            self, "GuardDutyFindingsHandler",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="handler.main",
            code=_lambda.Code.from_asset("lambda/guardduty_findings"),
            environment={
                "DDB_TABLE": self.document_metadata_table.table_name,
            },
            timeout=Duration.seconds(30),
            dead_letter_queue=self.guardduty_dlq
        )

        # Grant Lambda permission to update DynamoDB
        self.document_metadata_table.grant_write_data(self.guardduty_findings_lambda)

        # EventBridge rule for GuardDuty malware scan findings
        events.Rule(
            self, "GuardDutyMalwareFindingRule",
            event_pattern=events.EventPattern(
                source=["aws.guardduty"],
                detail_type=["GuardDuty Finding"],
                detail={
                    "resource": {
                        "resourceType": ["S3Bucket"]
                    },
                    "service": {
                        "action": {
                            "actionType": ["AWS_API_CALL"]
                        },
                        "eventFirstSeen": [{ "exists": True }],
                        "additionalInfo": {
                            "malwareProtection": {
                                "scanResultDetails": [{ "exists": True }]
                            }
                        }
                    }
                }
            ),
            targets=[targets.LambdaFunction(self.guardduty_findings_lambda)]
        )

        # Add GSI to document_metadata_table to query by uploaded_at time
        self.document_metadata_table.add_global_secondary_index(
            index_name="user_id-upload_timestamp-index",
            partition_key=ddb.Attribute(name="user_id", type=ddb.AttributeType.STRING),
            sort_key=ddb.Attribute(name="upload_timestamp", type=ddb.AttributeType.STRING),  # AWSDateTime is ISO string
            projection_type=ddb.ProjectionType.ALL
        )

        self.output_resources()

    def output_resources(self):
        from aws_cdk import CfnOutput

        CfnOutput(self, "UploadBucketName", value=self.upload_bucket.bucket_name)
        CfnOutput(self, "FinalBucketName", value=self.final_bucket.bucket_name)
        CfnOutput(self, "QuarantineBucketName", value=self.quarantine_bucket.bucket_name)
        CfnOutput(self, "MetadataTableName", value=self.document_metadata_table.table_name)
        CfnOutput(self, "GuardDutyDLQUrl", value=self.guardduty_dlq.queue_url)
        CfnOutput(self, "GuardDutyFindingsLambdaName", value=self.guardduty_findings_lambda.function_name)

