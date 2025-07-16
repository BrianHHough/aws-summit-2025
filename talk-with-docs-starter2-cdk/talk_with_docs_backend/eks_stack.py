# talk_with_docs_backend/eks_stack.py

from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_eks as eks,
    aws_ecr as ecr,
    # aws_ssm as ssm,
    CfnOutput,
    Duration,
)
from constructs import Construct
from aws_cdk.lambda_layer_kubectl_v27 import KubectlV27Layer
from aws_cdk.aws_eks import AwsAuth
from aws_cdk.aws_iam import ArnPrincipal
from aws_cdk.aws_iam import Role, ManagedPolicy, ArnPrincipal, IRole

from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env.local") # Load variables from .env.local into os.environ

deployer_arn = os.getenv("CDK_DEPLOYER_ARN")

class EKSStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)

        # 1️⃣ VPC
        vpc = ec2.Vpc(self, "TalkWithDocsVPC", max_azs=2)

        # 2️⃣ EKS Cluster
        cluster = eks.Cluster(
            self, "TalkWithDocsCluster",
            vpc=vpc,
            version=eks.KubernetesVersion.V1_27,
            default_capacity=2,
            kubectl_layer=KubectlV27Layer(self, "KubectlLayer")
        )

        if not deployer_arn:
            raise ValueError("CDK_DEPLOYER_ARN is not set in .env.local")

        # Grant the deployer RBAC access to the EKS cluster
        # print(f"Adding IAM role to EKS aws-auth: {deployer_arn}")
        
        # Add the IAM role to aws-auth ConfigMap
        iam_role = Role.from_role_arn(
            self, "DeployerRole",
            deployer_arn,
            mutable=False
        )
        cluster.aws_auth.add_role_mapping(
            iam_role,
            groups=["system:masters"]
        )
        
        # ======== If have a CDK IUser object ======== #
        # cluster.aws_auth.add_user_mapping(
        #     user=deployer_arn,
        #     groups=["system:masters"]
        # )

        # 3️⃣ Reference to ECR Repo
        repo = ecr.Repository.from_repository_name(self, "AppRepo", "talk-with-docs")
        repo.grant_pull(cluster.role)

        # 4️⃣ Kubernetes Labels
        app_labels = { "app": "talk-with-docs" }

        # 5️⃣ Deployment Manifest
        cluster.add_manifest("AppDeployment", {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": { "name": "talk-with-docs" },
            "spec": {
                "replicas": 2,
                "selector": { "matchLabels": app_labels },
                "template": {
                    "metadata": { "labels": app_labels },
                    "spec": {
                        "containers": [{
                            "name": "talk-with-docs",
                            "image": f"{repo.repository_uri}:latest",
                            "ports": [{ "containerPort": 3000 }],
                            "resources": {
                                "limits": { "cpu": "500m", "memory": "512Mi" },
                                "requests": { "cpu": "250m", "memory": "256Mi" }
                            },
                            "readinessProbe": {
                                "httpGet": { "path": "/", "port": 3000 },
                                "initialDelaySeconds": 5,
                                "periodSeconds": 10
                            },
                            "livenessProbe": {
                                "httpGet": { "path": "/", "port": 3000 },
                                "initialDelaySeconds": 15,
                                "periodSeconds": 20
                            }
                        }]
                    }
                }
            }
        })

        # 6️⃣ LoadBalancer Service
        service = cluster.add_manifest("AppService", {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": "talk-with-docs",
                "annotations": {
                    "service.k8s.aws/load-balancer-type": "external"
                }
            },
            "spec": {
                "type": "LoadBalancer",
                "ports": [{ "port": 80, "targetPort": 3000 }],
                "selector": app_labels
            }
        })

        # 7️⃣ Output (placeholder) + SSM Parameter (created after deploy manually or via post-script)
        CfnOutput(self, "EKSAppServiceInfo", value="Run `kubectl get svc talk-with-docs -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'` after deploy.")

        # Expose VPC and Cluster as attributes
        self.vpc = vpc
        self.cluster = cluster

        # Helpful outputs for CLI/CDK debugging
        CfnOutput(self, "EKSClusterName", value=cluster.cluster_name)
        CfnOutput(self, "EKSClusterEndpoint", value=cluster.cluster_endpoint)
        CfnOutput(self, "EKSVpcId", value=vpc.vpc_id)

        # 8️⃣ Optional: Store placeholder param to avoid breaking CloudFrontStack
        # Note - this was moved to cloudffront_stack.py
        # We'll use the output here from eks_stack.py's ELB to then put that into .env.local
        # ssm.StringParameter(self, "AppLoadBalancerDNS",
        #     parameter_name="/talk-with-docs/eks/loadbalancer_dns",
        #     string_value="TBD_AFTER_DEPLOY"
        # )
