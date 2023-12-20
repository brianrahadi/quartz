---
title: 100+ Things I Learned During My Time at Visier
draft: false
tags:
  - writings
date: 2023-12-19T08:31:15Z
---
## Intro
Hello everyone, I have just wrapped up my work term here at Visier. Working there has been a really great learning experience. I am writing this post in hopes of (1) not forgetting what I have learned and (2) showing at a glance the knowledge I gained to others.

This post structure is a combination of usual blog-post writing style and also as a knowledge-base. Thus, bullet point can seem like a guide or a reference/ reminder of available tools/ commands.

## Disclaimer
This post can be very opinionated and based on what has worked during my time at Visier. I am also fairly new to all the development process, thus always open for anything that may be incorrectly explained here. Thank you!

## Git
1. `git cherry-pick` to only pick change from a single commit
	- Useful when branching from dev-stable and no need to branch from another ticket (if working on top of it)
2. `git revert` to revert commit
	- Useful when you did a commit to test change and using git revert is not only faster, but gives better context compared to a regular commit.
3. `git stash` to save changes
	- Useful when want to save changes that is not commit-ready
4. `git patch` to save a commit into a single file
	- Useful to send to others commit file so they can push themselves
	- to git patch uncommited change, do `git diff > mypatch.patch`
5. `git pull origin dev` > `git fetch + git merge dev` > `git checkout dev + git pull + git checkout <your-branch> + git merge dev`
	- Simpler approach to solve the same issue - getting latest change from the main branch (dev)
6. Make sure to pull first when you want to merge to main branch to ensure confidence.
7. Stacked diffs - https://newsletter.pragmaticengineer.com/p/stacked-diffs
	- Always think and code about the next new features if possible so you do not get blocked

## Scala
Scala is a versatile programming language that combines both object-oriented programming (OOP) and functional programming (FP) paradigms. Thus, it allows you to write code that leverage functionalities of both paradigms. As someone who is new, I have really come to enjoy writing it as it is a less-verbose Java.

1. Use `val` instead of `var` whenever possible
	- Always using a constant makes the code readable and that confidence that there will be no mutation in the process, removing any unwanted side effects and/ or bugs.
	- There are only one or two rare cases I had to use var, which is incrementing a counter inside a child function
2. Always use [Option](https://www.scala-lang.org/api/2.13.3/scala/Option.html) on variable that has the slightest chance of a `null` or `undefined` value
	- Append the variable camel case name with `Opt` for better clarity. Ex: `userIdOpt`
	- Use `isDefined` or `isEmpty` to check if the option contains any values
3. Extract Option with [getOrElse](https://www.educba.com/scala-getorelse/) instead of get to provide error case of no value
4. Use [pattern matching](https://docs.scala-lang.org/tour/pattern-matching.html) for a clearer expression if there are 3 or more possible cases
5. Use [case class](https://docs.scala-lang.org/tour/case-classes.html) to make a connected param or return type clearer
	- Useful especially if the params or returns are always used together. Using case class ensures accessing variable is easier and allow the use other functionalities, such as pattern matching or copying.
	- Think case class as a special kind of class with simpler declaration.
6. Use [copy](https://docs.scala-lang.org/tour/case-classes.html#copying) operator to make a newly modified variable instead of modifying existing one.
	- This is aligned with core values of functional programming to avoid unexpected side effects
7. Use [map](https://medium.com/@mallikakulkarni/functional-programming-in-scala-2-the-map-function-f9b9ee17d495) function to transform values of a collection or option
	- Often used to replace loops in most languages
8. Use [higher-order function](https://docs.scala-lang.org/tour/higher-order-functions.html) to leverage the functionalities of method that takes functions
	- Instead of writing function inside a map. You can extract it out and allows it to be used by other function too.
9. Use `forEach` function to iterate a collections that produces side effects (returns Unit)
	- Usually map function is used more often whenever possible as it conveys a clearer intent
10. Use [traits](https://docs.scala-lang.org/tour/traits.html) to extract common methods from classes and let them share interface
	- It will make logic clearer to see and Scala's trait also allow implementation of the function
11. Companion object to make static methods and accessing helper function easier
12. Use [lazy val](https://www.baeldung.com/scala/lazy-val) over `def` to allow variable initialized when called and ensuring one-time execution, saving operation time on complex operations
13. Use `implicit` on JSON formatter on the companion object to have a built-in JSON read write capability

	``` scala
	object ElephantWithLongNose {   
		implicit val format: OFormat[ElephantWithLongNose] = Json.format[ElephantWithLongNose]   
	}
	```

## Typescript
1. Understand [Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html) to see types of variable at all times
	- Even better for complex data type to define the types `let cuisines: Cuisine[] = getCuisines()` makes it unambiguous for others
	- This is what makes me really enjoy developing in typescript
2. Understand [Typeguard](https://www.typescriptlang.org/docs/handbook/advanced-types.html) to ensure development in fully type-safe way
	- This is what makes typescript so safe as we know the types either as return or type inference
3. Combine with [typeof](https://www.typescriptlang.org/docs/handbook/advanced-types.html#typeof-type-guards) function to further develop in type-safe way
4. [Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) for variable that may be undefined, reducing potential bugs
	- Even with type inference, sometimes it may still be undefined (Ex: async operations)
	- Better `person?.info?.name` rather than  `person && person.info && person.name`
5. Leverage [Nullish coalescing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) to provide defaults for falsy values
	- Combined with optional chaining to ensure safe access
6. Use [interface](https://www.typescriptlang.org/docs/handbook/interfaces.html) to couple related variables together into a group
7. Use [Optional properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#optional-properties) on interface to make a variable optional
8. Even better, utilize functional library like [monet.js](https://monet.github.io/monet.js/) so you can code close to functional programming in typescript
	- Makes coding much more sense as I still mostly code in Scala
9. Never use any, use [Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types) if variable type is uncertain
10. Utilize [Type assertion](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions) to allow type inference of the variable, making it easier to catch error before compiling
11. Leverage [Interesection types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions) to combine 2 objects into 1, leveraging the DRY principle and making code easier to understand
12. Use [getters and setters](https://www.typescriptlang.org/docs/handbook/2/classes.html#getters--setters) for cleaner syntax and reduced boilerplate of functions
## Angular
Angular is a front-end development framework built on top of Typescript.
It is component-based, thus allows you to build scalable web applications.

1. Understand [angular modules](https://angular.io/guide/architecture-modules) quite in-depth to make future development easier
	- Basically, module lets you group related components, directives, pipes, and services. It makes it easier to be combined with other module and makes separation easier.
	- One of the harder things I was struggling was the concept around modules since I come primarily from developing with React
2. Understand [angular components](https://angular.io/api/core/Component), its decorator, and the values it can take
	- `selector` for html selector
	- `templateUrl` for location to html file
	- `styleUrls` for location to css file
	- `changeDetection` to decide when to rerender
3.  Understand the difference between `{{ value }}, [value], (value)`
	- ``{{ value }}`` is interpolation to define variable
	- `[value]` is for property binding - defining property of a constructor
	- `(value)` is for event binding - bind event to emit a function when triggered
4. Check which code should be located in main.ts file or utils file or service file for better organization and separation logic
5. Prioritize using [angular pipes](https://angular.io/guide/pipes) over making a function
	- Not only it is better to use built-in function for safety, pipe is also called only on input values change unlike function that called on every change detection
6. Understand when to use each [angular lifecycle hooks](https://angular.io/guide/lifecycle-hooks) like `ngOnInit`, `ngOnChanges`, `ngAfterViewInit`
	- This is something that I kinda take when a problem arises, but I should have know quite some things more deeply
	- I think the knowledge gained from this also transfers to other SPA frameworks/ libraries like `componentDidRender` or `useEffects` for its react equivalent
7. Utilize [angular templates](https://angular.io/guide/template-syntax) to make HTML components render conditionally
	- `<div *ngIf="isEnabled; else notEnabled">`
	- ``<ng-template #notEnabled`

## Async JS + RxJS
1. Understand [handling async operations](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Introducing) `Promise` and `then` operator
2. Use `async/ await` as a more readable technique of handling async operations that feels more synchronous
	- `async/ await` is built on top of promise. For handling errors, you need to use try catch instead of the `resolve/ reject`
	- Use case of `Promise` or `async/await` would be a one-time fetching. Like pulling data from an API that is not time-sensitive and always have same value.
3. Understand [Observable](https://angular.io/guide/observables) - collection of events or data over a period of time
	- There are many differences with Promise, but the general thing is that promise only occurs once while Observable is multiple over time.
	- Thus the term `RxJS`, which is ReactiveJS, as Observable is reactive to events.
	- Use cases of `Observable` would be for something that can happens anytime. Like observing for a `data` that can change any point at any time.
4. Understand the difference between [cold and hot observable](https://github.com/rohan-paul/Awesome-JavaScript-Interviews/blob/master/Angular-Topics-Interview/Observables/cold-vs-hot-observable.md)
	- Observable is by default cold. Observable is cold when it produces data inside the observable. It means the whole process requires the observable to create something each time. This is like unicasting because the data and subscriber is like one-to-one.
	- Observable is hot when it produces data outside the observable. It means the observable is simply just subscribing something that has been created. This is like 'multicasting' because the data and subscriber is like one-to-many.
	- Example for cold: Rx.Observable.create to make a hashed number based on current date and time
	- Example for hot: Multiple Rx.Observable.fromEvent that subscribe from same source
5. Understand [the four types of Subject in RxJS](https://rxjs.dev/guide/subject)
	1. **BehaviorSubject** - stores latest value, immediately receives the latest value everytime new Observer subscribes
		- Good for storing values over time. Ex: Youtube subscriber count
	2. **ReplaySubject** - BehaviorSubject++ because it's BehaviorSubject + record histtory of the execution. Can be specified how many of the latest value to track.
		- Good if remembering history is important. Ex: Check 3 latest followers.
	3. **AsyncSubject** - Only last value of Observable is sent to the observer.
		- Good if only end result is important. Ex: network request where only 1 value expected.
	4. **Void subject** - Emits that an event happens but does not emit any value.
		- Good if value is not important and only want to know that an event happens.
6. Understand [RxJS pipe operators](https://rxjs.dev/guide/operators)
	- Pipe is function that takes `Observable` and a new one based on its operation inside
7. Use [RxJS pipeable operators](https://rxjs.dev/guide/operators) to make the data format ready to consume
	- Map is the one that is more used

		``` typescript
		of(1, 2, 3)
			.pipe(map((x) => x * x)) 
			.subscribe((v) => console.log(`value: ${v}`));
		```
	- Other useful operators like `merge`, `combinelatest`, `concat`, `zip`, `switchMap` (quite useful to cancel existing operation), and `mergeMap`

## Testing
Main tools used: [Scalatest](https://www.scalatest.org/) and [Mockito](https://site.mockito.org/)
1. When making unit and component tests, focus not only the bits of operation, but what would make sense for an actual workflow like along with its edge cases.
	- Having robust test cases have helped me catch errors that otherwise might get caught in production
2. Always think DRY, see which variable can easily be put into global and operations that can be put into helper functions
3. Heavily use Object-oriented patterns on repeatable class and objects
	- Testing is not a checkbox, think best-case for maintainability
4. Make a base class test helper if there are lots of inheritance
5. Or use a trait to have common variables and helper functions
6. Utilize Scala's functional programming to easily test objects with its option, pattern matching, and forAll functions
7. Use `Mockito` to mock complex objects that is hard to be constructed
8. Use `Mockito` to mock functions that access database and return things that make sense for it

## Intellij
The IDE of choice. Coming mostly from VSCode, I really enjoyed all of the robust built-in features that's offered here.
1. Shift + Cmd + F - Global search for any strings in the file
	- Useful in large codebases and still relatively fast
	- Con would be search may still return a lot of results if not specific enough
2. Double shift - Search for the filename
	- Faster and more specific than global search if you remember the filename
3. Cmd + L - Move to any line
4. On the top left beside project, click Select opened file to navigate to the specific file
	- Really helpful in larger codebases
5. On the right of the `Navigate to specific file`,  there is a Setting > Tree Appearance > Show members. Toggle it on if you want members like function or class to show
	- This is personal preference, but I like being able to see the general structure of the file and quickly navigate to the specific function without needing to scroll.
6. Use `Remove JVM Debug` to debug changes
	- Especially when paired with Ubuntu, you need to specify the hostname and port
7. Click the space between line number and the code to toggle breakpoint (alternatively, Cmd + F8)
8. `Step over` - `F8` - to step over the function - skip function
	- Stepping over means taking it to next line even if we passed a method call
9. `Step into` - `F7 - to go inside the function 
	-  Stepping into means going inside the method.
	- Use this when unsure since you won't skip anything important

## Chrome DevTools
Useful mainly for inspecting HTML elements, checking network requests, and as a client debugger.
1. `F12` - inspect the browser
2. Inspect specific element to go to that element under `Elements` tab
3. Check `Network` tab to see the ongoing and finished requests. Helpful for debugging
4. `Source` > `Cmd + P` to open the specific file
5. `Cmd + F` to search file
6. Set a breakpoint by clicking the line number
7. `Step over` - `F10` - to step over the function - skip function
8. `Step in` - `F11` - to go inside the funciton 
9. `Step out` -  `Shift + F11` - to go outside the function call
10. `Step` - `F9` - normal step

## tmux
tmux (terminal multiplexer) is a tool used to easily switch between several programs and runs them in background even if your machine is closed. We used this as we compile the code on a remote machine. This has saved me a lot of hours as running the server again or resetting stack and take a lot of time.
1. Before starting tmux, make sure it is located on the directory of choice (root of repository)
2. `tmux` to create a tmux instance
3. `Ctrl + b + %` or `Ctrl + b + Shift + 5` to split the terminal horizontally
4. `Ctrl + b + "`  or `Ctrl + b + Shift + '` to split the terminal vertically
5. `Ctrl + b` then `PageUp or PageDown` to scroll the terminals
6. `Ctrl + b + d` to close the terminal and leave process running in background
7. `Ctrl + d` to kill the terminal and exit the process
8.  Outside of tmux, `tmux attach -t <number>` to run tmux session of `<number>`
9. Outside of tmux, `tmux kill-session -t <number>` to kill tmux session of  `<number>`

## Docker
1. `docker ps` - Check all containers, like `ls` for docker. 
2. `docker stop <container-id>` to stop container if something is not working
3. `docker rm <container-id>` to remove the stopped containeroc

## Kubernetes
1. `kubectl get pods` to get information of all the pods, kinda like `docker ps` of kubernetes though very simplified
3. `kubectl describe pod <pod-name>` - check status of the current container
4. `kubectl logs <pod-name>` - to see the code execution of logs of the kubernetes worker
5. `kubectl delete <pod-name>` - delete the pod 
6. `kubectl delete <job-name>` - delete the job, including the associated pods for the job

## Postman
1. Really important for me - do not hardcode things and always think of which param can be better used as variable. It will make accessing other endpoints a smoother process
2. Make the scope of variable as limited as possible to ensure it does not confuse other collection scopes
3. Utilize [Postman Interceptor](https://chromewebstore.google.com/detail/aicmkgpgakddgnaphhhpliifpcfhicfo) to get browser cookies and access endpoints you otherwise won't be able to access

## Problem Solving
1. Write problems or draw diagrams to understand things clearer
	- Writing is really underrated as it not only helps me, but also future me and others
2. Do rubber-duck debugging
	- Talk your problems out loud and lay it step-by-step
	- An alternative to this for me is to ask things through Slack and write all the things I know, what has worked, and what doesn't. Often times, I somehow found the potential solution just by laying out the answer.
3. Focus on getting the actual task done
	-  Use any way possible to reach the prerequisite of the task it is supposed to do.
	- Ex: when doing an extraction job from database, you do not care where the data comes from. It is faster to just have a script/ automation to populate the database rather than generate things manually.
4. Fail quick and fast
	- Having beginner mindset is really underrated. Try as many things as possible and ask a lot of questions. It will help you to know what does not work quickly and quickly reiterate with new solutions.
5. When building full-stack features, focus on the backend first and test the endpoint from postman
6. For features that can be different in local and online environment, make an online environment deployment first if necessary to ensure confidence in merging
7. ChatGPT is underrated to make a boilerplate code or discuss potential solutions

## Soft Skills
1. Make sure that you understand all the changes and validate everything locally.
	- It is important to take your time as people understand that our goal as co-op is to learn and have strong fundamentals first
2. Use a public group chat whenever an information might help other people
	- Information is really useful and helps others unblock and to not reinvent the wheel again
	- Alternatively, write the solution down as comment in the confluence page of the topic
3. Work on each other's best interest, do research but also try to ask questions as fast as possible before you have the wrong assumptions
	- Particularly important when working on feature with existing implementations, sometimes we know the how but not the why of it

## Conclusion
Working as a Co-op at Visier has been a really enriching experience, especially with the kind of stuff that we do and the expectation is the same as junior developer. The amazing products, helpful colleagues, nice office, good gym and snacks makes working as a co-op much more fun than my usual. study term. As always, let me know if you have more questions!