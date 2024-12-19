recall - top of automated testing pyramid is most value and cost

how to automate?
1. arrange (input + scenario)
	1. not API call
	2. event based
2. act (running)
	1. nondeterminism
	2. performance
3. assert (orange)
	1. nondeterminism
	2. performance

## UI testing frameworks
tools like:
- UI Frameworks - flutter, react
- Tools provide leverage - can hook into event system of UI to be synthesized

## feeding information to UI
find things to interact with:
- by content
- by path through UI tree
- by unique ID

tradeoffs and use cases for all these
- plan in advance so test is easy

## dealing with time

time is problem
- nondeterminism
- latency
- cost

time can be abstracted
- wait x seconds -> wait until page loads

## practical concerns
what to test?
- just frontend or fullstack
- if just FE, mock the backend

who to create test?
- client for acceptance
- dev for system

## recording vs scripting
for precise control and using ids, handwrite tests

selenium can record user interaction to be replayed

## behaviour driven development (bdd)

behaviour driven development - provide another route for non-programmers to define tests

way to facilitate collab between biz and dev
- user stories in natural language
- **given** context, when event occurs, then ensure outcome

tools like cucumber into selenium

## summary
- ui testing add challenges on top of test automation
- framework intercept behavior to facilitate easier test construction
- careful design of code to be testable is important
