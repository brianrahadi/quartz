---
title: Docker and Kubernetes
date: 2023-12-05
---

Docker
- Why? Makes it easy to install and run software without dependencies worrying
- What? Platform or ecosystem around creating and running containers (Client, Server, Hub, Image)

Docker Image - Single file with all the deps and config to run a program
Docker Container - Instance of image - runs a program

Tools:
- Docker CLI - issue commands
- Docker Server - create images, run containers

Docker Run Command:
1. grabs image from Docker Hub 
	1. first time to image local cache
2. creates container out of the image


How to separate process (belong to linux):
- Namespacing - isolate resources per process
- Control groups - limits amount of resources used per process

Container - Set of processes with grouping of resources assigned to it
- Running process with subset of resources from PC

Image:
- Filesystem snapshot - lower level under kernel
- Startup command - higher level to run

Docker has:
- Linux VM with each own its kernel (so it can separate processes)

## 2 - Manipulating Containers with the Docker Client

```
docker run <image name> command!
```
- docker - reference docker client
- run - create and run container
- command! - default command override
	- May not work if the image does not have an actual executable file

`docker ps` - shows running container
- `--all` - shows all containers ever ran

```
docker run = docker create + docker start
```

1. docker run hello-world
2. docker create -a 0316c4a3365342583ed368d98fd726a988d2811f066edf2b0920a40fbc6020e6
	- `-a` - give output coming from container
3. docker system prune - removes all containers and others (networks, deps)
4. docker logs `<container id>` - get logs after docker start
5. docker stop `<container id>` - Send SIGTERM to shutdown process at its own time for cleanup (about 10s grace time)
	- With ping command, never wants to stop so just auto after 10s
6. docker kill `<container id>` - Kills instantly

### Running multi-command containers
Problem - containerized server (redis-server) cannot listen to a port number anymore
Solution - Put the listener (redis-cli) also inside container asdd execute additional command

docker exec -it `container-id` `command`
- exec - run another command
- -it - listens to input
- docker exec -it `container-id` redis-cli

it flag - combination of -i and -t flag
- -i flag - ensures stdin to the command
- -t flag - ensures text entered is formatted

docker exec -it `container-id` sh
- full container access to manipulate
- other terminals - bash, powershell, zsh, sh

`docker run -it busybox sh` - to poke around containers, cannot run other processes
- isolated, 2 processes are unique and not share files or others

## 3 - Building Customer Images through Docker Server

`Dockerfile -> Docker Client -> Docker Server -> Usable Image`

Dockerfile - configuration to define how container behave

Creating dockerfile:
1. Specify base image
2. Run some commands to install deps
3. Specify command to run on start

`docker build .` on a dir with dockerfile

```
FROM alpine

# Step 2: Download and install dependency
RUN apk add --update redis

# Step 3: Tell the image what to do when it starts as container
CMD ["redis-server"]
```

Wrtiting dockerfile == Installing Chrome with computer with no OS

Use alpine as base image - includes programs enough to run
- apk add to install redis

Build process - almost every step (after step 2), make a new intermediate container with the new FS snapshop. shutdown the container and get image ready
- Caching happens and not do any fetching anymore but ensure that dependency is the same

Tagging image -  -t brianrahadi/redis:latest
- `docker build -t brianrahadi/redis:latest .`

Manual image generation with docker commit
- `docker commit -c 'CMD ["redis-server"]' e444cc643230`