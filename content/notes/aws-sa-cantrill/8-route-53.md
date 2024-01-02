## R53 Public Hosted Zones

A **R53 Hosted Zone** is a DNS database for domain
- Globally resilient (multiple DNS Servers)
- Created with domain registration via R53 - created separately
- Host DNS records (A, AAAA, MX)
- Hosted Zones - what DNS system references - Authoritative for domain

Public hosted zone:
- DNS Database (zone file) hosted by R53 (public name servers)
- Accessible from public internet and VPCs
- Hosted on "4" R53 Name Servers (NS) specific for the zone
	- Use NS records to point at these NS
- Resource records created within hosted zone
- Externally registered domain can point at R53 public zone

![[Pasted image 20231228171125.png]]

Private hosted zone:
- Associated and only accessible through VPCs
	- Using different account supported via CLI/ API
- Split-view (overlapping public and private) for public and internal use with same zone name
![[Pasted image 20231228172111.png]]
![[Pasted image 20231228172421.png]]

## CNAME vs R53 Alias


- "A" maps a Name to IP address
	- catagram.io => 1.3.3.7
- CNAME maps name to another name
	- www.catagram.io => catagram.io
- Problem: CNAME is invalid for naked/ apex (catagram.io)
	- Many AWS services use DNS name (ELBs)
	- With just CNAME, catagram.io => ELB is invalid

Alias use case:
- ALIAS record map NAME to AWS resource
- Can be used for both naked/apex and normal records
- For non apex/naked, functions like CNAME
- No charge for ALIAS => AWS
- Default to pick ALIAS for AWS service
- Should use same "Type" for whatever the record is pointing

Simple routing
- Supports 1 record per name
- Each record can have multiple values
- Client chooses and uses 1 of the randomly returned value
- Does not support health check when queried
## R53 Health Checks

Health checks - separate from but used by records
- Located globally
- Checks every 30s (every 10s costs extra)
- TCP, HTTP/HTTPS, HTTP/HTTPS with string matching
	- Need to return 2XX/3XX within 2s
- Based on checks, endpoint can be healthy or unhealthy
- What to monitor: Endpoint, CloudWatch alarm, check of checks (calculated)
	- Calculated check - check app wide including every single component

## R53 Failover Routing

R53 Failover routing - if the target of health check is unhealthy, any queries return the secondary record
- Common architecture - use failover for "out of band" failure page for a service (EC2, S3)
- Used to configure active passive failover

## R53 Multi value routing

Multivalue routing - mix between simple and failover routing
- Create many records all with same name
- Each record can have associated healthy check
- Multi value improves availability, but not replacement for load balancing
	- Load balancer - handle connection request to server so it's used equally

## R53 Weighted Routing

Weighted routing - simple load balancing or testing new software versions
- Specify weight for each record
	- '0' weight means never returns, unless all are considered
- Each record is returned based on its record weight vs total weight

## R53 Latency-Based Routing
Latency-based routing - optimize for performance and user experience
- supports one record with same name in each AWS region (WWW, us-east-1, A, 1.2.3.3)
- AWS maintains database of latency between users general location and latency tagged in records (Source, Dest, Latency)
- record returned is one with lowest etimated latency and healthy

## R53 Geolocation routing

Geolocation routing - similar to latency but using location of resources and customers
- records tagged with location ("US State")
- IP check verifies location of user
- Geolocation
- Checks for records
	1. State
	2. Country
	3. Continent
	4. Optionally, most specific record or no answer
- Routing policy type not about closest record, but relevant locations

## R53 Geoproximity Routing
Geoproximity routing - provides record a closest as possible
- Records tagged with AWS region or lat and long coordinates
- Routing is distance based (including bias)
- "+" or "-" bias can be added to increase region or decreases neighbouring regions

## R53 Interoperability
R53 Interoperability - Using route53 to register domains or host zone files when other part with not route 53

R53 functions:
- Do both, or either **domain registrar** or **domain hosting**
- Accepts money (domain registration fee)
- Allocated 4 name servers (NS) (domain hosting)
	- Creates zone file (domain hosting) above Name servers
- Communicates with registry of TLD (domain registrar)
	- Sets NS record for domain to point at 4 Nameserver above

Both roles:
![[Pasted image 20240101210531.png]]

Registrar only (rarer):
![[Pasted image 20240101210703.png]]

Hosting only (more often):
![[Pasted image 20240101210811.png]]