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
- You can look up reviews on a professor-level, but not course-level, and course-level reviews are more important imo as you can see how each professor compares in a course.
- Also, professor with a rating of 3 can mean the person is a 1 for course A and 5 for course B, so you have to average the review out only for that specific course.
- I also just want a web with nicer UX and the ability to share your schedule

I learned a lot more about web dev, golang, making it accessible and fast with SSR, docker, backend deployment, and most importantly, pennypinchmaxxing by using all the free deployment tools - vercel, render, uptimerobot is da goats.

repositories:
- https://github.com/brianrahadi/sfucourses - Typescript + React Next.js Website
- https://github.com/brianrahadi/sfucourses-api - Golang API Server + Scraper
- https://github.com/brianrahadi/rmp-scraper - Python Selenium Scraper

## architecture
``` mermaid
flowchart TB
  style EXT fill:transparent,stroke:#f59e0b,stroke-width:2px
  style SCRAPER fill:transparent,stroke:#3b82f6,stroke-width:2px
  style API fill:transparent,stroke:#0ea5e9,stroke-width:2px
  style FE fill:transparent,stroke:#10b981,stroke-width:2px
  style EXT_APP fill:transparent,stroke:#8b5cf6,stroke-width:2px

  subgraph EXT["External data sources"]
    SFU["SFU Outlines API<br/><i>sfu.ca/outlines</i>"]
    RMP["RateMyProfessors<br/><i>ratemyprofessors.com</i>"]
  end

  subgraph SCRAPER["rmp-scraper (Python)"]
    SC["Scrapy spider<br/>dumps professors → JSON"]
  end

  subgraph API["api.sfucourses.com Go Server"]
    FETCH["Data extractor script<br/>fetches &amp; normalises SFU data"]
    JSON["JSON files on disk<br/>outlines, sections, instructors, reviews"]
    SERVER["HTTP server<br/>std lib · Docker"]
    UPDATE["POST /update<br/>password-protected"]

    EP1["GET /v1/rest/outlines"]
    EP2["GET /v1/rest/outlines/{dept}/{num}"]
    EP3["GET /v1/rest/sections/{term}/{dept}/{num}"]
    EP4["GET /v1/rest/instructors"]
    EP5["GET /v1/rest/instructors/{name}"]
    EP6["GET /v1/rest/reviews/{dept}/{num}"]

    FETCH --> JSON
    JSON --> SERVER
    UPDATE --> JSON
    SERVER --> EP1
    SERVER --> EP2
    SERVER --> EP3
    SERVER --> EP4
    SERVER --> EP5
    SERVER --> EP6
  end

  subgraph FE["sfucourses.com Next.js"]
    RQ["React Query<br/>client-side cache"]

    subgraph HOME["/ home"]
      H1["GET /v1/rest/outlines"]
    end
    subgraph EXPLORE["/explore"]
      EX1["GET /v1/rest/outlines"]
      EX2["GET /v1/rest/outlines/{dept}/{num}"]
      EX3["GET /v1/rest/sections/{term}/{dept}/{num}"]
      EX4["GET /v1/rest/instructors"]
      EX5["GET /v1/rest/reviews/{dept}/{num}"]
    end
    subgraph SCHEDULE["/schedule"]
      S1["GET /v1/rest/outlines"]
      S2["GET /v1/rest/outlines/{dept}/{num}"]
      S3["GET /v1/rest/sections/{term}/{dept}/{num}"]
      S4["localStorage + URL params<br/>.ics export · share link"]
    end
    subgraph GRAPH["/graph"]
      G1["cached LLM-parsed strict json CSV"]
      G2["GET /v1/rest/outlines/{dept}/{num}"]
    end
    subgraph PROGRESS["/progress"]
      P1["GET /v1/rest/outlines/{dept}/{num}"]
      P2["GET /v1/rest/reviews/{dept}/{num}"]
      P3["localStorage<br/>degree progress state"]
    end

    RQ --> HOME
    RQ --> EXPLORE
    RQ --> SCHEDULE
    RQ --> GRAPH
    RQ --> PROGRESS
  end

  SFU -->|"periodic fetch"| FETCH
  RMP -->|"scraped"| SC
  SC -->|"POST /update"| UPDATE

  EP1 -->|"React Query"| RQ
  EP2 -->|"React Query"| RQ
  EP3 -->|"React Query"| RQ
  EP4 -->|"React Query"| RQ
  EP5 -->|"React Query"| RQ
  EP6 -->|"React Query"| RQ
```

Note: the only AI-generated content on this website so far, but human-reviewed ;))

## highlights
- Golang API Scraping + Server is annoying and fun, having to aggregate all these data from SFU hourly to put into a better API server
- scraping RMP is quite a pain, had to run PC for an entire day to get the initial data
   - While the initial provided RMP scraper code was working initially, the code is not built for SFU size (too many professors), have to parallelize it into multiple department pages scrapes
   - A lot of bad data too, so had to do some data cleaning
- Next.js SSR maxxing to make sure web is super fast, I used vercel speed insights to ensure its on the >95 score.
- parsing prerequisites from natural language to structured JSON to graph structures with prompt engineering :p
- hitting up people on linkedin to ask for feedbacks and ideas
- had to do the linkedin marketing, [first](https://www.linkedin.com/posts/brianrahadi_sfu-students-course-registration-times-are-activity-7341916811694678017-u33e?utm_source=share&utm_medium=member_desktop&rcm=ACoAAC5DfKcBXiam4fcN-wFWur35ZJPkwABXPwI), [second](https://www.linkedin.com/posts/brianrahadi_sfu-students-spring-enrollment-email-is-activity-7385085787073208320-lzvc?utm_source=share&utm_medium=member_desktop&rcm=ACoAAC5DfKcBXiam4fcN-wFWur35ZJPkwABXPwI)

acknowledgements:
- https://mcgill.courses for the exploring UX
- [Emerald Wu](https://www.linkedin.com/in/emerald-wu/) for Scheduling Feature
- [Faiz Mustanzar](https://www.linkedin.com/in/faizmustansar/) for initial RMP Scraper code
- https://treehouse.place for the banger coworking sessions
- [Anderson Tseng](https://github.com/Highfire1/Highfire1) for the prerequisite graph and parsing
