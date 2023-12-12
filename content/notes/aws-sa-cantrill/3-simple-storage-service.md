Prev: [[2-iam-accounts-aws-orgs]]
Next: [[4-virtual-private-cloud]]
### S3 Security
- private by default 

S3 bucket policies
- Form of resource policy
- Like identity policy, but attached to a bucket
- Resource perspective permissions - control who can access
	- Identity policy - control can access what (different)
- Allow/deny same or different account
- Allow/deny anonymous principals

Policy:
- has Principal component in the policy inside statement
	- differentiates this with identity policy
- Can block certain IP Address
	- `condition: {"NotIPAddress": {"aws:SourceIP": "1.3.3.7/32"}`

Block public access:
- S3 bucket with public access
	- public can access
	- can block public access through new or any acl
	- can block public access through new or any bucket and object

Access control lists:
- ACLs on objects and buckets
- Subresource
- Legacy (recommended to just use identity or bucket policy)
- Inflexible and simple permissions 

Exam powerup:
- Identity
	- controlling different resources
	- Preference for IAM
	- Same account
- Bucket
	- Just controlling S3
	- Anonymous or cross-account
- ACLs: Never unless must

#### Static Website Hosting
- Normal access via AWS APIs
- Feature allows access via HTTP
- Index and Error documents set
- Website endpoint is created
- Custom domain via R53 - bucketname matters

2 Scenarios:
- Offloading - EC2 delivers media switched to S3
	- Use S3 to deliver static media or any large data
- Out-of-band pages
	- If server is offline, change DNS and point to static website hosted via S3


### Object Versioning and MFA Delete
Object versioning - storing multiple versions of object within a bucket. Operations that modify objects generates new version.
- Controlled at bucket level
- Starts off in disabled and can optionally enable version but can never turn disabled again
	- Can be suspended and reenabled later
- Without versioning, each object identified solely by its key (name)
- Modified object, original version is replaced
- Cannot be switched off - only suspended

Disabled
- Key = winkie.jpg
- id =null

Enabled
- Key = winkie.jpg
- id = 111111
	- If value is changed, id is changed
	- Space is consumed by all versions and billled for allversions
	- To have zero cost, delete bucket

Versioning impacts deletion.
- Deleted without version id -> Delete marker makes it have a special version and deleted (hidden) and can be undeleted.
- Delete with version id -> next most recent version becomes current version
#### MFA Delete
Enable in versioning config
Required to change bucket versioning state
Required to delete versions
Serial number (MFA)+ code passed with API calls
### S3 Performance Optimization

Single PUT upload - single data stream to S3
- stream fails - upload fails
- requires full restart
- speed and reliability limited by 1 stream
- Any upload up to 5 GB

Multipart upload 
- Data is broken up
- Min data size 100MB for multipart
- 10,000 max parts, 5MB -> 5GB
	- last part can be smaller than 5MB
- Parts can fail and restarted
- Transfers rate = speed of all parts

S3 Accelerated Transfer (OFF)

Problem:
- no control over public internet data path
- Router and ISPs picking this path based on what they think is best. Commercially viable != best performance

S3 Transfer acceleration - use network of AWS edge locations avaialble globally
- S3 bucket needs to be enabled for transfer acceleration. Default is off.
	- Bucket name cannot contain period
	- Bucket name is DNS compatible
- Enters closest best performing AWS edge location. 
	- Occurs over public internet and transit through fewer normal networks. Performs well.
	- AWS network - faster, more consistent, and latency

### Key Management Service (KMS)
Easily create and manage cryptographic keys and control the use across wide range of AWS services

- Regional and Public Service
- Create, store, and manage keys
- Handles symmetric and asymmetric keys
	- Symmetric keys - same key for encrypt and decrypt
	- Asymmetric keys - 2 keys, public for encrypt, private for decrypt
- Cryptographic operations
- Keys never leave KMS - FIPS 140-2 (L2)
	- Level 2 - KMS vs. CloudHSM
	- Some achieved level 3 compliance

- KMS keys - Customer master keys
	- Can be used by people, app, or AWS services
	- Logical - ID, date, policy, desc, and state
	- Backed by physical key material
- Generated or imported
- KMS keys used for up to 4KB of data

KMS do not need to be told which key to use for decrypt operation

Each permission is separate (Role separation):
- Encrypt
- Decrypt
- Generate Key

KMS is very granular with permission - Role separation
#### Data Encryption Keys (DEKs)
- GenerateDataKey - works on > 4KB
- When data encryption key generated, 2 things provided:
	- Plaintext version - key to have cryptographic operations
	- Ciphertext Version - key given back to KMS to be decrypted

1. Encrypt data using plaintext
2. Discard
3. Store encrypted key with data

Concepts:
- KMS keys isolated to a region and never leave
- Multi-region keys exists
- Keys - AWS owned and customer owned
- With Customer owned...AWS managed or Customer managed keys
- Customer managed keys more configurable
- KMS keys support rotation
- Backing key 

Key policies and security
- Account trust explicitly added on account or not
- Every key has one key policy - one principal aws account to manage
	- Needed key policy to grant access to key using identities policies
- Key policies + IAM policies
	- Permissions very granular and split for resource and key
- Key policies + Grants

DEMO 
```
echo "find all the doggos, distract them with the yumz" > battleplans.txt 

aws kms encrypt \ --key-id alias/catrobot \ --plaintext fileb://battleplans.txt \ --output text \ --query CiphertextBlob \ | base64 --decode > not_battleplans.enc 

aws kms decrypt \ --ciphertext-blob fileb://not_battleplans.enc \ --output text \ --query Plaintext | base64 --decode > decryptedplans.txt
```


### S3 Object Encryption CSE/ SSE

Bucket are not encrypted - objects are
Each object in bucket can be encrypted differently

Users/App  --- S3 Endpoint  --- S3 Storage

2 types:
- Client-side encryption - keys, process, tooling
	- Encrypted in users or client
- Server-side encryption 
	- Encrypted in s3 endpoint to s3 storage

Server-side encryption types:
- SSE with customer-provided keys (SSE-C)
	- S3 endpoint perform encryption and decryption (ciphertext object and key hash)
	- Customer provides plaintext and key
	- With millions of objects, CPU capability adds on
- SSE with amazon s3-managed keys (SSE-S3) default
	- AWS S3 manages encryption and keys
	- Users provide plaintext to be encrypted with s3 key
	- Less admin overhead but little control (s3 creates, manages, rotates)
- SSE with KMS Keys stored in AWS Key management Service (SS3-KMS)
	- S3 endpoint manages encryption and keys with KMS key
	- KMS Key created by you within KMS managed by you (isolated but configurable)

![[Pasted image 20231128231036.png]]

### S3 Bucket Keys

S3 without bucket keys
1. PutObject sse-kms aws/s3
2. KMS generate data encrypted key
3. unique DEK stored with the object
4. Each Data Encryption Key (PutObject) is an API call to KMS
	1. Calls to KMS have costs and levels

S3 with bucket keys:
1. KMS key not used to generate each individual DEK, it generated time-limited bucket key to generate DEKs within S3
2. Offload work from KMS to S3 - significantly reduces KMS API calls - reducing cost and increasing scalability

- CloudTrail KMS events now show the bucket in the logs, not object
- Works with replication, the object encryption is maintained
- If replicating plaintext to bucket using bucket keys, object is encryption at destination (ETAG changes)

### S3 Object Storage Classes

#### S3 Standard
Default storage class
- Stores objects replicated in at least 3 AZs
- 11 nines durability
- Content-MD5 Checksums and Cyclic Redundancy Checks (CRCs) used to detect and fix data corruption
- Billed a GB/m fee for data stored, $ per GB charge for transfer OUT and price per 1,000 requests.
- No specific retrieval fee, no min duration, no min size

#### S3 Standard-IA (Infrequent Access)
Same with S3 for AZ, checksum CRC, but more cost effective
- Still have per-request and transfer out charge
- Have per GB retrieval fee data, overall cost may increase with frequent data access
- Has min duration charge of 30 days
- Has min capacity charge of 128kb per object

#### S3 One Zone-IA
Cheaper than S3 Standard or Standard IA
- Has same billing process with Standard IA
- Does not provide multi-AZ resilience model
- Still same 11 nines durability but 1 AZ

Used for long-lived data that is non-critical, replaceable and accessed infrequently


#### S3 Glacier Instant Retrieval
Like S3 Standard-IA but cheaper storage, more expensive retrieval cost, and longer minimum
Designed when need data instantly but not often
- min duration charge for 90 days
- Used for long-lived data like once per quarter with millisecond access

#### S3 Glacier Flexible
Has the same 3 AZ, durability but different storage cost 1/6 of the standard
- Cold objects, not publicly accessible, and requires retrieval process
- One of cheapest storage archive

Retrieval jobs (faster - more expensive):
- Expedited (1-5 minutes)
- Standard (3-5 hours)
- Bulk (5 - 12 hours)
- First byte latency = minutes or hours

#### S3 Glacier Deep Archive
Cheapest storage in S3
- Frozen state
- Object 40kb min billable size and 180 days min duration
- Not publicly accessible and requires retrieval process

Retrieval jobs:
- Standard (12 hours)
- Bulk (up to 48 hours)
- First byte latency = hours or days

#### S3 Intelligent-Tiering
Storage class with 5 storage tiers:
1. Frequent Access - S3 Standard
2. Infrequent Access - S3 Standard IA
3. Archive Instant Access - S3 Glacier IIA
4. Archive Access - S3 Glacier Flexible
5. Deep Archive - S3 Glacier Deep

Monitor the usage of object and place object to the storage tier, moved lower (settings can be configured)
1. > 30 Days - IA
2. > 90 days - Archive IA
3. 90 - 270 days - Archive
4. 180 - 730 days - Deep Archive

Has monitoring and automation cost per 1,000 objects instead of retrieval cost (all same with the equivalent storage).

### S3 Lifecycle Configuration
Lifecycle rule on S3 - automatically transition or expire object in the bucket

A lifecycle configuration is set of rules
- rules consist of actions
- on a bucket or groups of objects
- Transition actions - move to different deeper storage after certain time
- Expiration actions - delete objects entirely after certain time


Lifecycle rule used to optimize cost over time
- Not s3 intelligent tiering (based on access)
- Create rule to specificy transition action to move to deeper storage
- Eventually creates expiration actions

Transition like waterfall (can move anywhere to the right)
- Standard > IA > Intelligent-tiering > One Zone-IA > Glacier Instant > Glacier Flexible > Glacier Deep

Example rule:
- Standard > IA, Intelligent, One-zone (smaller objects can cost more because of min size)
- Standard - minimum 30 days before transition
- 1 Rule cannot transition to Standard to Glacier classes within 30 days

### S3 Replication

2 types of replication:
- Cross-region replication (CRR)
- Same-Region replication (SRR)

Buckets can be in same or different AWS account

Source has replication configuration
- Destination bucket to use
- IAM role to use (configured to be assumed by S3)
- Bucket Policy to define role in other accounts to replicate or not

Replication options
- What to replicate? - All objects or subset
	- Can create filter based on prefix or tag
- Storage class - default is maintain
- Ownership - default is source account
- Replication time control (RTC)
	- Guaranteed level of predictability - 15 mins

Replication considerations
- Default not retroactive and needs versioning
- Batch replication can be used to replicate existing objects
- one-way replication source to destination 
- Unencrypted, SSE-S3, SSE-KMS (config needed), SSE-C(MK)
- Source bucket owner needs permissions to objects
- No system events (or user bucket), glacier, or glacier deep archive
- Not track deleted (can added with DeleteMarkerReplication)

Why replicate?
- SSR
	- Log aggregation
	- Prod and test sync
	- Resilience with strict sovereignty
- CRR
	- Global resilience improvements
	- Latency reduction

### S3 Presigned URLs
Give other person or app access to object inside S3 using your credentials in safe and secure way

1. IAM user send request to authenticate to bucket
2. Only authenticated users can access

Problem: need to give other user accesss to bucket

3 common non-ideal solutions:
- Give AWS identity - supplying identity seems too excessive if short-term
- Provide AWS credentials - security risk esp if others
- Make public - security risk also

Solution: Presigned URL
1. Request to generate presigned UR
2. Get presigned URL from S3 that will expire at certain time
3. Gives unauthenticated user the URL to access
	- Getting URL using S3 masked as URL's holder

Server as application user (server) to get video media bucket.
1. User send requst to server
2. Server get presignedURL from S3
3. S3 create URL from bucket to S3
4. Server gives URL to user
5. User can access bucket

Exam powerup:
1. Can create presignedURL for object you have no access
	- But still no access to this
	- If URL generator have access suddenly, URL can also have access
1. When using URL, permissions matches the identity generator
2. Access denied means generating ID never had access or does not now (can have no more access and URL cannot be accessed)
3. Do not generate with role. URL stops working when temp credentials expire
4. Can generate presignedURL for non-existent objects

Demo
1. Open cloudshell
2. `aws s3presign <s3 URI> --expires-in 180`
	- Ex: S3 URI - s3://animals4lifemedia/all5.jpg.
	- 180 in seconds
3. It will generate URL that can be used within 180 secs and sent to others

### S3 Select and Glacier Select
- S3 Can store huge objects (up to 5TB) aften want to retrieve entire object
- Retrieving a 5TB object takes time
- Filtering at the client side does not reduce time
- S3/ Glacier select let you use SQL-like statements
- CSV, JSON, Parquet, BZIP2 compression for CSV and JSON

Application data stored on S3 with select will have only some retrieved and billed less by S3.
- up to 400% faster and 80% cheaper


### S3 Events
Notification generated when events occur in a bucket
- Can be delivered to SNS, SQS, and Lambda functions
- Object created (Put, Post, Copy, CompleteMultiPartUpload)
- Object delete (Delete, Delete MarkerCreated)
- Object restore (Post initiated, completed)
- Replication (OperationMissedThreshold, OperationReplicatedAfterThreshold, OperationNotTracked)
- EventBridge as an alternative to support more types of events and services

### S3 Access logs
- Gain visibility of source bucket (Need bucket and object access)
- Logged to target bucket (Via console UI or PUT bucket logging)
- S3 Log Delivery group to target bucket - allows S3 log group
- Log files consist of log records
	- Records are newline-delimited
	- Attributes are space-delimited

### S3 Object lock
- Enabled on new buckets - cannot be disabled
- WORM (Write-Once-Read-Many) - No delete, no overwrite
- Requires versioning - individual versions are locked
- 1 - Retention period
- 2 - Legal hold
- Both, one, or the other, or none
#### Retention
- Specify days and years - retention period
- Compliance - cannot be adjusted, deleted, overwritten
- ... even by account root user until retention expires
- Governance - special permissions can be granted allowing lock settings to be adjusted
	- s3:BypassGovernanceRetention
	- x-amz-by-pass-governance-retention:true


#### Legal hold
- Set object version - on or off
- No retention
- No deletes or changes until removed
- s3:PutObjectLegalHold is required to add or remove
- Prevent accidental deletion of critical object versions

Prev: [[2-iam-accounts-aws-orgs]]
Next: [[4-virtual-private-cloud]]