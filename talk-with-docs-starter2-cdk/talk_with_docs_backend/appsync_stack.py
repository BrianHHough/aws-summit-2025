from aws_cdk import Stack, CfnOutput
from aws_cdk import aws_appsync as appsync
from aws_cdk import aws_dynamodb as ddb
from aws_cdk import aws_cognito as cognito
from pathlib import Path
from constructs import Construct

class AppSyncStack(Stack):
    def __init__(self,
                 scope: Construct,
                 id: str,
                 user_pool: cognito.UserPool,
                 document_metadata_table: ddb.Table,
                 document_session_table: ddb.Table,
                 chat_message_table: ddb.Table,
                 **kwargs):
        super().__init__(scope, id, **kwargs)

        # 1. AppSync API
        api = appsync.GraphqlApi(self, "TalkWithDocsAPI",
            name="talk-with-docs-api",
            definition=appsync.Definition.from_file(str(Path(__file__).parent.parent / "graphql/schema.graphql")),
            authorization_config=appsync.AuthorizationConfig(
                default_authorization=appsync.AuthorizationMode(
                    authorization_type=appsync.AuthorizationType.USER_POOL,
                    user_pool_config=appsync.UserPoolConfig(user_pool=user_pool)
                )
            ),
            xray_enabled=True
        )

        # 2. Add Data Sources
        doc_data_source = api.add_dynamo_db_data_source("DocMetadataSource", document_metadata_table)
        session_data_source = api.add_dynamo_db_data_source("SessionSource", document_session_table)
        message_data_source = api.add_dynamo_db_data_source("MessageSource", chat_message_table)

        # 3. Resolvers — Document
        # Get Document (i.e. /dashboard/documents/{document_id})
            # ✅ Existence check: returns NotFound if the document doesn’t exist
            # ✅ Ownership check: returns Unauthorized if the user_id doesn’t match the requester’s sub
            # ✅ Returns clean JSON if authorized
        doc_data_source.create_resolver(
            id="GetDocumentResolver",
            type_name="Query",
            field_name="getDocument",
            request_mapping_template=appsync.MappingTemplate.from_string("""
            {
            "version": "2017-02-28",
            "operation": "GetItem",
            "key": {
                "document_id": $util.dynamodb.toDynamoDBJson($ctx.args.document_id)
            }
            }
            """),
            response_mapping_template=appsync.MappingTemplate.from_string("""
            #if(!$ctx.result)
            $util.error("Document not found", "NotFound")
            #end

            #if($ctx.result.user_id != $ctx.identity.claims.sub)
            $util.error("Unauthorized access to document", "Unauthorized")
            #end

            $util.toJson($ctx.result)
            """)
        )

        # Fetch Documents by User (with sorting)
        doc_data_source.create_resolver(
            id="ListDocumentsByUserResolver",
            type_name="Query",
            field_name="listDocumentsByUser",
            request_mapping_template=appsync.MappingTemplate.from_string("""
            {
                "version": "2017-02-28",
                "operation": "Query",
                "index": "user_id-index",
                "query": {
                    "expression": "user_id = :uid",
                    "expressionValues": {
                    ":uid": $util.dynamodb.toDynamoDBJson($ctx.identity.claims.sub)
                    }
                }
            }
            """),
            response_mapping_template=appsync.MappingTemplate.dynamo_db_result_list()
        )

        # Fetch Documents by User (with sorting by time)
        doc_data_source.create_resolver(
            id="ListDocumentsByUserByTimeResolver",
            type_name="Query",
            field_name="listDocumentsByUserByTime",
            request_mapping_template=appsync.MappingTemplate.from_string("""
            {
                "version": "2017-02-28",
                "operation": "Query",
                "index": "user_id-upload_timestamp-index",
                "query": {
                    "expression": "user_id = :uid",
                    "expressionValues": {
                        ":uid": $util.dynamodb.toDynamoDBJson($ctx.identity.claims.sub)
                    }
                },
                "scanIndexForward": false
            }
            """),
            response_mapping_template=appsync.MappingTemplate.dynamo_db_result_list()
        )
        




        # Not needed because the object will initially exist already via S3 upload + GuardDuty malware scan
        # doc_data_source.create_resolver(
        #     id="CreateDocumentResolver",
        #     type_name="Mutation",
        #     field_name="createDocument",
        #     request_mapping_template=appsync.MappingTemplate.dynamo_db_put_item(
        #         partition_key=appsync.PrimaryKey.partition("document_id"),
        #         values=appsync.Values.projecting("ctx.args")
        #     ),
        #     response_mapping_template=appsync.MappingTemplate.dynamo_db_result_item()
        # )

        # 4. Resolvers — Session
        session_data_source.create_resolver(
            id="GetDocumentSessionResolver",
            type_name="Query",
            field_name="getDocumentSession",
            # helps protect session-level data when users jump directly to a /chat/:session_id route
            request_mapping_template=appsync.MappingTemplate.from_string("""
            {
                "version": "2017-02-28",
                "operation": "GetItem",
                "key": {
                    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
                }
            }
            """),
            response_mapping_template=appsync.MappingTemplate.from_string("""
            #if(!$ctx.result)
                $util.error("Session not found", "NotFound")
            #end

            #if($ctx.result.user_id != $ctx.identity.claims.sub)
                $util.error("Unauthorized access to session", "Unauthorized")
            #end

            $util.toJson($ctx.result)
            """)
        )

        session_data_source.create_resolver(
            id="ListDocumentSessionsByDocumentResolver",
            type_name="Query",
            field_name="listDocumentSessionsByDocument",
            request_mapping_template=appsync.MappingTemplate.from_string("""
              {
                "version": "2017-02-28",
                "operation": "Query",
                "index": "document_id-index",
                "query": {
                  "expression": "document_id = :docid",
                  "expressionValues": {
                    ":docid": $util.dynamodb.toDynamoDBJson($ctx.args.document_id)
                  }
                }
              }
            """),
            response_mapping_template=appsync.MappingTemplate.dynamo_db_result_list()
        )
        session_data_source.create_resolver(
            id="ListDocumentSessionsByUserByTimeResolver",
            type_name="Query",
            field_name="listDocumentSessionsByUserByTime",
            request_mapping_template=appsync.MappingTemplate.from_string("""
            {
                "version": "2017-02-28",
                "operation": "Query",
                "index": "user_id-created_at-index",
                "query": {
                    "expression": "user_id = :uid",
                    "expressionValues": {
                        ":uid": $util.dynamodb.toDynamoDBJson($ctx.identity.claims.sub)
                    }
                },
                "scanIndexForward": false
            }
            """),
            response_mapping_template=appsync.MappingTemplate.dynamo_db_result_list()
        )
        session_data_source.create_resolver(
            id="CreateDocumentSessionResolver",
            type_name="Mutation",
            field_name="createDocumentSession",
            request_mapping_template=appsync.MappingTemplate.from_string("""
            #set($input = $ctx.args)
            $util.qr($input.put("user_id", $ctx.identity.claims.sub))
            {
                "version": "2017-02-28",
                "operation": "PutItem",
                "key": {
                "id": $util.dynamodb.toDynamoDBJson($input.id)
                },
                "attributeValues": $util.dynamodb.toMapValuesJson($input)
            }
            """),
            response_mapping_template=appsync.MappingTemplate.dynamo_db_result_item()
        )


        # 5. Resolvers — Chat Messages
        message_data_source.create_resolver(
            id="GetChatMessagesBySessionResolver",
            type_name="Query",
            field_name="getChatMessagesBySession",
            request_mapping_template=appsync.MappingTemplate.from_string("""
              {
                "version": "2017-02-28",
                "operation": "Query",
                "index": "document_session_id-index",
                "query": {
                  "expression": "document_session_id = :sid",
                  "expressionValues": {
                    ":sid": $util.dynamodb.toDynamoDBJson($ctx.args.document_session_id)
                  }
                }
              }
            """),
            response_mapping_template=appsync.MappingTemplate.dynamo_db_result_list()
        )

        message_data_source.create_resolver(
            id="CreateChatMessageResolver",
            type_name="Mutation",
            field_name="createChatMessage",
            request_mapping_template=appsync.MappingTemplate.from_string("""
            #set($input = $ctx.args)
            $util.qr($input.put("user_id", $ctx.identity.claims.sub))
            {
                "version": "2017-02-28",
                "operation": "PutItem",
                "key": {
                "id": $util.dynamodb.toDynamoDBJson($input.id)
                },
                "attributeValues": $util.dynamodb.toMapValuesJson($input)
            }
            """),
            response_mapping_template=appsync.MappingTemplate.dynamo_db_result_item()
        )


        # 6. Output
        CfnOutput(self, "GraphQLAPIURL", value=api.graphql_url)
