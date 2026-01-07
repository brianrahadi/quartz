Next: [[2-iam-accounts-aws-orgs]]
### AWS Services
public vs private services in terms of networking
Private services runs on VPC, only connected to VPC can access it.

3 different networks:
- Public internet zone
- AWS public zone (S3)
	- Access using Internet as transit
- AWS private zone (VPC isolated, EC2)
	- Accessed to Internet via Internet Gateway
	- Can be given public IP - one-to-one to internet gateway
	- On-premise can access VPC only if configured via **VPN** or **Direct Connect**

### AWS Global Infrastructure
Two types of deployment:
- AWS Regions - Full Compute, Storage, DB, Ai, Analytics
	- Geographic separation - isolated fault domain
	- Geopolitical separation - different governance
	- Location control - performance
- Edge Locations - Local distribution points
	- smaller but more
	- Faster data transfer

Region referred via:
- Region code (ap-southeast-2)
	- Availability zones (ap-southeast-2a, 2b, 2c) - isolated
	- Connected high speed and low latency
- Region name (Asia Pacific (Sydney))

VPC (Virtual Private Cloud) - way to create private network

Service Resilience
- Globally Resilient - global (IAM, Route 53)
- Region Resilient - multiple availability regions
- AZ Resilient - 1 availability zone
	- Very prone to failure

### Virtual Private Cloud

VPC - service to create private networks inside AWS that other services run on
or service to connect to other cloud platforms when creating multi-cloud deployment

- A VPC = A virtual network inside AWS
- VPC is within **1 account** and **1 region**
- Private and isolated unless decided

2 types:
- Default VPC - max one per region
- Custom VPCs - can have many, require end-to-end configuration, 100% private

VPC Basics
- No way to communicate outside their network
- Region resilient
- VPC CIDR - defines start and range of IP Address (default only one, custom can have many)
- VPC divided into subnets, each into 1 availability zone and cannot overlap

Default VPC
- One per region - editable
- Default VPC CIDR is always 172.31.0.0/16
- /20 subnet in each AZ in the region
- Provided Internet Gateway (IGW), Network ACL, Security Group (SG)
- Subnets have public IPv4 addresses


###  AWS Elastic Compute Cloud (EC2)

AWS EC2 - provides access to virtual machines (instances)

deploys comute:
	- operating system
	- runtime environment
	- database dependencies
	- application interfaces

Key facts:
	- **IAAS** - Provides virtual machines (instances)
	- **Private** service default, uses VPC
	- AZ Resilient
	- Different instance **sizes** and **capabilities**
	- On-demand billing per second
	- Local on-host storage or Elastic block storage (EBS)

Instance lifecycle:
- Running
	- Has CPU, memory, networking, and storage
- Stopped
	- No CPU, memory, networking
	- Still charged for storage
- Terminated (one-off, fully deleted)
	- No charges at all

#### Amazon Machine Image (AMI)

AMI can be used to create or created from EC2 instance
	- Permissions:
		- Public - everyone allowed
		- Owner - Implicit allow
		- Explicit - specific AWS accounts allowed
	- Root volume
	- Block Device Mapping
	- Data volume

EC2 can run any OS.
- Connect to windows using RDP (Remote Desktop Protocol) in port 3389
- Connect to linux using SSH in port 22

SSH Key pair (two parts of same key):
	- Private key (shown once) on local to authenticate
	- Public key on the instance

Private key file format
- .pem for linux or newer windows (OpenSSH)
- .ppk for older widows or PuTTy terminal

#### Demo

AWS EC2 - Amazon Linux - T2 Micro

  
```
cd /Users/brianrahadi/Library/Mobile Documents/com~apple~CloudDocs/PARA/Projects/courses/cantril-saa/ec2
ssh -i "A4L.pem" ec2-user@ec2-52-15-45-222.us-east-2.compute.amazonaws.com  
```

Deletion:
1. Instance
2. Security Groups

### AWS S3

S3
- Global Storage Platform - **regional** based/ resilient
- Public service, unlimited data and multi-user
- Perfect for hosting large amounts of data
- Economical and accessed via UI/ CLI/ API/ HTTP
- Default AWS Storage


S3 types:
- Objects - data that s3 stores
	- Key: koala.jpg -> value: content (0 byte to 5TB)
	- Object has Version ID, Metadata, Access Control, Subresources
- Buckets - container for objects
	- (ap-southeast-2) Never leaves unless configured
	- bucket names are globally unique
	- Has unlimited objects and flat structure
	- Folder in S3 is referred to as prefixes
	- 3-63 character, all lowercase, no underscores
	- Start with lowercase letter or number
	- Cannot be IP formatted
	- Buckets - 100 soft limit, 1000 hard per account

S3 is an object sore, not file or block 
- Cannot mount an S3 bucket (K:/ or /images)
- Great for large scale data storage
- Great for offload
- Input and/or Output to many AWS products

### AWS CloudFormation

Tool to create, update, and delete infrastructure in AWS in consistent and repeatable ways using templates (YAML/ JSON).

``` yaml
AWSTemplateFormatVersion: "version date"

Description:
	String

Metadata:
	template metadata

## mandatory
Resources:
	set of resources
``` 


Template to create EC2 Instance
``` YAML
Resources:
	Instance:
		Type: 'AWS::EC2::Instance'
		Properties:
			ImaeID: !Ref LatestAmiId
			InstanceType: !Ref InstanceType
			KeyName: !Ref KeyName
```

Template + Logical Resource -> Stack -> Physical Resource

Template to create/ update/ delete stack

#### AWS CloudWatch

Product that collects and manages operational data

Products:
- **Metrics** - AWS Products, Apps, on-premises
- **Cloudwatch Logs** - AWS Products, Apps, on-premises
- **CloudWatch Events** - AWS Services and schedules

Cloudwatch can be used from anywhere. 
- Some metrics gained natively (CPU utilization by EC2)
- Cloudwatch Agent - gain metrics outside of AWS in other environments


#### Namespace
Container for monitoring data to make things not messy and separate it

- Regular container (any name)
- AWS/**service** (ex: AWS/EC2)

Contain related metrics
	- time ordered set of data points
	- might receive data from differentiate EC2 instances
		- CPU Utilization Metric
			- datapoint (from many servers) contains timestamp and value
		- Dimension separate datapoints for different **things** or **perspectives** within same metric

#### Alarms
Alarams are created and linked to specific metric and will take action based on the metric

State can be:
	- OK - no action
	- ALARM - SNS or action

### Shared Responsibility Model


![[Pasted image 20231111110516.png]]

Responsibility:
- Customer - Security IN the cloud
	- Customer Data
	- Platform, Application, OS, Network
- AWS - Security OF the cloud
	- Software (compute, storage, database, networking)
	- Hardware/ Infra (Region, availability zones, edge locations)

#### High-Availability vs Fault-Tolerance vs Disaster Recovery

High-Availability - ensure an agreed level of operation performance (uptime) for higher than normal period
	- Designed to be online and provide services as often as possible (with automation)
	- Maximizing system's online time
	- Example:
		- 99.9% (Three 9's) = 8.77 hours yearly downtime
	- Not about preventing user disruption, can still have when we have failure
	- Need more costs and automation

Fault tolerance - property that enables system to continue operating properly in the event of failure of one or more components
	- designed to work through failure with no configuration
	- operating through failure and more expensive than just having high availability 

Disaster recovery - set of policies, tools, and procedures to enable recovery following a disaster (natural/ human).

Pre-planning -> DR Process
	- preplan for everything in advance
	- Having backup premises/ location
		- Local infrastructure having resilience - backup hardware/ cloud
		- Ideally run periodic DR testing

Summary
- High-availability - minimize any outages
- Fault-Tolerance - Operate through faults
- Disaster Recover - Used when these don't work

### Route53

Provides 2 main services:
1. Register Domains
2. Host zones (managed nameservers)

Route53 characteristics:
- Global service - single database
- Globally resilient

Route53 - 1 manage 1 zone (.com, .io, .net)

PIR - org
1. Check top-level domain
2. Create zone file (database) containing DNS info
3. Allocate name services (4 each for 1 zone)
4. Add name service record into zone file (.org TLD)


Hosted zones
- Zone files in AWS
- Hosted on four managed name servers
- Can be public or private (VPCs)
- Stores records (recordsets )


Demo:
1. Hosted zones - create or manage DNS zones within the product
2. Register domain 

#### Name Servers
Nameservers record - allow delegation in DNS

From Root
.com zone (multiple names, delegation happens)
	- (amazon.com) NS pdns1.ultradns.net

RECORDS (how to access the record)
	- amazon.com zone

#### A and AAAA Records
Given DNS records, map Host to IP
	- Map A record to ipv4
	- Map AAAA record to ipv6

Solution architect generally make two record same name (A and AAAA)


#### CNAME Records
canonical name let you create equivalent of DNS shortcuts (Host to Host)

A server map to ipV4

A record server map the 3 CNAMEs to the single A server (not the ip):
	- ftp
	- mail
	- www

Resolve to same ip address and reduce overhead

#### MX Records

Used to know which server to pass the email to

MX records:
- priority and value
	- MX 10 mail
	- MX 20 mail.other.domain (FQDN)

How MX records used:
1. email server looks at 2 address on the mail (focuses on domain)
2. Uses MX query using DNS on google.com
3. Check priority value (lower is higher priority)
	- lower priority used if others are not working
4. Uses this to connect mail server using SMTP (protocol for mail)

MX records - how server can find mail server for specific domain

#### TXT Records
Allow you to add arbitrary text to domain to provide additional functionality
	- to prove domain ownership
		- System might ask us to add text record so external email system would query and matches it

#### TTL - Time To Live
TTL value - something that can be set in DNS 

![[Pasted image 20231111131854.png]]
1. Client connecting to amazon.com
2. Queries DNS using resolver server
3. Resolver server talks to DNS root that points to dot com
4. Resolver queries those servers dot com
5. Resolver access amazon.com and has record for WWW and TTL (authoritative answer - single source of truth) 
	1. results stored in resolver server
	2. If another client query same thing, get WWW TTL 3600. It is quicker but non-authoritative. Normally do not change, but can be incorrect.

Next: [[2-iam-accounts-aws-orgs]]