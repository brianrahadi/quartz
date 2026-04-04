---
title: Modern C++
date: 2025-09-01
---

## intro
cpp was complicated
- pointers
- nontrivial types
- many proposed rules
	- [[concepts/rule-of-3]]
	- pass by value

modern cpp for
- simplicity
- safety
- syntactic sugar

## managing object lifetimes

stack - automatic memory management
``` cpp
Widget w{0, "fritter"}
```

heap - manual management, harder in complex
``` cpp
Widget* w = new Widget{0, "fritter"}
```

![[Pasted image 20241207180041.png]]

2 types of ownership in modern c++
- unique ownership `std::unique_ptr<T>`
	- automated, preferred, and deleted when out scope
- shared ownership `std::shared_ptr<T>`
	- counts # of owners

few rules:
- every object generally has 1 owner
- no outliving owning ptr
- non-owning ptr can be unlimited

## functions passing

signature
- immutable pass-by-ref `foo(const X&)`
- mutable pass-by-ref `foo(X&)`
- pass-by-value `foo(X)`

## general resource management

memory management - subset of resource management
- proper acquire and release
	- no double make, double free, use after free
- other resources to manage (files, locks, dbs)

problems pervasive - general solutions across languages - Resource acquisition is Initialization (RAII)

RAII relation to managing complexity?
- explicit resource design
- automatic
- removes temporal coupling (use after free)
- promotes composition

## operating on collections

1. iterating
	iterating painful w/ basic for-loops
	``` c++
	for (unsigned i = 0; e = 4; i <= e; ++i)
	```
	range-based better
	``` cpp
	for (auto number: numbers)
	```
2. passing collections
	- prefer `const std::vector<T>&` over `const std::vector<T>`

## new vocab types
vocab types - commonly used types regularly appear
- better communication
- solve faster
- less bugs

example:
- `std::span`
- `std::string_view`
- `std::optional`
- `ranges`

### λ lambdas
``` cpp
bool hasGreaterThan3 = std::ranges(numbers, [](auto number) { return number > 3; })
```

over 

``` cpp
bool hasGreaterThan3 = false;
for (auto number: numbers) {
	if (number > 3) {
		hasGreaterThan3 = true;
	}
}
```

lambda structure
``` cpp
[local1, local2] (auto arg1, auto arg2) -> returnType {

}
```

views and ranges
``` cpp
auto results = ints
	| std::views::filter(isEven)
	| std::views::transform(square)
	| std:::ranges::to<vector>();
```
- lazy iterator - efficient

filter, map, map-ish

## exception
can also use exception, but not new


