Prev: [[3-simple-storage-service]] \
Next: [[5-elastic-compute-cloud]]
## VPC Security Groups
- Stateful - automatically detect response 
- Allowed (IN or out request) request = allowed response
- No explicit deny - only implicit deny and allows
	- Cannot block specific bad actors
	- That's why used in conjunction with NACL for explicit denies
- Supports IP/ CIDR and logical resources and other security groups
- Attached to ENI's not instances (even if the UI shows)

### SG Logical References
APP - Web wrapped by security group
- Bob access WEB through tcp/443 with ALLOW 0.0.0.0/0
- Web access APP through tcp/1337 through reference (ex: source - sg-123123123)
	- Reduces admin overhead in multi-tiered apps

### SG Self References
- Creates security group that references itself for multiple instances to access each other
- IP changes are auto-handled


## Network Address Translation (NAT) & NAT Gateway
- Set of processes - remapping source or dest IPs to allow IPv4 private instances outgoing access to the internet
	- Internet gateway performs a static NAT (ipV4 mapping - 1 private <-> 1 public)
- IP masquerading (NAT) - hides whole private IP CIDR blocks behind one single IP
- NAT - many private IPS <-> single IP
- Makes sure public IPs not exhausted
- Gives private CIDR range outgoing internet access

2 ways:
1. Historically, can use EC2 to provide NAT
2. NAT gateway provision into VPC

### NAT Architecture
![[Pasted image 20231211002055.png]]
NAT Gateway maps all the IPs from the APP to the VPC Router IPv4Public Address

Facts:
- Runs from public subnet (Public IPv4 Address)
	- To deploy: Need IP gateway, default route for the subnet pointing to IP gateway
- Uses Elastic IPs
- AZ resilient service
	- For region resilience, NAT GW in each AZ
	- RT in each AZ with each NATGW as target
	- IGW is region resilient
- NAT gateway don't work with IPV6
	- All IPv6 addresses in AWS are publicly routable
	- Internet gateway works with all IPv6 IPs directly
	- ::/0 Route + IGW for bi-directional connectivitiy

DEMO
Create 3 NAT Gateways, 3 Route tables, and associate each rt with the subnet from each zone.

1. CloudFormation create EC2 instance 
2. Create VPC > NAT Gateway for each AZ
3. Create Route Table connected to VPC of each AZ
	1. Add new route 0.0.0.0/0 with target nat gateway of each AZ
4. Connect route table with the subnets (app, web, db, reserved)

Removal
1. Detach subnet associations first
2. Delete route tables
3. Delete NAT gateways
4. Release all elastic ip addresses
5. Remove cloud formation stack

Prev: [[3-simple-storage-service]] \
Next: [[5-elastic-compute-cloud]]