# ================== To update the DNS ==================== #
# cdk deploy CloudFrontStack --context updateDns=true
from aws_cdk import (
    Stack,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_ssm as ssm,
    CfnOutput,
)
from constructs import Construct

class CloudFrontStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # === Context flag: should we update DNS in SSM?
        update_dns = self.node.try_get_context("updateDns") == "true"
        param_name = "/talk-with-docs/eks/loadbalancer_dns"

        # === Optional override passed in via environment variable
        override_dns = self.node.try_get_context("overrideDns")

        # === Determine which value to use
        if override_dns:
            lb_dns = override_dns
        else:
            lb_dns = ssm.StringParameter.value_for_string_parameter(
                self, param_name
            )

        # === Update parameter only if context flag is true
        if update_dns and override_dns:
            ssm.StringParameter(self, "UpdatedAppLoadBalancerDNS",
                parameter_name=param_name,
                string_value=override_dns,
                description="Optional override set from context.",
                overwrite=True
            )

        # === Create the CloudFront Distribution
        cloudfront.Distribution(self, "TalkWithDocsCDN",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.HttpOrigin(
                    domain_name=lb_dns,
                    protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            )
        )

        CfnOutput(self, "CloudFrontOriginDNS", value=lb_dns)
