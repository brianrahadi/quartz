Prev: [[4-virtual-private-cloud]] \
## Virtualization 101
Process of running more than 1 OS on piece of hardware/ server

Without virtualization, server:
1. CPU & Mem + Network + Devices
2. Operating System (Linux)
3. Applications --- system call ---> Kernel

Server has OS that parts of it run in privileged mode - access to kernel to interact w/ hardware

With emulated virtualization, each server can run multiple OS that runs application each
- Has host Operating System between CPU and VM
- Each OS and app wrapped as Virtual Machine (VM
- Performs binary translation to do privileged operations with each VM

Con: Binary translation - best part (no modification), but really slow

With para-virtualization, guest OS still run in same VM with virtual resources.
- But only run on OS that can be modified to make user calls
- Each VM do hypercalls to Host OS/ hypervisor
	- Source code of each OS modified
	- But still set of software processes to trick OS

With hardware-assisted virtualization, hardware becomes virtualization aware
- CPU aware virtualization exists
- VM calls to hardware but operation still executed on hypervisor
- Consumes a lot of cpu cycles on the host

Last with SR-IOV (single route - IO virtualization), allows network card to be several mini cards. 
- Each guest OS can use its card
- In EC2 called Enhanced networking - consistent low latency at high load

## EC2 Architecture

- EC2 instances are virtual machines (os + resources)
- EC2 instances run on EC2 hosts
- Shared hosts or dedicated hosts
- AZ resilient (AZ fail -> host fail -> instance fail)
- Each EC2 host run in single AZ
	- Have local hardware and storage (instance store)
	- Have networking (storage networking or data networking)
	- ec2 instance with subnet has primary elastic network interface mapped to ec2 host data networking
- Can use remote storage, Elastic Block Store (AZ resilient) only within same AZ
	- EBS lets you allocate volume to instances within same AZ

Instances:
- Instance runs on specific host. Detached if:
	- Host fails or maintenance
	- Instance stopped and started (not restart), relocated to another host within same AZ
- Instance within host share resources
- Generally, instances with same type and generation share hosts

EC2 good for:
- Traditional OS + App compute
- Long-running compute
	- Many other services has time limit
- Server-style applications
- Services that need burst or steady-state load
- Monolithic app stack
- Migrated app workloads or disaster recovery

## EC2 Instance Types

### Settings:
- Raw CPU, Memory, Local Storage Capacity, and Type
- Resource ratios
- Storage and data network bandwidth
- System architecture/ vendor
- Additional features and capabilities

### EC2 Categories:
- **General purpose** - default - diverse workloads, equal resource ratio
- **Compute optimized** - media processing, HPC, Scientific modelling, gaming, ML
	- Access to latest high-performance CPUs
- **Memory optimized** - processing large in-memory datasets, database
- **Accelerated computing** - Hardware GPU, field programmable gate arrays (FPGAs)
- **Storage optimized** - Sequential and Random IO - scale-out transactional dbs, data warehouses, elastic search

### Decoding EC2 Types:
Instance type: R5dn.8xlarge
- Family: R
- Generation: 5
	- Usually latest, best price-to-performance
- Additional capabilities (collection of letters): dn
	- a: AMD CPU
	- n: network optimized
- Size: 8xlarge

https://aws.amazon.com/ec2/instance-types/

### DEMO EC2 SSH vs EC2 Instance Connect

Connect EC2 instance using local SSH client needs key pairs.
- Using local ssh needs key - not scalable if every devs need access
- EC2 instance connect - connection to AWS then to EC2 instance
	- Security grop of EC2 > inbound rules > SSH change to IP of EC2 instance connect

## Storage Refresher
- Direct (local) attached storage - storage on EC2 host - Instance store
	- Fast but easily lost
- Network attached storage - volumes delivered over network (EBS)
	- Highly resilient and can survive
- Ephemeral storage - temp storage
- Persistent storage - permanent storage - lives on past lifetime of instance

Main categories:
- Block storage - volume presented to OS as collection of blocks
	- Mountable, bootable, unstructured
	- Presented as file system by OS
	- Used for storage to boot from
- File storage - presented as file share, has structure
	- Mountable, not bootable
- Object storage - collection of objects, flat
	- Not mountable, not bootable
	- Large WR access, infinitely scalable

Storage performance:
- IO (block) size - size of wheels
	- 16K, 64K, 1MEG
- IOPS - speed of engine
	- 1 second
- Throughput - end car speed
	-  XX MB/s

Usually `IO x IOPS = Throughput`
- `16 KB x 100IOPS = 1.6MB/s`

## Elastic Block Storage
Block storage - raw disk allocations (volume) 
- encryptable using KMS
	- instances see block device and create file system on device
- Storage is provisioned in one AZ (**AZ Resilient**)
- Attached to 1 EC2 instance over storage network
	- detached and reattached, not lifecycle linked to 1 instance ... persistent
- Snapshot/ backupped into S3 and create volume from snapshot
	- Can be used to migrate between AZs
- Provision different physical storage types, sizes, or performance profiles
- Billed based on GB-month (and some cases performance)

![[Pasted image 20231213223747.png]]

### EBS Volume Types
Volume types:
1. General purpose
	1. GP2
	2. GP3
2. Provisioned IOPS SSD
	1. IO1
	2. IO2
	3. Block express
3. Hard Disk Drive
	1. st1 - throughput optimized HDD
	2. st2 - cold HDD

#### General Purpose SSD - GP2 - by EBS
- Simple but initially harder
- Volume can be between 1GB or 16TB
- An IO Credit is 16 KB
	- IOPS assume 16KB
	- 1 IOPS = 1 IO/ seconds
- IO 'credit' bucket capacity - 5.4M IO Credits.
	- Fills at rate of baseline performance
- Bucket fills with min 100 IO credits per second
	- Beyond 100 minimum the bucket fills with 3 IO credits / second / GB volume size
	- Burst up to 3,000 IPS by depleting bucket - Burst rate
- Up to max for GP2 of 16,000 IO credits / second
	- Volumes larger than 1,000 GB - baseline is above burst and credit system is not used

GP2 good for:
- Boot volumes
- Low-latency interactive apps
- Dev and test environment
- May be replaced by GP3 in the future (cheaper)

#### General Purpose SSD - GP3 - by EBS

**Standard** - 3,000 IPS and 125 MB/s

- Base price - 20% cheaper than GP2
- Extra cost for up to 16,000 IOPS/ 1,000 MB/s
- 4x Faster Max throughput vs GP2 
	- 1,000 MB/s vs 250 MB/s

GP3 Good for (same as GP2 most cases):
	- Virtual desktops
	- medium-sized single instance dbs

GP3 does not scale on size
- Not as flexible as GP2
- Additional extra IOPS comes with extra cost
- Even with the extra cost, still more economical

#### Provisioned IOPS

- Up to 64,000 IOPS per volume (4x GP2/3)
	- Up to 256,000 for IO 2 block express
- Up to 1,000 MB/s throughput
	- Up to 4,000 MB/s throughput for IO 2 block express
- Consistent low latency and jitter

- With IO 1/2/Block express, IOPS can be adjusted independently of size
	- 4 GB-16TB IO 1/2/BlockExpress

Max IOPS:
- io1 - 50IOPS/ GB
- io2 - 500 IOPS/ GB
- BE - 1000 IOPS/ GB

Per instance performance:
- io1 - 260,000 IOPS and 7,500MB/s
- io2 - 160,000 IOPS and 4,750 MB/s
- io2 BE - 260,000 IOPS and 7,500 MB/s
- Considering multiple volume combined and max for per EC2

Good for:
	- High performance
	- Latency sensitive workloads
	- IO-intensive NOSQL & RDBS
	- Low volume and super high performance

#### Hard Disk Drive
HHD-based - moving bits and platters which spin little robot arms as head

Types:
1. st1 - throughput optimized HDD
	- Cheap
	- Designed for written sequential, not random access for performance
	- Ranges from 125 GB - 16 TB
	- Max 500 IOPS/ 500 MB/s
		- 1 IO = 1MB
	- Base - 40MB/s/TB
	- Burst - 250MB/s/TB
	- Good for frequent access throughput and sequential
	- Example: Big data, data warehouse, log processing
1. st2 - cold HDD
	- Even cheaper
	- Ranges from 125 GB - 16 TB (same)
	- Max 250 IOPS - 250 MB/s
		- 1 IO = 1 MB
	- Base - 12MB/s/TB
	- Burst - 80MB/s/TB
	- Lowest cost HDD volume designed for less frequently accessed workloads
	- Good for colder data requiring fewer scans per day

### Instance Store Volumes

Architecture:
- Block storage devices
- Physically connected to 1 EC2 Host 
- Instance on the host can access
	- Thus, Highest storage performance in AWS
- Included in instance price
- Attached at launch time
- Each instance can connect to volume
- Only temporary ephemeral database

Benefits:
- Performance - higher throughput and IOPS vs EBS
	- D3 = 4.6 GB/s throughput
	- I3 = 16 GB/s of sequential throughput

Powerups:
- Local on EC2 Host
- Add at launch only
- Lost on instance move, resize, or hardware failure
- Highest data performance within AWS
- Pay for it anyway as it's included in instance price
- **TEMPORARY**

### EBS vs EC2 Instance Store

EBS wins:
- Persistence
- Resilience
- Storage isolated from instance lifecycle

Instance store wins:
- Super high performance needs
- Cheaper price

Depends:
- Resilience with app in-built replication
- High performance needs


**Specifics**:
- Cheap - ST1 or SC1
- Throughput - ST1
- Boot .. Not ST1 or SC1

**IOPS**:
- GP2/3 - max 16,000 IOPS
- IO1/2 - max 64,000 IOPS (x4 E256,000)
- RAID0 + EBS - max 260,000 IOPS (io1/2-BE/GP2/3)
- Instance store -  more than 260,000 IOPS
	- NOT PERSISTENT

### EBS Snapshots
Snapshots are incremental volume copies to S3
- First - full copy of 'data' on the volume
	- EBS performance not affected, just takes time
- Next ones - incremental
	- Faster
- Usually, losing incremental backup will ruin the next ones
	- EBS Snapshot is smart and can modify next ones

Snapshot can be used to create volumes, even in other region

Snapshots performance:
- New EBS volume = full performance immediately
- Snaps restore lazily so fetched gradually
	- Requested block can be fetched immediatelly
	- Force read of all data immediatelly
- Fast snapshor restore (FSR) - immediate restore
	- Up to 50 snaps per region. Set on the snap and AZ

Snapshots consumption and billing:
- Gigabyte-month
- Counts used data, not allocated data
- Incremental

### DEMO - EBS Volumes

Checking how EBS connected to EC2 instance:
1. Use cloud formation stack to create all the used
	- 3 EC2 instance connected each with EBS gp3
2. Create EBS gp3 and `attach volume`
	- Can only attach ec2 instance within same AZ
3. Connect to the attached ec2 instance
4. `lsblk` - list block devices
5. `sudo file -s /dev/xbdf` - check files in block devices
	1. None
6. `sudo mkfs -t xfs /dev/xvdf` - create filesystem on EBS volume
7. `sudo file -s /dev/xbdf` again
	1. See the filesystems
8. `sudo mkdir /ebstest` - create directory
9. `sudo mount /dev/xvdf /ebstest` - mount the folder into EBS volume
10. `df -k` - check that the dir is mounted
11. `cd /ebstest` - go to the dir
12. `sudo nano test.txt` - write things
13. `ls -la`
14. `sudo reboot` - disconnect session


Checking that it is persistent and bootable:
1. reconnect
2. `df -k` - see that it is not mounted again with the `/dev/xbdf`
	- Because we do manual mount
3. `sudo blkid`
4. `sudo nano /etc/fstab` - config of which file is mounted
5. add `UUID=<UUID-/dev/xvdf> /ebstest xfs defaults,nofail`
6. `sudo mount -n` - force mount process
	- Without this, mount automatically when restarted
7. `df -k` - will see `/dev/xvdf` mounted
8. `cd/ebstest && ls -la` - see that original file is persisted

Stopping and reattaching
1. stop instance
2. detach the volume
	- Shows that it is completely separate from EC2 instance
3. Attach the volume to other instance within same AZ

Connect and mount again:
1. `df -k` - see no EBS
2. `lsblk` - see `xvdf`
3. `sudo file -s /dev/xvdf` - create
4. `sudo mkdir /ebstest`
5. `sudo mount /dev/xvdf /ebstest`
6. `cd /ebstest`
7. `ls -la` - see it has the same contents
8. stop and detach again

Connecting EBS with EC2 on other region:
1. Cannot reattach with same EBS
	1. Need to create snapshot and make EBS volume on other region from that snapshot
2. Right click EBS volume and `Create Snapshot`
3. Right click snapshot and `Create volume fron snapshot`
	- Can change volume type, size, and AZ
4. R click created created snapshot and `Attach volume`
5. do same `Connect and mount again`

Cleaning up
1. Delete snapshot
2. Delete volume

### DEMO - Instance store volume

1. Launch EC2 instance with type `m5dn.large`
	1. Paid but supports EC2 support volume
2. Connect using EC2 instance connect
3. `lsblk
	1. check for `nvme1n1
4. `sudo file -s /dev/nvme1n1`
5. `sudo mkfs -t xfs /dev/nvme1n1`
6. `sudo file -s /dev/nvme1n1` - See it has filesystem now
7. `sudo mkdir /instancestore`
8. `sudo mount /dev/nvme1n1 /instancestore` - mounts
9. `sudo touch instancestore.txt`
10. `ls -la` - see all the files

Reconnect and see
1. Reboot instance
2. Reconnect
3. `df -k` see it is not mounted
4. `lsblk`
5. `sudo mount /dev/nvme1n1 /instancestore` - mounts
6. `cd /instancestore`
7. `ls -la`
	1. See it has instancestore.txt
8. stop instance and check public IPv4 address - not running on EC2 host
9. Reconnect and see the public IPv4 changed
10. `lsblk`
11. `sudo file -s /dev/nvme1n1` - see it does not have data now
12. Basically if host is moved, EC2 instance store data will not persist

Cleaning
1. Terminate instance
2. CloudFormation - Delete stack

### EBS Encryption
By default, no encryption
- EC2 instance connected to EBS volume via EC2 host
- plaintext stored at rest

Encrypted:
- KMS Key (EBS default AWS managed key)/ - Customer managed
- GenerateDataKeyWithoutPlainText() --> DEK -> EBS Volume
- Key loaded in encrypted form to EC2 Host
- Ciphertext stored at rest
- If snapshot is created, same encrypted is using.

Facts:
- Accounts can be set to encrypt by default - default KMS Key
	- Else, choose KMS Key to use
- Each volume uses 1 unique DEK
	- Snapshots and future volumes using same DEK
- Cannot change volume to not be encrypted
- OS is not aware of encryption -> no performance loss


## Network Interfaces, Instance IPS, and DNS

### EC2 Network and DNS Architecture

Every EC2 instance starts off with 1 ENI (Elastic Network Interface) - primary ENI
- Can always be attached with more ENIs on different subnet within same AZ

Network interface (ENI) has:
- Mac address - 00:0d:83:b1:c0:8e
	- Can be used for software licensing
- Primary IPv4 Private IP - 10.16.0.10
	- Static and does not change for instance's lifetime
	- Logical format - ip-10-16-0-10.ec2.internal
	- Can be used for internal communication inside VPC
- 0 or more secondary IPS 
- 0 or 1 Public IPv4 Address - 3.89.7.136
	- Dynamic and not fixed
	- Not directly attached to instance, translated by IGW
	- Specifically when stopped and started again
	- public DNS-name `ec2-3-89-7-136.compute-1.amazonaws.com`
		- Inside VPC, resolve to private IP
		- elsewhere, always public IP
- 1 elastic IP per private IPv4 address 
	- Allocated with AWS account
	- Associated with IP on primary/ secondary interface
	- Replaces Public IPv4 with elastic IP
		- Cannot regain original IPv4 address
- 0 or more IPv6 addresses
- Security groups
- Enable/ disable source/ destination check

This applies to all types of ENI, however only secondary or other ENIs can be detached

Secondary ENI + MAC = Licensing
- Can be attached to new instances
- Multi-homed (subnets) management and data
- Different security groups - multi interfaces
- OS never see public IPv4
	- Process handled by NAT
- Public IPv4 Dynamic - changed on stop and start
- Public DNS = private IP in VPC, else public IP

## DEMO - Manual Install of Wordpres on EC2

```
  
# DBName=database name for wordpress
# DBUser=mariadb user for wordpress
# DBPassword=password for the mariadb user for wordpress
# DBRootPassword = root password for mariadb

# STEP 1 - Configure Authentication Variables which are used below
DBName='a4lwordpress'
DBUser='a4lwordpress'
DBPassword='4n1m4l$4L1f3'
DBRootPassword='4n1m4l$4L1f3'

# STEP 2 - Install system software - including Web and DB
sudo dnf install wget php-mysqlnd httpd php-fpm php-mysqli mariadb105-server php-json php php-devel -y


# STEP 3 - Web and DB Servers Online - and set to startup

sudo systemctl enable httpd
sudo systemctl enable mariadb
sudo systemctl start httpd
sudo systemctl start mariadb


# STEP 4 - Set Mariadb Root Password
sudo mysqladmin -u root password $DBRootPassword


# STEP 5 - Install Wordpress
sudo wget http://wordpress.org/latest.tar.gz -P /var/www/html
cd /var/www/html
sudo tar -zxvf latest.tar.gz
sudo cp -rvf wordpress/* .
sudo rm -R wordpress
sudo rm latest.tar.gz


# STEP 6 - Configure Wordpress

sudo cp ./wp-config-sample.php ./wp-config.php
sudo sed -i "s/'database_name_here'/'$DBName'/g" wp-config.php
sudo sed -i "s/'username_here'/'$DBUser'/g" wp-config.php
sudo sed -i "s/'password_here'/'$DBPassword'/g" wp-config.php   
sudo chown apache:apache * -R


# STEP 7 Create Wordpress DB

echo "CREATE DATABASE $DBName;" >> /tmp/db.setup
echo "CREATE USER '$DBUser'@'localhost' IDENTIFIED BY '$DBPassword';" >> /tmp/db.setup
echo "GRANT ALL ON $DBName.* TO '$DBUser'@'localhost';" >> /tmp/db.setup
echo "FLUSH PRIVILEGES;" >> /tmp/db.setup
mysql -u root --password=$DBRootPassword < /tmp/db.setup
sudo rm /tmp/db.setup


# STEP 8 - Browse to http://your_instance_public_ipv4_ip
```


## Amazon Machine Image (AMI)

AMI - images of EC2 - used to launch EC2 instance
- Usually AWS-provided, but can be created on our own
- Marketplace
- Regional with unique ID
- Permission can be configured

AMI Lifecycle:
1. Launch - AMI to launch EC2 instance
	1. Boot /dev/xvda
2. Configure - instance and bootable data attached to customizations
3. Create Image - the customizations used to create AMI (logical container with associated info)
	- Block Device Mapping - tables of data of snapshots ID. Has device id of original volumes
1. Launch - Launch the customized AMI  to make instance with the bootable data (EBS volumes)

Facts:
- AMI - one region
- AMI baking - creating AMI from configured instance + app
- Uneditable - launch instance, update config, make new AMI
- Default permission - only account
### DEMO - Creating an Animals4life AMI

1. Configure instance from [this link](https://learn-cantrill-labs.s3.amazonaws.com/awscoursedemos/0007-aws-associate-ec2-ami-demo/lesson_commands_AL2023.txt)
3. Create Image from instance
4. Launch instance from AMI

Copying and sharing an AMI:
1. Can copy AMI to other regions
2. Make it private and share it to other account/ orgs

## EC2 purchase Options (Launch Types)

Purchase options:
1. On-Demand - simple, no real pros and cons
2. Spot - cheapest to get access to EC2 capacity

### On Demand
- instances are isolated but multi-customer instances run on shared hardware
- Per-second billing while running. Associated resources such as storage consume capacity, bill, regardless of instance state.
- Instance of different size on same host consumes defined alloc of resources

Type
- Default purchase options
- no interruption
- No capacity resevation
- Predictable pricing
- No upfront cost
- No discount
- Short term workloads
- Unknown workloads
### Spot
Spot pricing is AWS selling unused EC2 host capacity for up to 90% discount
- Spot price based on spare capacity at given time
- Never use SPOT for workloads that cannot tolerate interruptions

Good for:
- non-time critical
- Anything that can be rerun
- Bursty capacity needs
- Cost-sensitive workloads
- Stateless


### Reserved
Reserved is for long-term consistent usage of EC2.

Important - form part of most larger deployment on AWS

- No reservation - full per second price
- Matching instance - reduced or no p/s price
- Unused reservation will still be billed
- Partial coverage of larger instance
	- Get discount of partial components of larger instance

Reservations are for 1 or 3 year terms - pay for entire term.

Payment:
- No-upfront. p/s Fee.
	- Some savings for agreeing to term.
	- Most flexible. Offers least discount
- All-upfront. No p/s fee.
- Partial upfront. Reduced p/s fee.

### Dedicated Hosts
EC2 host allocated to you in its entirety.
- Pay for host itself dedicated to specific family or instances (A, C, R)
- No instance charges
- Need to manage capacity - cannot host additional instances

Use case:
- Reason: licensing based on sockets/ cores (R5 2 Socket 48 Cores)
- Host affinity - links instances to host

### Reserved Instances
Great for known long-term, consistent usage

Types:
- Standard Reserved
- Scheduled Reserved - long term usage that is not run constantly
	- Ex: Daily 5h batch processing, weekly data analysis, monthly 100 hours usage
	- Reserve capacity and get capacity for slightly cheaper rate during time window
	- Does not support all instance types or regions. 1,200 hours/ year and 1 year min
- Capacity Reservations -   
	- Billing component and capacity componentd
	- Regional resevation - billing discount for valid instances launched in any Az in that region
		- Do not reserve capacity, can be risky
	- Zonal reservation - only on 1 AZ with billing discounts and capacity reservation
		- Full price and no capacit resevations
	- On-demand capacity reservation - always have access but at full on-demand price
		- No term limits and always need to pay.

EC2 Savings Plan - hourly commitment for 1 or 3 year term
- Reservation of general compute amount ($20 hourly for 3 years)
- Or sepcific EC2 savings plan - flexibility on size and OS
- Compute products - Currently EC2, Fargate, and Lambda
	- Generally moving from EC2 > Fargate (Container) > Lambda (Serverless)
- Products have on-demand rate and savings plan rate
- Resource usage consumes savings plan commitment at reduced savings plan rate
- Beyond commitment, on-demand is used
### Conclusion
![[Pasted image 20231217074607.png]]

## Instance Status Checks and Auto Recovery

Status checks:
1. System status
	- Loss of system power
	- Loss of network connectivity
	- Host software issues
	- Host hardware issues
1. Instance status
	- Corrupted file system
	- Incorrect instance networking
	- OS Kernel Issues

How to handle:
- Manual - manual stop restart or recreate
- Automatic - auto recovery
	- Move instance to new host and start with new same config

How to auto-recovery:
- Start EC2
- EC2 > Status Checks > Actions > Manage Status check alarm
- Sets alarm action > Recover
	- Don't work with instance store volume, only EBS volumes

How to shutdown, terminate, and terminate protection:
1. R click EC2 > Instance settings > Change termination protection > Enable
	1. Protects accidental termination
	2. Can have someone higher-ups has permission to remove
2. R click EC 2 > Instance settings > Change shutdown behaviour
	1. Default is stop

## Horizontal vs Vertical Scaling
System scaling - 2 different ways system can scale to handle increasing/ decreasing loads on the system.

#### Vertical Scaling
Vertical scaling - bigger server
- Resizing EC2 with bigger CPU, memory
	- t3.large > t3.2xlarge
	- 2 vCPU > 8 vCPU
	- 8 GiB Mem > 32 GiB Mem

Cons:
- Each resize requires a reboot - disruption
- Larger instance often carry more money
- Upper cap on performance - instance size

Pros:
- No app modification required
- Works for all apps, monoliths

#### Horizontal Scaling
Horizontal scaling - adds server or capacity to work together, needs load balancer

Load balancer - app between servers and customers to distribute the load fairly

Cons:
- Sessions are important
	- Need to store customer's login info, cart info
- Require app support or off-host sessions

Pros:
- No disruption when scaling
- No real limit to scaling
- Often less expensive - no large premium instance
- More granular - easier to allocate

## Instance Metadata
EC2 Instance metadata - EC2 service to provide data about instance
- Accessible inside all instances
- http://169.254.169.254
	- http://169.254.169.254/latest/meta-data

Information:
- Environment
- Networking
- Authentication
	- SSH key via instance connect
- User-data - run scripts for auto-config steps
- Not authenticated or encrypted
	- Anyone with EC2 access can access
	- Can use firewall but more admin overhead

How to:
1. EC2
	1. Details
	2. Networking
2. EC2 Instance connect
		1. `ifconfig` - contains some info, but not public IPv4 Address. public IPv4 is by IGW.
3. `curl http://169.254.169.254/latest/meta-data/public-ipv4` or `/public-hostname`
	1. Get ipv4 or DNS
4. `wget http://s3.amazonaws.com/ec2metadata/ec2metadata`
	1. `ls`
	3. `./ec2-metadata --help`



Prev: [[4-virtual-private-cloud]]