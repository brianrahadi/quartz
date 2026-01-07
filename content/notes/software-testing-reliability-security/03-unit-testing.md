before - [[02-testing-intro]]

note: same as [[08-unit-testing]]
## test suite design
objectives
- functional correctness
- non-functional attributes

![[Pasted image 20241208161141.png | 500]]
automated testing pyramid

## unit testing
ensure each functionality of each component work in isolation

in practice, debates on
- isolation degree
- big vs small vs unit

advantage - rapid feedback and quick refactoring

dual view
- specify expected behavior
- executable specification

used to guide in TDD
- empirical evidence - rapid feedback important, but TDD not

### unit test principles
- focus on isolation
- **simple** to set up and run
- **easy** to understand
- **maintain** like product code

### GoogleTest
commonly used framework for c++

``` cpp
TEST(TriangleTest, isEquilateral) {
	Triangle tri{2, 2, 2};
	EXPECT_TRUE(tri.isEquilateral());
}
```

test cases written as functions
- **assert** oracles terminate when fail
- **expect** allow program to conitnue running

some test requires common setUp and tearDown
- grouped into test fixtures

``` cpp
class StackTest : public ::testing::Test {
	protected:
		void SetUp() override {
			
		}
		void TearDown() override {}
}
```

then used in test cases defined with TEST_F
``` cpp
TEST_F(StackTest, ...) {...}
```
- TEST_F specifies tests that use fixtures
- EXPECT_EQ is assertion or oracle we have not seen before

### designing unit test

steps
- Arrange - set up scenario
- Act - run the scenario
- Assert - check outcome

design
- common structure
- test run in isolation

### common patterns
check state
- final state
	- prepare initial state
	- run test
	- check final state
- pre and post conditions
	- check initial and final state
- relative effects
	- check final relative to initial
- round trips
	- check behavior on transform/ inverse transform pairs

checking interactions/ behaviours
- common to use mocks (fakes)
	- mock vs stub = behavioural testing vs state testing

### testability
what makes testing hard?
- dependencies
	- connections
	- singletons
	- nondeterminisms
	- static binding

key points:
- mocks and stubs to isolate components
- dependency injection to allow use mocks and stubs when necessary
- techniques can lead to boilerplate code
- reduce pain
	- frameworks exists to automate

### GoogleMock
steps
1. derive class wish to fake
2. replace virtual calls with uses of MOCK_METHOD
3. use fake class in tests
4. specify expectations before EXPECT_CALL
5. expectations are automatically checked
``` cpp
InSequence dummy;
EXPECT_CALL(mockThing, foo(Ge(20)))
	.Times(2)
	.WillOnce(Return(100))
	.WillOne(Return(200))
EXPECT_CALL(mockThing, ...)
```
https://martinfowler.com/articles/mocksArentStubs.html
