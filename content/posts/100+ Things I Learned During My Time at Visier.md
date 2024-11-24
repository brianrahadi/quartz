---
title: 100+ things i learned during my time at visier
date: 2023-12-19t08:31:15z
draft: false
tags: ["writings"]
---
## intro
hello everyone, i have just wrapped up my work term here at visier. working there has been a really great learning experience. i am writing this post in hopes of (1) not forgetting what i have learned and (2) showing at a glance the knowledge i gained to others.

this post structure is a combination of usual blog-post writing style and also as a knowledge-base. thus, bullet point can seem like a guide or a reference/ reminder of available tools/ commands.

## disclaimer
this post can be very opinionated and based on what has worked during my time at visier. i am also fairly new to all the development process, thus always open for anything that may be incorrectly explained here. thank you!

## git
1. `git cherry-pick` to only pick change from a single commit
	- useful when branching from dev-stable and no need to branch from another ticket (if working on top of it)
2. `git revert` to revert commit
	- useful when you did a commit to test change and using git revert is not only faster, but gives better context compared to a regular commit.
3. `git stash` to save changes
	- useful when want to save changes that is not commit-ready
4. `git patch` to save a commit into a single file
	- useful to send to others commit file so they can push themselves
	- to git patch uncommited change, do `git diff > mypatch.patch`
5. `git pull origin dev` > `git fetch + git merge dev` > `git checkout dev + git pull + git checkout <your-branch> + git merge dev`
	- simpler approach to solve the same issue - getting latest change from the main branch (dev)
6. make sure to pull first when you want to merge to main branch to ensure confidence.
7. stacked diffs - https://newsletter.pragmaticengineer.com/p/stacked-diffs
	- always think and code about the next new features if possible so you do not get blocked

## scala
scala is a versatile programming language that combines both object-oriented programming (oop) and functional programming (fp) paradigms. thus, it allows you to write code that leverage functionalities of both paradigms. as someone who is new, i have really come to enjoy writing it as it is a less-verbose java.

1. use `val` instead of `var` whenever possible
	- always using a constant makes the code readable and that confidence that there will be no mutation in the process, removing any unwanted side effects and/ or bugs.
	- there are only one or two rare cases i had to use var, which is incrementing a counter inside a child function
2. always use [option](https://www.scala-lang.org/api/2.13.3/scala/option.html) on variable that has the slightest chance of a `null` or `undefined` value
	- append the variable camel case name with `opt` for better clarity. ex: `useridopt`
	- use `isdefined` or `isempty` to check if the option contains any values
3. extract option with [getorelse](https://www.educba.com/scala-getorelse/) instead of get to provide error case of no value
4. use [pattern matching](https://docs.scala-lang.org/tour/pattern-matching.html) for a clearer expression if there are 3 or more possible cases
5. use [case class](https://docs.scala-lang.org/tour/case-classes.html) to make a connected param or return type clearer
	- useful especially if the params or returns are always used together. using case class ensures accessing variable is easier and allow the use other functionalities, such as pattern matching or copying.
	- think case class as a special kind of class with simpler declaration.
6. use [copy](https://docs.scala-lang.org/tour/case-classes.html#copying) operator to make a newly modified variable instead of modifying existing one.
	- this is aligned with core values of functional programming to avoid unexpected side effects
7. use [map](https://medium.com/@mallikakulkarni/functional-programming-in-scala-2-the-map-function-f9b9ee17d495) function to transform values of a collection or option
	- often used to replace loops in most languages
8. use [higher-order function](https://docs.scala-lang.org/tour/higher-order-functions.html) to leverage the functionalities of method that takes functions
	- instead of writing function inside a map. you can extract it out and allows it to be used by other function too.
9. use `foreach` function to iterate a collections that produces side effects (returns unit)
	- usually map function is used more often whenever possible as it conveys a clearer intent
10. use [traits](https://docs.scala-lang.org/tour/traits.html) to extract common methods from classes and let them share interface
	- it will make logic clearer to see and scala's trait also allow implementation of the function
11. companion object to make static methods and accessing helper function easier
12. use [lazy val](https://www.baeldung.com/scala/lazy-val) over `def` to allow variable initialized when called and ensuring one-time execution, saving operation time on complex operations
13. use `implicit` on json formatter on the companion object to have a built-in json read write capability

	``` scala
	object elephantwithlongnose {   
		implicit val format: oformat[elephantwithlongnose] = json.format[elephantwithlongnose]   
	}
	```

## typescript
1. understand [type inference](https://www.typescriptlang.org/docs/handbook/type-inference.html) to see types of variable at all times
	- even better for complex data type to define the types `let cuisines: cuisine[] = getcuisines()` makes it unambiguous for others
	- this is what makes me really enjoy developing in typescript
2. understand [typeguard](https://www.typescriptlang.org/docs/handbook/advanced-types.html) to ensure development in fully type-safe way
	- this is what makes typescript so safe as we know the types either as return or type inference
3. combine with [typeof](https://www.typescriptlang.org/docs/handbook/advanced-types.html#typeof-type-guards) function to further develop in type-safe way
4. [optional chaining](https://developer.mozilla.org/en-us/docs/web/javascript/reference/operators/nullish_coalescing) for variable that may be undefined, reducing potential bugs
	- even with type inference, sometimes it may still be undefined (ex: async operations)
	- better `person?.info?.name` rather than  `person && person.info && person.name`
5. leverage [nullish coalescing operator](https://developer.mozilla.org/en-us/docs/web/javascript/reference/operators/nullish_coalescing) to provide defaults for falsy values
	- combined with optional chaining to ensure safe access
6. use [interface](https://www.typescriptlang.org/docs/handbook/interfaces.html) to couple related variables together into a group
7. use [optional properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#optional-properties) on interface to make a variable optional
8. even better, utilize functional library like [monet.js](https://monet.github.io/monet.js/) so you can code close to functional programming in typescript
	- makes coding much more sense as i still mostly code in scala
9. never use any, use [union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types) if variable type is uncertain
10. utilize [type assertion](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions) to allow type inference of the variable, making it easier to catch error before compiling
11. leverage [interesection types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions) to combine 2 objects into 1, leveraging the dry principle and making code easier to understand
12. use [getters and setters](https://www.typescriptlang.org/docs/handbook/2/classes.html#getters--setters) for cleaner syntax and reduced boilerplate of functions
## angular
angular is a front-end development framework built on top of typescript.
it is component-based, thus allows you to build scalable web applications.

1. understand [angular modules](https://angular.io/guide/architecture-modules) quite in-depth to make future development easier
	- basically, module lets you group related components, directives, pipes, and services. it makes it easier to be combined with other module and makes separation easier.
	- one of the harder things i was struggling was the concept around modules since i come primarily from developing with react
2. understand [angular components](https://angular.io/api/core/component), its decorator, and the values it can take
	- `selector` for html selector
	- `templateurl` for location to html file
	- `styleurls` for location to css file
	- `changedetection` to decide when to rerender
3.  understand the difference between `{{ value }}, [value], (value)`
	- ``{{ value }}`` is interpolation to define variable
	- `[value]` is for property binding - defining property of a constructor
	- `(value)` is for event binding - bind event to emit a function when triggered
4. check which code should be located in main.ts file or utils file or service file for better organization and separation logic
5. prioritize using [angular pipes](https://angular.io/guide/pipes) over making a function
	- not only it is better to use built-in function for safety, pipe is also called only on input values change unlike function that called on every change detection
6. understand when to use each [angular lifecycle hooks](https://angular.io/guide/lifecycle-hooks) like `ngoninit`, `ngonchanges`, `ngafterviewinit`
	- this is something that i kinda take when a problem arises, but i should have know quite some things more deeply
	- i think the knowledge gained from this also transfers to other spa frameworks/ libraries like `componentdidrender` or `useeffects` for its react equivalent
7. utilize [angular templates](https://angular.io/guide/template-syntax) to make html components render conditionally
	- `<div *ngif="isenabled; else notenabled">`
	- ``<ng-template #notenabled`

## async js + rxjs
1. understand [handling async operations](https://developer.mozilla.org/en-us/docs/learn/javascript/asynchronous/introducing) `promise` and `then` operator
2. use `async/ await` as a more readable technique of handling async operations that feels more synchronous
	- `async/ await` is built on top of promise. for handling errors, you need to use try catch instead of the `resolve/ reject`
	- use case of `promise` or `async/await` would be a one-time fetching. like pulling data from an api that is not time-sensitive and always have same value.
3. understand [observable](https://angular.io/guide/observables) - collection of events or data over a period of time
	- there are many differences with promise, but the general thing is that promise only occurs once while observable is multiple over time.
	- thus the term `rxjs`, which is reactivejs, as observable is reactive to events.
	- use cases of `observable` would be for something that can happens anytime. like observing for a `data` that can change any point at any time.
4. understand the difference between [cold and hot observable](https://github.com/rohan-paul/awesome-javascript-interviews/blob/master/angular-topics-interview/observables/cold-vs-hot-observable.md)
	- observable is by default cold. observable is cold when it produces data inside the observable. it means the whole process requires the observable to create something each time. this is like unicasting because the data and subscriber is like one-to-one.
	- observable is hot when it produces data outside the observable. it means the observable is simply just subscribing something that has been created. this is like 'multicasting' because the data and subscriber is like one-to-many.
	- example for cold: rx.observable.create to make a hashed number based on current date and time
	- example for hot: multiple rx.observable.fromevent that subscribe from same source
5. understand [the four types of subject in rxjs](https://rxjs.dev/guide/subject)
	1. **behaviorsubject** - stores latest value, immediately receives the latest value everytime new observer subscribes
		- good for storing values over time. ex: youtube subscriber count
	2. **replaysubject** - behaviorsubject++ because it's behaviorsubject + record histtory of the execution. can be specified how many of the latest value to track.
		- good if remembering history is important. ex: check 3 latest followers.
	3. **asyncsubject** - only last value of observable is sent to the observer.
		- good if only end result is important. ex: network request where only 1 value expected.
	4. **void subject** - emits that an event happens but does not emit any value.
		- good if value is not important and only want to know that an event happens.
6. understand [rxjs pipe operators](https://rxjs.dev/guide/operators)
	- pipe is function that takes `observable` and a new one based on its operation inside
7. use [rxjs pipeable operators](https://rxjs.dev/guide/operators) to make the data format ready to consume
	- map is the one that is more used

		``` typescript
		of(1, 2, 3)
			.pipe(map((x) => x * x)) 
			.subscribe((v) => console.log(`value: ${v}`));
		```
	- other useful operators like `merge`, `combinelatest`, `concat`, `zip`, `switchmap` (quite useful to cancel existing operation), and `mergemap`

## testing
main tools used: [scalatest](https://www.scalatest.org/) and [mockito](https://site.mockito.org/)
1. when making unit and component tests, focus not only the bits of operation, but what would make sense for an actual workflow like along with its edge cases.
	- having robust test cases have helped me catch errors that otherwise might get caught in production
2. always think dry, see which variable can easily be put into global and operations that can be put into helper functions
3. heavily use object-oriented patterns on repeatable class and objects
	- testing is not a checkbox, think best-case for maintainability
4. make a base class test helper if there are lots of inheritance
5. or use a trait to have common variables and helper functions
6. utilize scala's functional programming to easily test objects with its option, pattern matching, and forall functions
7. use `mockito` to mock complex objects that is hard to be constructed
8. use `mockito` to mock functions that access database and return things that make sense for it

## intellij
the ide of choice. coming mostly from vscode, i really enjoyed all of the robust built-in features that's offered here.
1. shift + cmd + f - global search for any strings in the file
	- useful in large codebases and still relatively fast
	- con would be search may still return a lot of results if not specific enough
2. double shift - search for the filename
	- faster and more specific than global search if you remember the filename
3. cmd + l - move to any line
4. on the top left beside project, click select opened file to navigate to the specific file
	- really helpful in larger codebases
5. on the right of the `navigate to specific file`,  there is a setting > tree appearance > show members. toggle it on if you want members like function or class to show
	- this is personal preference, but i like being able to see the general structure of the file and quickly navigate to the specific function without needing to scroll.
6. use `remove jvm debug` to debug changes
	- especially when paired with ubuntu, you need to specify the hostname and port
7. click the space between line number and the code to toggle breakpoint (alternatively, cmd + f8)
8. `step over` - `f8` - to step over the function - skip function
	- stepping over means taking it to next line even if we passed a method call
9. `step into` - `f7 - to go inside the function 
	-  stepping into means going inside the method.
	- use this when unsure since you won't skip anything important

## chrome devtools
useful mainly for inspecting html elements, checking network requests, and as a client debugger.
1. `f12` - inspect the browser
2. inspect specific element to go to that element under `elements` tab
3. check `network` tab to see the ongoing and finished requests. helpful for debugging
4. `source` > `cmd + p` to open the specific file
5. `cmd + f` to search file
6. set a breakpoint by clicking the line number
7. `step over` - `f10` - to step over the function - skip function
8. `step in` - `f11` - to go inside the funciton 
9. `step out` -  `shift + f11` - to go outside the function call
10. `step` - `f9` - normal step

## tmux
tmux (terminal multiplexer) is a tool used to easily switch between several programs and runs them in background even if your machine is closed. we used this as we compile the code on a remote machine. this has saved me a lot of hours as running the server again or resetting stack and take a lot of time.
1. before starting tmux, make sure it is located on the directory of choice (root of repository)
2. `tmux` to create a tmux instance
3. `ctrl + b + %` or `ctrl + b + shift + 5` to split the terminal horizontally
4. `ctrl + b + "`  or `ctrl + b + shift + '` to split the terminal vertically
5. `ctrl + b` then `pageup or pagedown` to scroll the terminals
6. `ctrl + b + d` to close the terminal and leave process running in background
7. `ctrl + d` to kill the terminal and exit the process
8.  outside of tmux, `tmux attach -t <number>` to run tmux session of `<number>`
9. outside of tmux, `tmux kill-session -t <number>` to kill tmux session of  `<number>`

## docker
1. `docker ps` - check all containers, like `ls` for docker. 
2. `docker stop <container-id>` to stop container if something is not working
3. `docker rm <container-id>` to remove the stopped containeroc

## kubernetes
1. `kubectl get pods` to get information of all the pods, kinda like `docker ps` of kubernetes though very simplified
3. `kubectl describe pod <pod-name>` - check status of the current container
4. `kubectl logs <pod-name>` - to see the code execution of logs of the kubernetes worker
5. `kubectl delete <pod-name>` - delete the pod 
6. `kubectl delete <job-name>` - delete the job, including the associated pods for the job

## postman
1. really important for me - do not hardcode things and always think of which param can be better used as variable. it will make accessing other endpoints a smoother process
2. make the scope of variable as limited as possible to ensure it does not confuse other collection scopes
3. utilize [postman interceptor](https://chromewebstore.google.com/detail/aicmkgpgakddgnaphhhpliifpcfhicfo) to get browser cookies and access endpoints you otherwise won't be able to access

## problem solving
1. write problems or draw diagrams to understand things clearer
	- writing is really underrated as it not only helps me, but also future me and others
2. do rubber-duck debugging
	- talk your problems out loud and lay it step-by-step
	- an alternative to this for me is to ask things through slack and write all the things i know, what has worked, and what doesn't. often times, i somehow found the potential solution just by laying out the answer.
3. focus on getting the actual task done
	-  use any way possible to reach the prerequisite of the task it is supposed to do.
	- ex: when doing an extraction job from database, you do not care where the data comes from. it is faster to just have a script/ automation to populate the database rather than generate things manually.
4. fail quick and fast
	- having beginner mindset is really underrated. try as many things as possible and ask a lot of questions. it will help you to know what does not work quickly and quickly reiterate with new solutions.
5. when building full-stack features, focus on the backend first and test the endpoint from postman
6. for features that can be different in local and online environment, make an online environment deployment first if necessary to ensure confidence in merging
7. chatgpt is underrated to make a boilerplate code or discuss potential solutions

## soft skills
1. make sure that you understand all the changes and validate everything locally.
	- it is important to take your time as people understand that our goal as co-op is to learn and have strong fundamentals first
2. use a public group chat whenever an information might help other people
	- information is really useful and helps others unblock and to not reinvent the wheel again
	- alternatively, write the solution down as comment in the confluence page of the topic
3. work on each other's best interest, do research but also try to ask questions as fast as possible before you have the wrong assumptions
	- particularly important when working on feature with existing implementations, sometimes we know the how but not the why of it

## conclusion
working as a co-op at visier has been a really enriching experience, especially with the kind of stuff that we do and the expectation is the same as junior developer. the amazing products, helpful colleagues, nice office, good gym and snacks makes working as a co-op much more fun than my usual. study term. as always, let me know if you have more questions!