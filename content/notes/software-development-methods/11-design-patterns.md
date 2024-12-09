## background
complexity
- has many forms
- one broad notion - coupling
	- understood without others
	- changed without changing others

## intro
design patterns - reusable solutions and metaphor to address problems

provide
- common language - easy shorthand
- archetypes - with tradeoffs

note:
- not taken as-is directly

## benefits
- clear formulations of problem to attack
- enable efficient communication
- understand pros and cons
- provide anchor points to explore

## risks
- solutions built around design patterns, not informed
- emergent tradeoffs hidden by adopting pattern too early

## puzzle pieces
design patterns largely built around exploiting
- composition
	- use other class in variables
- polymorphism
	- common interface for many types

## 3 classical categories
1. **creational** - support creation of objects
2. **structural** - organize object to create new behaviour
3. **behavioural** - communication between entities

## deriving designs and recognizing patterns


### problem - flexibly create instance of object

creational pattern - prototype
``` cpp
Animal animal{"Zebra", RunPolicy, WinnyPolicy};

class ThingMaker {
	Animal toCopy;
public:
	Animal makeOne();
} maker;

Animal animal = maker.makeOne();
```
pros:
- user defined object easier

cons:
- managing cloning become critical
- inheritance based
### problem - adding behaviour/ state

structural pattern - decorator
![[Pasted image 20241208193317.png | 500]]

shared API - FrameProvider
Core - VideoStream
Configurable wrappers - others

goal
- decouple addition of behaviour from VideoStream class
- inheritance of implementation is strongly coupling

benefits
- avoid class explosion
- works when inheritance on core is prohibited
- can dynamically add/remove behavior

cons
- address no object identity
	- deep check to solve
- indirection is form of complexity
	- debugging more complex
### problem - separate caller and callee
behavioural pattern - command

want to decouple actions to be taken from call sites

``` cpp
auto result = foo(x, y, z)
// better
auto result = worker.doWork();

class Work {
	virtual Result doWork() = 0;
}

class WorkKind1 : public work {
	Result doWork() override {...}
}
```

``` cpp
class Command {
public:
	virtual void execute() = 0;
}
```

benefits
- decouples request/ behavior from invoker
- invoker decides **when** to invoke without caring **what**
- parametizable via constructor
- command sequences batchable

issues
- how much state it holds
- perform undo/ redo
- how to batch commands
- how temporal coupling affect operation logic

## big picture

nothing special about design patterns
- API you want
- hide design decisions to get API

design patterns
- provide common language
- have trade offs and solve
- next learn state, strategy and visitor



