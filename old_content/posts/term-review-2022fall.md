---
title: "Term Review - Fall 2022"
date: 2022-12-20T14:23:20-08:00
draft: false
tags: ["term-review", "reflection"]
---

## Intro
Fall 2022 has been quite a rough ride as it's my first time taking 4 CMPT courses. There were some moments where I didn't get the time to revise some content, but overall, this term was pretty good. 


## Courses
### CMPT 300 - Operating Systems I (Hazra Imran)
**Course Experience**: 4/5 <br>
**Pros**: Interesting assignments, decent lectures (recorded), and finish-for-marks class exercises <br>
**Cons**: The exam is quite tricky and assignment requirements might not be detailed enough. <br>
**Self-feedback**: Start assignments super early to allow more time to ask later

I really enjoyed CMPT300 offering by Dr. Hazra. She is quite understanding and assignments are really interesting (programs related to OS concepts in C). It could have been a 5/5 for me, but there were mainly 2 reasons: <br>
-  Some MCs in the exam cover contents that are mentioned quite rarely and you need to really understand all the way to get full marks from the select all options.
-  The assignment requirements can be a bit vague and you need to decipher every single thing. There are some corner cases that are not yet answered. Usually, the implementation of these corner cases is up to us in the end. Having some test cases would definitely help a lot in easing students' anxiety.

Another thing is how hard and time-consuming her final is. I was caught off guard as I have plenty of times in two of her midterms.

Overall, I think our instructor has tried her best to make this tough course enjoyable. I wouldn't mind taking another course with Dr. Hazra again.

### CMPT 383 - Comparative Programming Languages (Anders Miltner)
**Experience**: 5/5 <br>
**Pros**: All vitamins and assignments have test cases, and engaging lectures <br>
**Cons**: 98+ for A+ (╯°□°)╯︵ ┻━┻ <br>
**Self-feedback**: Make sure all corner cases are solved, some marks are off as I already felt confident having passed all the given test cases

CMPT383 by Anders covers Haskell and Rust. We learned the concepts of functional programming in Haskell and how Rust handles memory very elegantly.

In the first half, I was quite intrigued by what Haskell is capable of. I didn't understand functional programming at all in the beginning. Basically, you cannot do any loops in Haskell and every variable is a constant. Yes, you heard it, it's constant. 

The difference between Haskell and most programming languages (Python, Java, C) is that Haskell is **declarative** while the former is **imperative**. Declarative is telling the program what you want (without specifying how to get it), while imperative is telling the program what to do. While declarative seems more work, it might be more concise (beautiful) in some cases.

``` hs
allDivisors :: Int -> [Int]
allDivisors n = [x | x <- [n, n-1..1], mod x n == 0]
-- Haskell function that returns all divisors from a number in ascending order
```

``` py
def all_divisors(n: int) -> [int]:
    res = []
    for i in range(1, n):
        if n % i == 0:
            res.append(i)
    return res
## The same function written in python
```

In this example, I would say the Haskell code is more concise and readable than the python code. However, most things are inefficient in functional programming (as speed is not their main forte). For example, arrays are linked lists in Haskell. This makes the access time O(n) for arrays.

The second half is about rust, I find rust to be very elegant and solve a lot of problems that C has. To make it simple, you won't be having any dangling pointers in rust due to its ownership features. 

> Each variable in rust can only have 1 owner and this value will be dropped if the owner goes out of scope.

Thus, compiling code can be harder in rust as they are more strict. However, you can rest assured that memory problem will happen way LESS likely if your code were to compile.

### CMPT 371 - Data Communications and Networking (Ouldooz Baghban Karimi)
**Experience**: 3/5 <br>
**Pros**: Organized canvas, caring lecturer, has recorded video (summary) <br>
**Cons**: Lecture is a bit bland, Homework is mostly answered already answered in the textbook <br>
**Self-feedback**: Read the textbook if needed as sometimes slides are way too abstract.

Ouldooz is caring and takes an effort in trying to make students want to succeed. However, I felt networking itself is a course that is quite boring for most students (as seen from the attendance rate compared to other courses). Most problems here are theories and I don't mind learning the theories, but compared to classes like Operating Systems, I don't find the theory in this course to be connected to each other. Thus, it makes it a bit hard to understand the bigger picture of what this course has to offer.

An improvement that could have been made is to have programming problems that relate to the theory. This would make the course to be more bearable.


### CMPT 272 - Web I - Client-side Development (Bobby Chan)
**Experience**: 3.5/5 <br>
**Pros**: Interesting topics, very hands-on lecture<br>
**Cons**: Hands-on can be very hard if you don't understand, Hard-to-ace exams <br>
**Self-feedback**: Annotate key topics as Bobby tends to be fast-paced

I had the pleasure to take the first offering of CMPT 272. This course teaches you all about HTML, CSS, JavaScript, Typescript, Angular, and APIs. 

The Typescript and Angular parts are quite useful and I am thrilled to know the ins and outs of building websites with them.

Bobby is very hands-on and I need to make sure to catch up with the materials to understand what he is talking about. Class is not recorded, and while the lecture codes are posted in GitLab, It is harder and might take way more time in understanding what the code does compare to just seeing him code in real-time.

Overall, I find this course to be 3/5 as Bobby likes to put a lot of weight in midterms and finals. The average for the final was 60 and it is mandatory to pass the final to pass the course.

Course final project: [Pig Locator](../../projects/#pig-locator) 

## What went well
- Able to finish all assignments on-time

## What could have been better
- Time management can be fixed in the second half
- Rarely attended office hours as assignments are done near the deadline

## Conclusion
Overall, I really enjoyed this term's courses. Nothing much to say. Feel free to contact me if you have any questions :D.