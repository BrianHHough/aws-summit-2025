from aws_cdk import Stack, CfnOutput
from aws_cdk import aws_cognito as cognito
from constructs import Construct

class CognitoStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        self.user_pool = cognito.UserPool(self, "UserPool",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),  # ✅ verify email automatically
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,  # ✅ forgot password via email
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=True)
            ),
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_digits=True,
                require_uppercase=True,
                require_symbols=False
            )
        )

        # self.user_pool_client = self.user_pool.add_client("UserPoolClient",
        self.user_pool_client = cognito.UserPoolClient(self, "TalkWithDocsClient2",
            user_pool=self.user_pool,
            generate_secret=False, # True = Required for auth code flow / OAuth 2.0
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True,                # ✅ For AppSync console login + Next-Auth
            ),
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(
                    authorization_code_grant=True,
                    implicit_code_grant=False
                ),
                scopes=[
                    cognito.OAuthScope.EMAIL,
                    cognito.OAuthScope.OPENID,
                    cognito.OAuthScope.PROFILE,
                    cognito.OAuthScope.COGNITO_ADMIN,
                    cognito.OAuthScope.PHONE
                ],
                callback_urls=[
                    "http://localhost:3000/api/auth/callback/cognito",
                    "https://drw40d51ah01b.cloudfront.net/api/auth/callback/cognito"
                ],
                logout_urls=[
                    "http://localhost:3000",
                    "https://drw40d51ah01b.cloudfront.net"
                ]
            )
        )

        # Output for .env
        CfnOutput(self, "UserPoolId", value=self.user_pool.user_pool_id)
        CfnOutput(self, "UserPoolClientId", value=self.user_pool_client.user_pool_client_id)
