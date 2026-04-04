---
title: "making sfucourses"
date: 2026-04-04T06:51:54
draft: false
tags: ["reflections"]
---

I realized i never really made a story about sfucourses here, better late than never hehe.

Making sfucourses was pretty fun. The last checklist thing I want to do in Uni is to actually build something people use. I'm glad it did, around 4k website visits were made during the registration week and people were making their schedule link and screenshots all over the discord.

so what problem did it solve? I started it back in late 2024 because i was annoyed with the current way of looking up for courses, scheduling it, and the disjointed course reviews.
- Looking up courses and scheduling in gosfu requires you to login and go through a couple of pages, which is annoying.
- You can look up reviews on a professor-level, but not course-level, and course-level reviews are more important imo as you can see how each professor compares.
    - Professor with a rating of 3 can mean the person is a 1 for course A and 5 for course B, so you have to keep that in mind.
- I also just want a web with nicer UX and the ability to share your schedule

I learned a lot more about web dev, golang, making it accessible and fast with SSR, docker, backend deployment, and most importantly, pennypinchmaxxing by using all the free deployment tools - vercel, render, uptimerobot is da goats.

repositories:
- https://github.com/brianrahadi/sfucourses - Typescript + React Next.js Website
- https://github.com/brianrahadi/sfucourses-api - Golang API Server + Scraper
- https://github.com/brianrahadi/rmp-scraper - Python Selenium Scraper

highlights:
- Golang API Scraping + Server is annoying and fun, having to aggregate all these data from SFU hourly to put into a better API server
- scraping RMP is quite a pain, had to run PC for an entire day to get the initial data
   - While the initial provided RMP scraper code was working initially, the code is not built for SFU size (too many professors), have to parallelize it into multiple department pages scrapes
   - A lot of bad data too, so had to do some data cleaning
- Next.js SSR maxxing to make sure web is super fast, I used vercel speed insights to ensure its on the >95 score.
- parsing prerequisites from natural language to structured JSON to graph structures with prompt engineering :p
- hitting up people on linkedin to ask for feedbacks and ideas
- had to do the linkedin marketing, [first](https://www.linkedin.com/posts/brianrahadi_sfu-students-course-registration-times-are-activity-7341916811694678017-u33e?utm_source=share&utm_medium=member_desktop&rcm=ACoAAC5DfKcBXiam4fcN-wFWur35ZJPkwABXPwI), [second](https://www.linkedin.com/posts/brianrahadi_sfu-students-spring-enrollment-email-is-activity-7385085787073208320-lzvc?utm_source=share&utm_medium=member_desktop&rcm=ACoAAC5DfKcBXiam4fcN-wFWur35ZJPkwABXPwI)

acknowledgements:
- https://mcgill.courses
- [Emerald Wu](https://www.linkedin.com/in/emerald-wu/) for Scheduling Feature
- [Faiz Mustanzar](https://www.linkedin.com/in/faizmustansar/) for initial RMP Scraper code
- https://treehouse.place for the banger coworking sessions
- [Anderson Tseng](https://github.com/Highfire1/Highfire1) for the prerequisite graph
