---
title: Object-Oriented Programming
date: 2025-09-01
---

## why oop
superficial reason is straightforward

old code many oop but can be inefficient

applied well and thoughtful, can solve real problems

## what is oop
classically:
- combination of data and code
- AEIP - Abstraction, Encapsulation, Inheritance, and Polymorphism

intuitively, Objects provide interchangeable services supporting higher level goals

OOP decouples implementation from use

## classes review
- object - instances of classes
- fields - define state of object
- methods - define behaviour
- visibility modifier - decide what is published to outide
- nested construct - define scope for enum, classes
- virtual method and inheritance - derive classes to work


## general classes guidelines
every guideline has reason and exception
- understand for cost-benefit analysis

common examples:
- SOLID
	- Single Responsibility
	- Open/Closed
	- Liskov Substitutability
	- Interface Segregation
	- Dependency Inversion
- DRY

general guidelines:
- be careful about compiler provided methods
- minimize mutability
- min visibility
- refer objects by interfaces when possible
- dont give away internals
- prefer DI over hardwiring resources
	- separating creation from wiring to make more flexible system
- use PIMPL (Pointer to IMPLementation) idiom
- consider roles of classes and uses
	- values - pure data, safely copied (struct of primitives)
	- identity - address/ reference uniquely identifies object 
	- indirection - refer/ borrow property of other objects
	- managers - coordinate and clean up resources (unique shared ptr, vector)

## thinking in services
modern thinking notes that OOP defines services
- inheritance and runtime polymorphism drives this
- base class as interface
- derived as implementations

also enables hetero aggregates
``` cpp
List<Person*> people = ...;
for (Person* person : people) {
	person->sleep()
}
```

## inheritance
why is it hard?
- LSP and has-a relationship unambiguously tell to apply inheritance
- every is-a could be a has-a
	- better and finer grained relationships
- whenever is-a applies, still make design decision

### is-a vs has-a
1. if behaviour might change
	1. coarse inheritance to preclude
	2. composition simplifies
	3. make coarser gained composition
2. if type used polymorphically
	1. composition doesn't aid
	2. inheritance enables
	3. if set of possibly types known and bounded, better ways

### shallow, fine-grained inheritance
- avoid reimplementation of common
- enable dynamic selection
	- cat, stationary -> run -> stationary
- direct identifies and addresses risk of change

### inheritance guidelines
1. favor composition over inheritance
2. do not inherit to reuse, inherit to be reused
	- stack-is-a-vector bad
	- more specialization with virtual methods
3. use inheritance for semantic is-a relationship
	- Liskov Substitutability - true for base, always true for derived
4. prefer to inherit interfaces and push impl to leaves
	- hierarchies delocalize code - yield yo-yo effect (down up down)
	- ambigioues overrides break encapsulation
	- alternative, only leaves should be instantiable
5. design for inheritance
	- choose customization pts for runtime polymorphism
	- prevent it elsewhere
