---
title: Testing Intro
date: 2025-09-01
---

## why test
role of test - measure software quality to give confidence

what is testing? running program to see if it behaves as expected
- proving over infinite set impossible, have samples

testing
- dynamically runs program
- consider specific software
- run test cases
- identify diff

## test quality goals
- functional - expected output given input
- nonfunctional - output independent goals met
	- performance, scalability, security, documentation

## preliminary terminology
1. fault/ defect - flaws in static software
2. failure - observable, incorrect behaviour
3. error/ infection - incorrect internal state
4. latent defect - unobserved defect in delivered software


## test def

functional test cases have
- input `i` to provide program
- oracle `O` for expected bahavuir

so,
- `O(i) == P(i)` - pass
- `O(i) != P(i)` - fail

### test oracles

sometimes simple - unit test

sometimes tricky
- result strictly specified? (content, order, timing)
- program deterministic?

### sampling
problem: cannot check all possible inputs

so, find representative sample

## test approaches
- test until out of time
- test until out of money
- identify redundant input based on spec (blackbox)
- identify redundant input based on program structure (whitebox)
- identify poorly tested areas

after - [[03-unit-testing]]