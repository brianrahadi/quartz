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
- AMI Ba