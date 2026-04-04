---
title: Types, Polymorphism, and Composition
date: 2025-09-01
---

## why types

cons
- some languages got by (python, ruby, js)
- involve extra typing
- limit what program can do (-)

good
- less bugs
- easier to read
- many dynamically typed also have types
- can limit what a program can do (+) - maintainable

## what are types
type is
- set of values
- how values used (add, subtract)

by limiting values/ possible operations, easier to prove program is correct to a degree

instatically typed language, describe set of values ahead of time, without running code


## goals and tradeoffs
writing out types complex
- extra typing
- expressing static types can be limiting
	- one solution is polymorphism
## polymorphism
generally 4 types

**universal polymorphism** - types that can comprise an infinite number of other types
1. runtime polymorphism - subtypes, inheritance
2. parametric polymorphism - templates, generics


**ad hoc polymorphism** - types that can comprise finite set of explicitly specified types with disparate structure
3. overloading - write for each type
4. coercion - string_view

all form have benefits and costs, but juniors struggle w/ inheritance vs parametricity


### runtime vs parametric polymorphism

parametric polymorphism - defines fresh type for new parameters
- `std::array<int,5> != std::array<int, 6>`
- static type check
- resolved at compile-time, performant gains


runtime polymorphism - resolve operation dynamically at run-time through indirection
- indirection more flexible and more uniform view
- hides specific type (decoupling)

both can be combined
- done well, get strengths of both
- done poorly, get weaknesses of both
- parametric derived classes - create family of types satisfying interface
- parametric base class - pass info from derived to base to improve safety & performance

both enables open/ closed principle
- open to extension (customize)
- closed to modification (original code unmodified)

both enables program with holes

``` cpp
bool any_of(const Collection& c, Predicate p) {
	for (const auto& el : c) {
		if (p(c)) {
			return true;
		}
	}
	return false;
}
```

## composition
plain composition simpler than polymorphism
- but harder to satisfy open/ closed
- think types as set of values
	- enum (OR) - +
	- struct (AND) - x

algebraic data types - constructed through basic relational compositions of values
- product types are records
- sum types are discriminated unions


## summary
thinking types as set of values can ensure correctness, flexibility, and performance

4 major forms of polymorphism have been in use for decades 
- give power when designing types

algebraic data types use composition of types to provide safe and convenient handling of finite sets