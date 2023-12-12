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

### Storage Refresher
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