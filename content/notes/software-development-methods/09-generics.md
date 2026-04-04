---
title: Generics
date: 2025-09-01
---

## background
generic programming - idea that algorithm should be written once
- element abstracted
- later makes you think (parametric) polymorphism


## variable, type, and function templates
``` cpp
template <typename T>
struct pair {
	pair(const T& first, const T& second) : first{first}, second{second} {}

	T first;
	T second;
};
```
- template argument deduction
	- `pair moreKittens = {Kitten{"Lionel", Kitten{"J"}}}`
	- `int smaller = min(1,2)`
	- can be deduced from C++17

## parameters: types, literals, templates
- templates may be parameterized on more than types
	- literals: int, functions, references, enums

```
template <class T, std::size_t N>
struc

```
can also pass template of templates too
## pragmatic usage issues
the complete definition of a template must exist before the template is instantiated
- this is why you can't have an implemented your functions in a seperate cpp file, they have to go in the header as well

templates are not checked until instantiated
- test templates before working important

templates have defaults -> `class T = std::string, class C = std::vector<T>` means that T will default for string if not given
- you want things that will be switched out on the right and not so much on the left
- this means `SmallRoster<Kitten>` would work for that template

methods and constructors can be templated
- need `typename T::iterator * p` if you want a pointer to T and not accidentaly multiply

## specialization
sometimes need type behave differently for different parameters
- generic implementations guides where necessary
- optimization (op X on matrix)
- correctness constraints
- decoupled interfaces

achieved through **template specialization**

``` cpp
namespace std {
	template < class Key >
	struct hash;
}
```