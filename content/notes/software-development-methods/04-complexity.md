abstract - foundation before code

## why care about software complexity
goal of eng - science + practice + engineering economy
goal of soft-eng = cs + practice + engineering economy

good eng develop economical solutions:
- lower costs, defects, liabilities
- increase exensibility

intuition not enough, complexity nuanced

## judgement
every problem has multiple sols

good softeng
- evaluate costs
- across many solutions
- choose most effective

different solutions may
- have same functional req
- but diff non-functional (perf, maintain)
- example: monolith vs microservice

## ravages of time
cost must be considered over time
- low cost immediate but expensive

good judgement - code cope with evolution (refactor, design)

## complexities
in here, refer more to design and code

complexities - capture idea software hard to work with

### McCabe/ cyclomatic complexity

complexity - # of independent behaviours

count linear independent path through program
![[Pasted image 20241208115809.png | 300]]

$$
M = edges - nodes + 2 * connected comp
$$

M = 7 - 6 + 2 x 1 = 3

just measure function size, and even then, diff implementation have diff measure

### philosophical definitions
being too specific get in way of defining general concept

instead, consider intuitive effects

general forms of complexity:
- inherent (essential)
- incidental (accidental

## refining complexities for code
consider symptoms for code
- change amplication - simple change requires many loc change
- cognitive load - dev needs to know great deal to complete
- unknowns unknowns - portions of code to modify unindentified

common causes to attack
- dependencies - understand code relations
- obscurity - important info about code not obvious

## complexity signs
signs
- coupling - change to one cascades to many
	- content - access implementation of another comp
	- common global data
	- subclassing
	- temporal - RAII, fluent interface
	- pass data
	- independence
- fan in vs. fan out
	- high fan may be bad design
	- fan in - # methods (thing) that use given method
		- good for low-levels
	- fan out - # methods called by the method
		- good for high-level
	- ![[Pasted image 20241208121400.png]]
		- left, high fan out - foo calls many other methods
		- right, high fan in - foo called by many methods
- layers and stratification
	- new code -> wrapper api -> external lib
- cohesion - piece within should be coupled

other ways to seek complexity
- version control logs
- whitespace analysis
- visual static coupling to assess potential risk
- more guidance - your code as crime scene

## technical debt
temporarily allowing complexity to provide value in other dimension
- hard first, easy later

technical debt - making temporarily bad choice that needs to be changed later

## summary
intuition about classic and modern notions of complexity

softeng - judgement about tradeoffs and balancing objectives