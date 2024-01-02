## Bootstraping EC2 using User Data

Bootstrapping - process to allow system to self-configure. It allows EC2 build automation.

User Data - accessed via meta-data IP
- http://169.254.169.254/latest/user-data
- Anything in User Data is executed by instance OS only on launch time
- EC2 does not interpret, just passes from OS

Architecture:
1. AMI launch instance
2. EC2 provides userdata to instance
3. Instance execute user data, may have bad config
4. Instance ready for service

Key points:
- Opaque to EC2, just block of data
- Not secure
- Limited to 16 KB in size
- Modifiable when instance stopped
- Executed only one at launch

Boot-time-to-service-time - how quickly launched instance ready for service
- Time for AWS to provision + software update


## Enhanced Bootstrapping with CFN-Init

CFN-INIT - powerful desired-state-like configuration engine that is part of CFN products
- Previous, pass base 64-encoded data to OS via shell script
- Using CFN-init helper script (configuration management system) auto installed on EC2 OS
- Procedural (User data) vs Desired State (cfn-init)
	- Kinda like imperative procedural vs declarative functional programming
- Manages packages, groups, users, sources, files, commands, and services
- Provided with directives via Metadata and AWS::CloudFormation::Init on CFN resource

Architecture:
- Starts with CloudFormation template that will make a stack that launches EC2 instance
``` yaml
	EC2Instance:
		Type:AWS::EC2::Instance
		Metadata:
			AWS::CloudFormation::Init:
				configSets: ...
				install_cfn: ...
				software_instal: ...
				install_wordpress: ...
```
- CFN Init command passed from User Data to EC2 Instance
- CFN Init also works with stack updates. If metadata changes, stack launched again.


### CreationPolicy and Signals:

Previously, Template > Stack > Instance
	- Problem: Do not know if resource completion succeed. CF will not know regardless how the config is
	- Fine if it is blank EC2 instance, but problem if it has a bootstrapping process

Solution: Creation Policy
``` yaml
EC2INstance:
	Type: AWS::EC2::Instance
	CreationPolicy:
		ResourceSignal:
			Timeout: PT15M
```

This will create stack that launches instance and has 15 timeout signals
- CF waits for resource signal
- If output is not okay, then `cfn-signal` will report
- `/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackId} --resource EC2Instance --region ${Aws::Region}`

## EC2 Instance Roles

EC2 Instance Roles - Roles that instances can assume with granted permissions

![[Pasted image 20231220175927.png]]
Architecture:
- IAM Role with attached permission policy
- IAM Role wrapped with InstanceProfile
	- InstanceProfile - allow permission to get inside instance, connector
- Profile attached to instance
	- Delivered temp credentials via instance metadata

So, EC2 instance roles:
- Credentials inside meta-data
	- Includes IAM/ Security-credentials/ role-name
- Automatically rotated - always valid
		- Be careful to cache, check metadata before expire
- Always use roles rather than access keys to instance
- CLI tools use role credentials automatically

## AWS SSM Parameter Store

AWS System Manager Parameter Store - AWS service to store various bits of systems config in resilient, secure, and scalable way

Parameter store:
- Storage for configuration and secrets
- Use CLI tooling on EC2 instance to get access to service
- Types: String, StringList, SecureList
- Store: License codes, DB strings, full configs
- Hierarchal storing and versioning
- Plaintext and ciphertext
	- integrates with KMS
- Public parameters - Latest AMIs per region

Architecture:
- Entity access SSM integrated with IAM
	- Entity - Anything that is AWS service or access AWS public endpoints
- Encrypted parameters need KMS after

Structure:
- myDBpassword
- /wordpress/
	- DBUser (/wordpress/DBUser)
- Change can create events

```

aws ssm get-parameters --names /rate-my-lizard/db-string

aws ssm get-parameters-by-path --path /my-cat-app/

aws ssm get-parameters-by-path --path /my-cat-app/ --with-decryption
```

## System and Application Logging on EC2

Background: CloudWatch is for metrics and CW logs is for logging. These cannot capture data inside instance.

Solution: Need CW Agent to capture this data with config and permissions

Steps Architecture:
1. Install CW Agent into EC2 instance
2. Set up agent config
3. Set up IAM role with CW Logs permissions
4. Instance injected log group into CW logs
	- `var/log/httpd/error_log`

Can use CloudFormatin for all these steps

CW Agent how to store config into logs:
- Use Parameter Store to store agent configuration as param


## EC2 Placement Groups
Normally, physical location is selected within AWS.
EC2 Placement Group lets you influence where it is placed.

Types:
- Cluster - pack instances close together
- Spread - keep instances separated
- Partition - group of instances spread apart


### Cluster Placement Group
Cluster - Highest level of performance
- Instance in same rack, sometimes same host
- All members have direct connections to each other
- 10 Gbps p/stream, normally 5Gbps

Facts:
- Cannot span AZs - one AZ locked when launching first instance
- Can span VPC peers - impacts performance
- Requires supported instance type
- Use same type of instance (optional)
- Launch at same time (optional, but v recommended)
- 10Gbps single stream performance
- Use case: Performance - fast speed, low latency

### Spread Placement Group
Spread - Highest level of availability
- Provides infra isolation
- Each instance runs from different rack
- Each rack has its own network and power source
- 7 Instances per AZ hard limit
- No support for dedicated instances or hosts
- Use case: Small number of critical instances that needs to be separated

### Partition Placement Group
Partition - When have > 7 instances per AZ, but need to be separated
- Divided into partitions, max 7 per AZ
- Each partition has its own racks, no sharing between partition
- Each instance can be placed in specific partition
- Great for topology aware app
- HDFS, HBase, and Cassandra
- Contain impact of failure

## EC2 Dedicated Hosts
EC2 Host dedicated to you in its entirety
- Specific family, a1, c5, m5
- No instance charges, pay for the host
- On demand and reserved options available
- Host hardware has physical sockets and cores

Host is dedicated for specific family and size
- Ex: A1 - 1 socket and 16 cores
	- 16 Med or 8 L or 4 XL or 2 - 2XL or 1 - 4XL

Nitro host  - can contain mix and match instance with different size
- R5 - 2 Socket and 48 cores
- 12 XL + 4 2XL + 4xL or any possible

Limitations:
- AMI Limits
- Amazon RDS instances
- Placement groups for dedicated hosts
- Host can be shared with other ORG accounts...RAM

## Enhanced Networking

Enhanced Networking - feature to improve overall performance of EC2 Instance networking
- Uses SR-IOV - NIC is virtualization aware
	- SingleRoot-IOVirtualization 


- Allows host to be virtualization aware
- Instead of presented as 1 physical network interface cards that needs to be managed, use multiple logical cards per physical card
- Physical NIC handle process end-to-end without consuming a lot of host CPU
- No charge - available on most EC2 types

Benefits:
- Higher IO
- Lower Host CPU Usage
- More bandwidth
- Higher packers-per-second (PPS)
- Consistent lower latency

## EBS Optimized Instance
EBS - block storage over network
- Historically, network shared between data and EBS
- EBS optimized - dedicated capacity for EBS
- Most instances support and enabled by default
- Some support, but enabling costs extra
