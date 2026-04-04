---
title: Software Architecture Tour
date: 2025-09-01
---

## intro
software architecture - tool to manage and guide complexity through design
- overall structure of system, include components
- how to communicate and control behaviour
- non-functional requirements

issue also across boundaries
- design patterns x enterprise system design
- monolith x microservice

## architecture goals
software architecture should help
- **identify** key design constraints
- **analyze** design tradeoffs
- **guide** design of potential solutions

architecture is still **iterative** and **incremental**

## architectural styles

### pipe and filter/ pipeline
- filter operate on data
- pipe connects filter
- example: unix pipe, compiler
- check Crafting Interpreters

![[Pasted image 20241208131004.png | 500]]

pro:
- easy to understand and maintain
- if pipe common type, filter can be dynamic or reordered

con:
- favor batch process over incremental

### client server
- independent client make request of server
- server wait for request and handle

example
- scalable monolith
- high fan in

pro:
- client independent and decoupled

con:
- client coupled to server (how to replace?)

![[Pasted image 20241208131153.png | 500]]

### broker
- server register with broker
- client request forwarded through broker to server
- server wait for request to handle
- can do load balancing

pros:
- client independent and decoupled
- horizontal scaling of broker and server

cons:
- broker become SPOF
- become more complex

![[Pasted image 20241208131953.png | 500]]

### publish-subscribe
- event subscribers register with mediator/ broadcast
- publishers broadcast events
- subscribers notified and process event

pros:
- highly decoupled
- easy to use

cons:
- no ordering guarantee
- hard to understand if actor dependent

![[Pasted image 20241208132113.png | 500]]

### layered
- cohesive abstractions separated into layers


pros:
- clear interfaces to allow replacing layers
- can focus on each layer

cons:
- identify clear layer boundaries
- higher layer may coupled to lower layer

![[Pasted image 20241208132240.png]]

### more recent styles
layer can be more explicitly decoupled
- focus on layer with component at core
- depend on interfaces for other layers
- ![[Pasted image 20241208132449.png | 500]]

dependency inversion - interface between layer to further decouple

known as hex, port and adaptor, onion architecture, clean architecture


other idioms:
- modern monoliths (single prog apps)
- service oriented architecture
- microservices

## visualizing design
don't overrely on UML for formalism

2 common hurdles:
- hierarchy/ abstaction
- perspective - flow state

consider system from multiple hierarchies to avoid missing big picture

## tips
prefer to reduce # of boundary crossings and places
- ![[Pasted image 20241208132823.png]]
- example: parse whole files first, process it then, and output after

prefers batch processing unless incrementality is required
- only at google scale, incrementality is required
- cleaner and can group related gode


prefer in-flight data immutable
- easy to check corrupted object

start by user story then follow data