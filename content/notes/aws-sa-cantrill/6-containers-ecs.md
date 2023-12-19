
## Intro to Containers

Virtualization problem - heavy usage because operating system is duplicated on each application that is hosted on 1 host.1
- Before: App with OS  M---1 AWS Hypervisor + AWS EC2 Host

Solution: Containerization
- After: App M---1 Container Engine + Host OS + Host Hardware

Containerization - mostly consumption by the application and its runtime
- Do not need full OS for each app

### Image anatomy
Container - running copy of docker image

Docker image made up of multiple independent layers - not monolithic
- Used to run container

**Dockerfile** - used to build docker images. Each step creates fs layers.
- Images are created from base image or scratch
- Image contain readonly layers, changes layered onto image using **differential** architecture

Layers:
1. operating system set up
2. app run
3. filesystem 

Docker container is docker image with read write layer to run it
- Identical layers apart from R/W layer, which makes shared fs layers efficient

![[Pasted image 20231218192408.png]]

Container images deployed to docker host, service running container engine.
- Container is single thing that can generate
- Dockerhub to get or download your own

Container key concepts:
- Dockerfiles to build images
- Portable - self-contained, always run as expected
- Lightweight - parent os used and shared fs layers
- Only runs app and environment it needs
- Provides as much isolation as VMs
- Ports are exposed to host
- App stacks can be multi-container

### DEMO Docker Image
https://learn-cantrill-labs.s3.amazonaws.com/awscoursedemos/0030-aws-associate-ec2docker/lesson_commands_AL2023.txt

Hosting docker image from EC2 instance
1. CloudFormation
2. Connect to EC2 Instance
3. `sudo dnf install docker`
4. `sudo service docker start`
5. `docker ps`
	- Error, no permission
6. `sudo usermod -a -G docker ec2-user`
	- Allow local user to interact with docker engine
7. Reconnect
8. `sudo su - ec2-user`
	- Logins to ec2-user without ssh key
9. `docker ps`
10. `ls`
11. `cd container`
12. `ls -la`
13. `docker build -t containerofcats .`
	- Based on current docker file
	- Each line generally generates new fs layer
14. `docker images --filter reference=containerofcats`
	- list of imagew
15. `docker run -t -i -p 80:80 containerofcats`
16. Open new tab based on public ipv4 address

This runs docker container from EC2 instance. Later, can use ECS to host docker image

How to push image into dockerhub:
1. `docker login --username=YOUR_USER`
2. `docker images` - see all containers
	- copy image id of `containerofcats`
3. `docker tag IMAGE_ID YOUR_USER/containerofcats`
	- prepare to be pushed to docker hub
4. `docker push YOUR_USER/containerofcats:latest`

## Elastic Container Service (ECS) Concepts
ECS - run containers on AWS fully/ partially-managed services, reduces admin overhead.
- ECS is for container like EC2 for VM

ECS uses cluster that run on 2 modes:
	1. EC2 - uses EC2 as container host
	2. Fargate - serverless way to run docker containers

ECS Cluster - where containers run from
- ECR (Elastic Container Registry) to manage docker container images

Task on ECS - container as a whole
- Define containers inside
- Task - store resources used by task (CPU, Memory, networking, compatibility).
	- Also task role - IAM role that the task can assume for temporary credentials. **Best** way to give container within ECS to run AWS service.
- Task can contain 1 to M containers

Service definition - defines service
- How we want task to scale, copies to run, can have multiple tasks

Concepts:
- Container definition - image and ports
	- Which image to use
	- Which port to expose
- Task definition - securiy (taks role), container(s), resources
- Task role - IAM role which the task assumes
- Service - how many copies, HA, restarts

## ECS Cluster Mode
Modes:
1. EC2 - less admin overhead
2. Fargate - even lesser admin overhead

Cluster mode defines many, but main idea is how much of an admin overhead is AWS or customer managed


ECS management components:
- Scheduling
- Orcehstrating
- Cluster management
- Engine placement
^ exist in both modes.

### ECS - EC2 Mode

EC2 mode - EC2 instance used to run containers, specify initial size

ECS Cluster is created within VPC inside AWS account
- benefits from multiple AZ
- handled by Auto Scaling Group (ASG), add or remove instance as needed
- uses container registry - way container images are stored
- task and services use images from registry and deployed on container host on form of containers handled by ECS

### ECS - Fargate Mode
Main difference on how container is actually hosted - on Fargate shared infrastructure

Gain access to shared pool (like EC2 on shared HW):
- Use same task and services definition allocated to shared fargate platform
- Still have cluster that uses VPC that operates on AZ
- ECS task that runs on shared infrastructure and on networking, injected to VPC - Elastic Network Interface
	- Has IP address within VPC
	- Works just like any other VPC resource
- Only pays for used containers based on consumed resources

### EC2 vs ECS (EC2) vs Fargate

- If use containers, use ECS
- If large workload and price conscious, EC2 mode to use its spot and reserved mode
	- More admin overhead - scaling, sizing, correcting faults
- If large workload and overhead conscious, Fargate
- For small/ burst workloads - Fargate
	- Fully EC2 host running on inconsistent workload does not make sense
- For batch/ periodic workloads - Fargate

### DEMO - deploying containers using Fargate

1. ECS > Create Cluster > Select all subnets
2. Create new task definition
	1. Image URI `docker.io/USERNAME/REPOSITORY`
3. Create cluster with the new task
	1. Use Launch type

Deleting:
1. Deregister task
2. Delete cluster


## Elastic Container Registry (ECR)
ECR manages container image registery service
- Dockerhub for AWS
- Each AWS account has public and private registry
	- public means anyone can have readonly access, unlike private
- Each registry can have many repositories
- Each repository can contain many images
- images can have several tags

ECR:
- Integrated with IAM for permissions
- Image scanning, basic, and enhanced
- NR real time metrics => CW (auth, push, pull)
- API Actions => CloudTrail
- Events => EventBridge
- Replication. Cross-region and cross-account

## Kubernetes 101
Kubernetes - open-source container orchestration system to run container in a reliable and scalable way.
- Automate deployment and scaling of containerized system
- Docker with robots

Cluster structure:
1. Highly available cluster of compute resources organized to work as one unit
2. Cluster **Control Plane** to manage cluster, scheduling, app, scaling, and deploying
3. Cluster nodes - VM or physical server as worker in the cluster
	1. **Containerd** - handling container operations
	2. **kubelet** - agent to interact with control plane
4. Kubernetes API for communication between **control plane** and **kubelet agent**

Cluster detail:
1. Has container runtime and kubelet
3. Has 1 to many nodes
4. Has pods - smallest units of computing in kubernetes shared storage and networking. Usually non-permanent.
5. **kube-proxy** - network proxy on each node to coordinate networking within control plane
	- help impleemnt service

Control plane:
1. **kube-apiserver** - front-end for kubernetes control plane. 
	- What nodes and cluster elements interact with.
	- Horizontally scaled for HA and performance
2. **etcd** - provides highly available key-value store within cluster
	- main backing store for cluster
3. **kube-scheduler** - assigns nodes to pods with node based on resource and constraints
4. **cloud-controlled-manager** - provides cloud specific control logic
	- allows linking kubernetes with cloud provider APIs
5. **kube-controller-manager** - control processes
	1. Node controller
	2. Job controller
	3. Endpoint controller
	4. Service account and token

Summary:
- **Cluster** - deployment of kubernetes, management, orchestration
- **Node** - resources; pods placed on nodes to run
- **Pod** - 1+ containers; smallest unit in k8s; usually 1-to-1 container-pod.
- **Service** - abstaction; service on 1 or more pods
- **Job** - ad-hoc for one or mode pods
- **Ingress** - exposes way into service
	- Ingress => Routing => Service => 1 + Pods
- **Ingress Controller** - provides ingress
	- AWS LB controller uses ALB/ NLB
- **Persistent Storage** - permanent volume for beyond 1+ pods

## Elastic Kubernetes Service 101 (EKS)

EKS - AWS managed kubernetes
- Can be run on AWS, Outposts, EKS anywhere, EKS Distro
- The control plane scales and runs on multiple AZs
- Integrates with AWS services (ECR, ELB, IAM, VPC)
- EKS Cluster = EKS control plane and EKS nodes
- **etcd** distributed across multiple AZs
- Storage providers include EBS, EFS, FSx Lustre

Nodes - self managed, managed node groups, or fargate pods. Decided based on requirements.
- Windows, GPU, Inferentia

![[Pasted image 20231219082806.png]]
- AWS Managed VPC - Control plane managed and multi AZs
	- EKS Admin via public endpoint
- Control Plane ENIs injected into Customer VPC
- Customer VPC into Service Consumer


