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

Cleaning
1. Terminate instance
2. CloudFormation - Delete stack

Prev: [[4-virtual-private-cloud]]