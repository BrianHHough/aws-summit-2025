from aws_cdk import Stack
from aws_cdk import aws_ecr as ecr
from aws_cdk import aws_eks as eks
from aws_cdk import aws_ec2 as ec2
from aws_cdk import CfnOutput
from constructs import Construct

class EKSServerStack(Stack):
    def __init__(self, scope: Construct, id: str, *, vpc: ec2.IVpc, cluster: eks.Cluster, **kwargs):
        super().__init__(scope, id, **kwargs)

        app_labels = { "app": "fastapi-server" }

        # 1️⃣ Reference ECR repo for FastAPI
        repo = ecr.Repository.from_repository_name(self, "FastAPIRepo", "fastapi-server")
        repo.grant_pull(cluster.role)

        # 2️⃣ Add FastAPI Deployment
        cluster.add_manifest("FastAPIDeployment", {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": "fastapi-server"
            },
            "spec": {
                "replicas": 1,
                "selector": {
                    "matchLabels": app_labels
                },
                "template": {
                    "metadata": {
                        "labels": app_labels
                    },
                    "spec": {
                        "containers": [
                            {
                                "name": "fastapi-server",
                                "image": f"{repo.repository_uri}:latest",
                                "ports": [{ "containerPort": 8000 }]
                            }
                        ]
                    }
                }
            }
        })

        # 3️⃣ Add ClusterIP Service for internal comms
        cluster.add_manifest("FastAPIService", {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": "fastapi-server"
            },
            "spec": {
                "type": "ClusterIP",
                "ports": [
                    {
                        "port": 80,
                        "targetPort": 8000
                    }
                ],
                "selector": app_labels
            }
        })

        # 4️⃣ Output 
        CfnOutput(self, "FastAPIServiceCommand", value="Run `kubectl get svc fastapi-server -o wide` to get internal ClusterIP")
