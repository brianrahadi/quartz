---
title: "term review - fall 2022"
date: 2022-12-20t14:23:20-08:00
draft: false
tags: ["term-review", "reflections"]
---

## intro
fall 2022 has been quite a rough ride as it's my first time taking 4 cmpt courses. there were some moments where i didn't get the time to revise some content, but overall, this term was pretty good.


## courses
### cmpt 300 - operating systems i (hazra imran)
**course experience**: 4/5 <br>
**pros**: interesting assignments, decent lectures (recorded), and finish-for-marks class exercises <br>
**cons**: the exam is quite tricky and assignment requirements might not be detailed enough. <br>
**self-feedback**: start assignments super early to allow more time to ask later

i really enjoyed cmpt300 offering by dr. hazra. she is quite understanding and assignments are really interesting (programs related to os concepts in c). it could have been a 5/5 for me, but there were mainly 2 reasons: <br>
-  some mcs in the exam cover contents that are mentioned quite rarely and you need to really understand all the way to get full marks from the select all options.
-  the assignment requirements can be a bit vague and you need to decipher every single thing. there are some corner cases that are not yet answered. usually, the implementation of these corner cases is up to us in the end. having some test cases would definitely help a lot in easing students' anxiety.

another thing is how hard and time-consuming her final is. i was caught off guard as i have plenty of times in two of her midterms.

overall, i think our instructor has tried her best to make this tough course enjoyable. i wouldn't mind taking another course with dr. hazra again.

### cmpt 383 - comparative programming languages (anders miltner)
**experience**: 5/5 <br>
**pros**: all vitamins and assignments have test cases, and engaging lectures <br>
**cons**: 98+ for a+ (╯°□°)╯︵ ┻━┻ <br>
**self-feedback**: make sure all corner cases are solved, some marks are off as i already felt confident having passed all the given test cases

cmpt383 by anders covers haskell and rust. we learned the concepts of functional programming in haskell and how rust handles memory very elegantly.

in the first half, i was quite intrigued by what haskell is capable of. i didn't understand functional programming at all in the beginning. basically, you cannot do any loops in haskell and every variable is a constant. yes, you heard it, it's constant. 

the difference between haskell and most programming languages (python, java, c) is that haskell is **declarative** while the former is **imperative**. declarative is telling the program what you want (without specifying how to get it), while imperative is telling the program what to do. while declarative seems more work, it might be more concise (beautiful) in some cases.

``` hs
alldivisors :: int -> [int]
alldivisors n = [x | x <- [n, n-1..1], mod x n == 0]
-- haskell function that returns all divisors from a number in ascending order
```

``` py
def all_divisors(n: int) -> [int]:
    res = []
    for i in range(1, n):
        if n % i == 0:
            res.append(i)
    return res
## the same function written in python
```

in this example, i would say the haskell code is more concise and readable than the python code. however, most things are inefficient in functional programming (as speed is not their main forte). for example, arrays are linked lists in haskell. this makes the access time o(n) for arrays.

the second half is about rust, i find rust to be very elegant and solve a lot of problems that c has. to make it simple, you won't be having any dangling pointers in rust due to its ownership features. 

> each variable in rust can only have 1 owner and this value will be dropped if the owner goes out of scope.

thus, compiling code can be harder in rust as they are more strict. however, you can rest assured that memory problem will happen way less likely if your code were to compile.

### cmpt 371 - data communications and networking (ouldooz baghban karimi)
**experience**: 3/5 <br>
**pros**: organized canvas, caring lecturer, has recorded video (summary) <br>
**cons**: lecture is a bit bland, homework is mostly answered already answered in the textbook <br>
**self-feedback**: read the textbook if needed as sometimes slides are way too abstract.

ouldooz is caring and takes an effort in trying to make students want to succeed. however, i felt networking itself is a course that is quite boring for most students (as seen from the attendance rate compared to other courses). most problems here are theories and i don't mind learning the theories, but compared to classes like operating systems, i don't find the theory in this course to be connected to each other. thus, it makes it a bit hard to understand the bigger picture of what this course has to offer.

an improvement that could have been made is to have programming problems that relate to the theory. this would make the course to be more bearable.


### cmpt 272 - web i - client-side development (bobby chan)
**experience**: 3.5/5 <br>
**pros**: interesting topics, very hands-on lecture<br>
**cons**: hands-on can be very hard if you don't understand, hard-to-ace exams <br>
**self-feedback**: annotate key topics as bobby tends to be fast-paced

i had the pleasure to take the first offering of cmpt 272. this course teaches you all about html, css, javascript, typescript, angular, and apis. 

the typescript and angular parts are quite useful and i am thrilled to know the ins and outs of building websites with them.

bobby is very hands-on and i need to make sure to catch up with the materials to understand what he is talking about. class is not recorded, and while the lecture codes are posted in gitlab, it is harder and might take way more time in understanding what the code does compare to just seeing him code in real-time.

overall, i find this course to be 3/5 as bobby likes to put a lot of weight in midterms and finals. the average for the final was 60 and it is mandatory to pass the final to pass the course.

course final project: [pig locator](../../projects/#pig-locator) 

## what went well
- able to finish all assignments on-time

## what could have been better
- time management can be fixed in the second half
- rarely attended office hours as assignments are done near the deadline

## conclusion
overall, i really enjoyed this term's courses. nothing much to say. feel free to contact me if you have any questions :d.