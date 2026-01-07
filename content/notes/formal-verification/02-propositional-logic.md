### syntax
atom 
- truth symbols true and false
- propositional variables (p, q, r)

Literal - atom a or negation

Formula - literal or application of logic connective

### semantics
Interpretation - map each propositional variables in formula to one truth value

given interpretation, formula evaluates to truth value
- satifying interpretation or model, **Model:** $F$ evaluates to $\top$ under $I$, $I \models F$  
- falsifying interpretation or counter-model, **Counter-model:** $F$ evaluates to $\bot$ under $I$, $I \not\models F$


#### inductive definition of semantics

##### base cases
$I \models \top \quad\quad I \not\models \bot$

$I \models p \;\;\; \mathbf{iff} \;\;\; I[p] = \top$

$I \not\models p \;\;\; \mathbf{iff} \;\;\; I[p] = \bot$

##### inductive cases

$I \models \neg F \quad\quad\quad \mathbf{iff} \quad\quad\quad I \not\models F$

$I \models F_1 \land F_2 \quad\quad \mathbf{iff} \quad\quad I \models F_1 ;\mathbf{and}; I \models F_2$

$I \models F_1 \lor F_2 \quad\quad \mathbf{iff} \quad\quad I \models F_1 ;\mathbf{or}; I \models F_2$

$I \models F_1 \to F_2 \quad\quad \mathbf{iff} \quad\quad I \not\models F_1 ;\mathbf{or}; I \models F_2$

$I \models F_1 \leftrightarrow F_2 \quad\quad \mathbf{iff} \quad\quad I \models F_1 ;\mathbf{and}; I \models F_2 ;\mathbf{or}$ $\quad\quad\quad\quad\quad\quad\quad\quad\quad\quad\quad\quad I \not\models F_1 ;\mathbf{and}; I \not\models F_2$
#### examples

$F: (p \land q) \to (p \lor q)$

$I: \{p \mapsto \top, q \mapsto \perp\}$

- $(T \land F) \to (T \lor F)$
- $F \to T$
- T

1. $I \models p$ since $I[p] = \top$
2. $I \not\models q$ since $I[q] = \perp$
3. $I \models \neg q$ by 2 and semantics of $\neg$
4. $I \not\models p \land q$ by 1, 2 and semantics of $\land$
5. $I \models p \lor \neg q$ by 1, 3 and semantics of $\lor$
6. $I \models F$ by 4, 5 and semantics of $\to$

#### satisfiability and validity

$F$ is **satisfiable** iff there exists an $I$ such that $I \models F$ 
$F$ is **unsatisfiable** iff there does not exist an $I$ such that $I \models F$ 
$F$ is **valid** iff for all $I$, $I \models F$
$F$ is **contingent** if $F$ is satisfiable but not valid 

$$\boxed{F \text{ is valid iff } \neg F \text{ is unsatisfiable}}$$


1. if F is satisfiable is $\neg F$ unsatisfiable, NO!

sat, unsat, or valid?
1. $p \land q$, sat but not valid
2. $p \land \neg(q \to p)$, unsat

##### deciding satisfiability and validity
procedure for checking satisfiability can also decide validity. why?

2 simple techniques.
1. truth table method: search-based
	1. cons: impractical, need to list $2^n$ interpretation, doesnt work for logic with inf domains
2. semantic argument method: deduction-based
	1. proof by contradiction, assume F is not valid, there exists falsifying interpretation I such that I $\not\models$ F

##### Proof Rules

##### Rule 1
$$\frac{I \models \neg F}{I \not\models F}$$

Deduce to

$$\frac{I \not\models \neg F}{I \models F}$$

##### Rule 2
$$\frac{I \models F \land G}{I \models F \land I \models G}$$

Deduce to
$$\frac{I \not\models F \land G}{I \not\models F \lor I \not\models G}$$

##### Rule 3

Based on Semantics of disjunction

$$\frac{I \models F \land G}{I \not\models F | I \not\models G}$$

Deduce to

$$\frac{I \not\models F \land G}{I \not\models F \land I \not\models G}$$
##### Rule 4

Based on semantics of implication,
$$\frac{I \models F \to G}{I \models F \mid I \models G}$$

From $F \to G$ we can deduce

$$\frac{I \models F \to G}{I \models F \land I \models G}$$

#### Rule 5
 Based on the semantics of iff $$\frac{I \models F \leftrightarrow G}{I \models F \land G \mid I \models \neg F \land \neg G}$$
Similarly $$\frac{I \models F \leftrightarrow G}{I \models F \land \neg G \mid I \models \neg F \land G}$$
##### Rule 6
Derive contradiction,
$$\frac{I \models F \land I \not\models F}{I \models \bot}$$