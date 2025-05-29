---
title: "projects"
date: 2022-08-22t10:20:08-08:00
draft: false
---
projects can be of many things, but here i am focusing on software-related projects that i build from clubs, hackathons, personal, or school

---

## sfucourses.com
![[Pasted image 20250529083059.png]]
I built sfucourses.com with the goal of exploring and scheduling SFU courses with the best user experience. Best user experience in here I define with
- having a very fast website load (thanks Next.js SSG)
- fewest steps possible to do anything (explore/ schedule course)
- decent UI that makes you come back

Key features include:
- Robust explore filter and substring search of title, description, instruction
- Find all offerings and reddit comments of a course
- Efficient scheduling with text search, timeblocking, and non-conflict course finder
- Share your schedule through links, image or import it to any calendar
- more TBD maybe

stack: next.js, typescript, sass, figma, github actions, reddit API, calendar API

<a target="_blank" href="https://github.com/brianrahadi/sfucourses">github</a>&emsp;
<a target="_blank" href="https://www.sfucourses.com/">website</a>
## api.sfucourses.com
![[Pasted image 20250529083606.png]]
To empower sfucourses.com, I built api.sfucourses.com. REST Server API and data extractor that provides courses and offerings data robustly.

I rebuilt the entire way data is handled. SFU provides their course outline but fetching it all is messy and their API data is not consistent (Unsure which field is required or optional).
Thus, I provided static-type checking and an API extractor script that regularly updates the data. 

It is also a good time to learn go as I built the entire API from scratch with just its standard library.

stack: go, gocron, postgresql, swagger, scalar

<a target="_blank" href="https://github.com/brianrahadi/sfucourses-api">github</a>&emsp;
<a target="_blank" href="https://api.sfucourses.com/">website</a>
## sfu software systems website (sfussss.org)
![[sfussss-website.png]]

spearheaded software systems website and github org. revamped the website, bought the domains, reviewed all the github PRs, migrated repo to typescript. I developed the course explorer feature to display all sosy courses and showing past and future offerings through python api scripting. also integrated sanity cms and created blog feature to show how beautiful sosy is.

stack: next.js, typescript, sass, figma, github actions, sanity cms

<a target="_blank" href="https://github.com/ssss-sfu/ssss-sfu.github.io">github</a>&emsp;
<a target="_blank" href="https://www.sfussss.org/">website</a>

## hope health action - haiti hospital
![[hha-homepage.png]]

developed website for hospitals in haiti as part of sfu research project through hope health action, a non-profit organization. features include storing department reports, message boards, case studies, broken kit reports, and employee of the month. 

stack: typescript, react, express, mongodb, passport, bootstrap, chai, and cypress

<a target="_blank" href="https://github.com/drbfraser/hha-haitihospital">github</a>

## studylingo
![[studylingo.png]]

built on hackthenorth '24. a chrome extension that summarizes the whole website and tests you in quizzes, also built with pomodoro timer. won best use of defang and cohere :D!

<a target="_blank" href="https://github.com/jrang188/hack-the-north-2024">github</a>&emsp;
<a target="_blank" href="https://devpost.com/software/studiolingo">devpost</a>&emsp;


## google maps memories
![[google-maps-memories.png]]

holds a special place in my heart built with my fav people at nwHacks '24. a web app that allows you to store `memories` (image and notes) anywhere through a globe view. A memory can be viewed immensively with google street view.

stack: T3 stack (typescript, tailwind css, trpc, drizzle, nextAuth), planetscale, and various google maps API,

<a target="_blank" href="https://github.com/marcusgchan/google-map-memories">github</a>&emsp;
<a target="_blank" href="https://devpost.com/software/google-maps-memories">devpost</a>&emsp;


## systemshacks website (systemshacks.com)
![[systemshacks-website.png]]

developed the website of the annual hackathon hosted by sfu software systems students society (ssss) along with other cool developers and designers. my work includes developing the section for navbar, hero, sponsors, and faqs. i also managed the migration and domain so it can work seamlessly with github pages.

stack: html, sass, figma, github actions

<a target="_blank" href="https://github.com/ssss-sfu/2023-roothacks">github</a>&emsp;
<a target="_blank" href="https://systemshacks.com/">website</a>

## mindfulu

![[mindfulu.jpeg]]

mindfulu centralizes information on mental health services offered by ubc, sfu and other organizations. it assists students in finding, learning about and using mental health resources through features like a chatbot, meditation mode and an interactive services map.

we secured honourable mentions at the ubc's nwhacks 2023, which is 5/133 teams :d.

<a target="_blank" href="https://github.com/lenawang03/nw-hacks-2023">github</a>&emsp;<a target="_blank" href="https://nw-hacks-2023.vercel.app/">website</a>&emsp;
<a target="_blank" href="https://devpost.com/software/mindfulu-eo6fbg">devpost</a>

## sfu indonesian association website (sfuia.org)

![[sfuia-website.png]]

simon fraser university indonesian association's website acts as the information hub for indonesian students at sfu. currently, we use next.js (framework of react.js) as it feels nicer to build with its routing, better images, and rendering. i decided to use contentful to allow people to contribute to the blog post easily without accessing the source code (easily published and editted).

stack: next.js, bootstrap, sass, contentful api (for blog), sendgrid api (for mail), vercel

<a target="_blank" href="https://github.com/sfuia/sfuia-website">github</a>&emsp;
<a target="_blank" href="https://www.sfuia.info/">website</a>

---

## parkland

![[parkland.jpg]]

a full-stack amusement park website that have many features. it allows user login, signup, and it has its own reviews page with full crud functionality. user can make their own cards as an entry ticket and add the balance using **stripe api**.

stack: express, node.js, postgresql, stripe api, weatherapi, mocha, chai

<a target="_blank" href="https://github.com/brianrahadi/parkland">github</a>&emsp;
<a target="_blank" href="https://www.youtube.com/watch?v=emdrgqq6-ty&list=plsmwgyc1l_v03d-kkraxcnumveb8k8ot_&index=2">youtube</a>

---

## pig locator

![[pig-locator.png]]

angular website to locate missing pigs with reports and maps stored as json in data manager api. location is visualized in a map built with leaflet and mapbox api. <br>
crud operation on reports is possible through the data manager api.

tech stack: angular, angular material, typescript, leaflet, mapbox api, data manager api

<a target="_blank" href="https://github.com/brianrahadi/pig-locator">github</a>&emsp;<a target="_blank" href="https://pig-locator.brianrahadi.com">website</a>&emsp;<a target="_blank" href="https://www.youtube.com/watch?v=piqzpufyscm&ab_channel=brianrahadi">youtube</a>

## the movie corner

![[movie.jpg]]

a movie database website to see list of movies based on various categories (popular, upcoming, action, drama, romance).

stack: react, bootstrap, axios, and tmdb api

<a target="_blank" href="https://github.com/brianrahadi/movie-list"> github</a>&emsp;<a target="_blank" href="https://movie-list-brianrahadi.vercel.app/">website</a>

---

## multithreaded chatroom

![[chatroom.png]]

a chatroom with many features built in java implemented with multithreading concepts where each client runs as a single thread. this chatroom allows everyone with the same ip address and port to chat with each other.

stack: java, socket

<a target="_blank" href="https://github.com/brianrahadi/java-multithreaded-chatroom"> github</a>

---

## amazing package deliveries tracker

![[package.png]]

a package deliveries tracker to store packages information and show the packages based on its status (all, overdue, upcoming). the packages information is stored in the server and uses **spring** to fetches/ updates the data. the component is separated with mvc (model-view-controller) architecture to ensure code is readable and understandable. received full grade in the last iteration.

stack: java swing, gson, spring

<a target="_blank" href="https://github.com/brianrahadi/package-tracker"> github</a>

---

## arcade games

![[arcade-games.gif]]

a fun arcade game that lets you play ping-pong, snake, and crossing road. this game is built with object-oriented programming paradigm to make code more reusable and clearer to see.

stack: python, turtle

<a target="_blank" href="https://github.com/brianrahadi/arcade-games"> github</a>

## rename unzipper script

![[rename-unzipper.gif]]

python script to rename and unzip all students' files to be easily opened and ordered alphabetically. though simple, it has saved me tons of time in marking students' assignments.

stack: python

<a target="_blank" href="https://github.com/brianrahadi/rename-unzipper"> github</a>
