---
title: "hope health action haiti platform full-stack architecture overview"
date: 2024-05-08t07:50:00z
draft: false
tags: ["guide"]
---

## background
this report is written as part of my final report for [(cmpt416 - special research project) with dr. brian fraser](https://opencoursehub.cs.sfu.ca/bfraser/grav-cms/cmpt415/home). I spent 8 month developing for a hospital data reporting platform in Haiti in partnership with [Hope Health Action](https://www.hopehealthaction.org/). Here's the [GitHub Project](https://github.com/drbfraser/HHA-HaitiHospital) and [my contributions](https://github.com/drbfraser/HHA-HaitiHospital/commits/main/?author=brianrahadi).


## 1. introduction
Hope Health Action (hha) - haiti hospital web application is a hospital web application designed to help hospital administrators in haiti hospitals manage their tasks. features include collecting department reports, case studies, broken equipment, employee of the month, and communicating via message boards. the app is also designed to work in english and french using its internalization feature through translated english and french json files.
this report is designed to be an in-depth walk-through of the repository, its full-stack architecture, development, testing, ci/cd pipeline, and tips and tricks on developing the project efficiently and effectively.

in this report, the sections are not structured sequentially in terms of knowledge prerequisite. thus, it is still an effective way to follow the report non-sequentially prioritizing the weak topics first.

## 2. project overview

the project is a monolith that uses react and typescript on the front end, node.js, and express on the back end, and mongodb for the database. the stack is quite well-known as the mern stack, which is a full javascript (typescript) stack that enables developers to easily use common patterns, programming paradigms, and similar contexts across the client-server folder.

![[posts/attachments/hha-1-home-page.png]]

## 3. client-side development

the client development relates to every change under `client` folder. the client architecture uses react, bootstrap for styling, formik for form validations, axios for dealing with network requests.

due to the nature of react, the component is made as reusable as possible. thus, react components under `components` folder are written to be reused by other react components. react components linked with the url route are under the `pages` folder, which usually uses the underlying react component under `components` folder.

the react code is written with react function components for simplicity, readability, integration with hooks api, and safer writing using the functional programming paradigm.

the entry point on this app is in `client/src/index.tsx`. it is developed in react strict mode, hence some requests can be fetched twice during the development phase to find common bugs. the `index.tsx` uses `app.tsx` for the true rendering logic.

`app.tsx` contains some wrapper for the authentication, context so that the lower-level component to be abstracted from the authentication and access details. it also handles the routing logic and maps all the paths from `routes.tsx` to the implemented `approute.tsx`. this `approute.tsx` is implemented mainly to handle the authentication and authorization details so that normal users are restricted from higher-level access.

### 3.1. folder structure

the client folder structure consists of:

- **api**: all api calls used from `pages` and `components` are stored here for organized and reusable access.
- **components**: react components that are not directly used for the route.
- **contexts**: react contexts are used to pass props from lower-level components without passing it every tree level. the example use case here is the toggle of the expanded sidebar.
- **constants**: constants used for various use cases like endpoints, dates, and type interfaces.
- **hooks**: custom react hooks used for the development project.
- **locales**: english and french json translation files for language support.
- **pages**: react components linked to the `react-router-dom` route.
- **utils**: helper functions for client development.

### 3.2. react hooks

react hooks allows using various react features in the react component. it allows accessing state, context, and handling the lifecycle of react components to make code more performant, flexible, and also enables code reusability and simpler component logic.

other than the commonly used `usestate` and `useeffect` hooks, many custom hooks are used to simplify handling logic.

first, `useauthstate` is used to fetch current user info in `user` datatype and is commonly used to check the user role. as 5 roles are found in the application, some user interfaces and capabilities are restricted to roles with higher access. it is more efficient than a regular api call as the data is cached and will not fetch another network request.

second, `usedepartmentdata` hook is used to easily get department data in a digestible format or access it as a key-value pair map for department id to name or department name to the department object itself.

third, `usetranslation` hook is used to translate strings. it returns a function `t` that will convert the translated key into its corresponding english or french translation according to the language setting. it also returns the `i18n` setting that can be used for various operations, including getting the current language. the `usetranslation` information is initialized in `i18n.tsx`, and the language setting can be changed from the sidebar.

### 3.3. components
components in this section are defined as any react components used for development. the discussion here is intended to give an example of the justification and thought process of some of the widely used components

#### 3.3.1. layout.tsx
the underlying layout react component consisting of the sidebar and header is an example of allowing components to be reused every time. react component under `pages` folder does not need to care about calling the sidebar and header component anymore, it only needs to provide the layout title name and whether it needs a back button or not.

#### 3.3.2. form component
forms are used a lot in the application. from the login page, department reports, and employee of the month creation.

the project utilizes `formik` to handle the login form and `react-hook-form`. these 2 libraries have relatively similar use cases. the login page form only has 2 inputs but has extensive validation and error management due to the nature of the login page.

for a form implementation that uses `react-hook-form`, we can use an example of `employeeofthemonthform` component designed to handle add and update inputs. this component was only originally intended to add employee of the month but was refactored to be more generic. thus, the underlying `onsubmit` function is handled by the parent props of `employeeofthemonthaddform` and `employeeofthemonthupdateform`. the generic form takes an optional `employeeofthemonth` data only if it's an update form to have its original data pre-filled.

![[posts/attachments/hha-3-form.png]]

#### 3.3.3. filterable table
filterable table is one of the core features as part of the hha-haiti platform. it is used in department reports, case studies, biomechs, and employee of the month. it supports global search, column-based search, date-range filters, and sorting and is compatible with our internalization feature.

![[posts/attachments/hha-2-filterable-table.png]]

the entrance of this feature is in filterabletable.tsx file. sorts and filters are done client-side utilizing @tanstack/react-table.

for the internalization feature, when providing the columns data of type filterablecolumndef[], we need to provide the cell as it overrides the accessorkey and accessorfn for displaying the content. filterfn may also need to be provided if the data type is string, and compilation and existing sorting and filtering mechanisms will work fine.

## 4. server-side development

the server development relates to every change under `server` folder. the server architecture uses node.js, express, and passport for user authentication.

just like the entry point of the client-side development starts in `client/src/index.tsx`, the entry point equivalent in server resides in `server/src/server.ts`.

in summary, it does 4 things here:

1. creates the express instance server and configures the port for the server instance to listen to.
2. sets up the middleware, which does many things here:
   - **static file serving**: middleware to serve static files from the public directory.
   - **cross-origin resource sharing (cors)**: middleware to configure cors options to allow cross-origin requests from specified origins.
   - **body parsing**: middleware to parse json and url-encoded request bodies.
   - **prometheus middleware**: middleware to collect metrics related to http requests.
   - **cookie parsing**: middleware to utilize cookie-parser to parse cookies.
   - **passport initialization**: middleware to initialize passport for authentication.
   - **csrf protection**: middleware to have csrf protection to use the csurf middleware.
3. connects the server to the mongodb database instance.
4. sets up the server with the configured port to listen to the routes from `routes.ts` file.

### 4.1. folder structure

the server source folder structure consists of:

- **exceptions**: custom exceptions used to handle different cases of responses and errors. there is not too much work here other than defining various http response codes and errors.
- **logger**: folder containing logger files to instantiate the logging operations.
- **middleware**: middleware folders used variously in the entry point `server.ts` file.
- **models**: model files to create the mongoose schema and model. most of the types come from the common folder as it is shared with the client files.
- **routes**: api routes files that are attached to the `server.ts` file. all the rest api endpoints and operation logic reside here.
- **sanitization**: sanitizes the api endpoints if the input contains an invalid format or causes dangerous bugs. there has not been much work as we have not identified many possibilities that can come from a wrong format, but more work around this area is always appreciated.
- **seeders**: seeds the database for development and production deployment to easily interact with the initial data and its expected format and to easily test server and end-to-end with cypress.
- **services**: mainly used to handle login schema and middleware authentication operations using jwt and local passport.
- **types**: currently only used to override express request so normal request can access user without explicitly providing the information.
- **utils**: contains various utility functions used in server operations.


## 5. mongodb database

mongodb is a nosql, document-oriented database program that utilizes json-like documents with optional schemas [2]. mongodb integrates well in this project as its json-like structure allows easy conversion to typescript interfaces, which are heavily used in client and server folders.

![[posts/attachments/hha-4-mongodb-er-diagram.png]]

the current database design is relatively simple. one weak thing to note here is that reportobject is still regarded as a generic object even though it is of type questiongroup. future work to make sure reportobject to be of type questiongroup is always welcomed for better type support and less prone to errors.

almost every type has 2 versions here. the one stored in the mongodb (also shown in this diagram) and the json equivalent type (ends in json suffix) passed to the client. the json equivalent for client use is bigger as the connecting relationships are converted into the object. if it has relationships like how user has departmentid, it will represent the whole department itself with all the fields rather than just the departmentid.

when fetching data in the server, the api will fetch the needed data and convert it into json counterparts using the implemented tojson function, which does another fetching for the missing data.

as of spring 2024 changes, these 2 versions are stored in the common folder to allow reusability and tight integration between client and server.

## 6. common folder

an effort has been made to ensure the front end and back end are tightly coupled, including introducing common folders to allow the client and server to use the same shared types as a single source of truth.

this means all the 9 interfaces shown in the diagram have the types and interfaces stored in the common folder. this was not the norm before, and adding/removing a field is a more repetitive process.

most of the interfaces have 2 versions as explained in the mongodb section. the mongodb version is for storing in the database, and the json version is for the client response. the interface will have 2 versions if it has any connection relations, as that means the key for the other interface will be converted into the whole interface.

## 7. testing

many tests have been written for the client and server folders. the testing files have not been tightly integrated with the github actions ci/cd pipeline, which will be discussed more in the subsequent section.

in this app, there are 4 types of tests being used:

1. **build compilation test** - not a standard maintained test, but every ci/cd needs to compile the code first, and failing to compile will instantly fail it. this can be tested locally using `npm run build` on the root folder.
2. **unit test** - tests a single isolated logic of the code. still nonexistent in clients though there is a plan to start it using jest. tested using mocha and chai in the server.
3. **integration test** - tests the combination of modules/logics works well together. the next step is after unit testing. same technologies for unit tests.
4. **end-to-end test** - tests the app using a browser operated with user-like behavior. operated using cypress though it is not part of the ci/cd pipeline.


### 7.1. client testing
currently, testing for client code has mostly relied on end-to-end tests with cypress. although it is good to have this, the client code needs to introduce more unit testing as it is faster, more specific, and can be easily included as part of the github ci/cd pipeline.

running a cypress test is slow and expensive as it runs a whole browser, thus more complicated to have it embedded in the regular ci/cd pipeline. to save cost, one way to make it viable is to run it in a pull request commit manually only after approval and it being the latest pr commit before merging. another way, if we want it to be more automated, is to only run the cypress test on the main branch on the latest commit after merging. not passing means the cypress test must be inspected and fixed or the pr be reverted.

currently, adding a jest unit test is in progress and is later to be integrated as part of the regular github ci/cd pipeline for every commit. the main thing to focus unit tests is the validation logic on the report as it is the main feature. it is fine not to test too much on other types that are too simple like leaderboard, though testing the score calculation is always appreciated. we need to focus deeply on the logic that is much more prone to be regressed and broken.

### 7.2. server folder testing
unlike client testing, unit and integration testing in the server has been quite extensive using mocha and chai. however, we always need to keep improving this as some works of the recent terms have been a bit lacking in testing.

focusing on testing, especially for server unit test logic is important to improve developer velocity on receiving feedback. some logic, especially the report questions is crucial to be tested early on as bugs in production can be dangerous for the customers.

future testing of the server files can focus on testing the behavior of the api endpoints by having a mock version of it, so it has a more realistic comparison rather than only checking what http response code it is giving back.

### 7.3. common folder testing
common folder testing has quite the same logic as server folder testing. it focuses on testing the report questions and questiongroup class. more work here is important and can be helpful whenever there is a new question validation logic or a new type of question.

## 8. ci/cd pipeline
continuous integration and continuous deployment (ci/cd) pipeline is a group of steps dedicated to deploying a new software version. it is a practice focused on improving delivering software using automation. continuous integration refers to integrating code changes into a shared repository verified with automated builds and tests to detect errors as soon as possible. continuous delivery refers to automatically deploying the software after every successful build to staging and production environments.

hha-haiti platform uses github actions for its ci/cd pipeline. the ci part contains validating and testing such as validating the format of files using prettier, building the common-server-client folders, and exporting the docker image tag. the cd part builds the docker publish image tag, deploys it to the server, and uploads it to docker hub for online versioning management.

in hha-haiti platform, every code pushed to any pull request will automatically trigger the ci part. this runs the validations and testing to ensure the system is not buggy and can be deployed later. it also exports docker image tags to manage artifacts and store software versions. this is useful in bigger projects to track regressions, but useful in case of fatal errors and needing to roll back to previous versions that do not have the bugs.

only committed code to the main branch will run the cd part of the github actions, which builds the docker image and deploys it to the production environment. this ensures resources are being used only for what is needed.

## 9. deployment
the hha haiti platform is containerized for client and server repo and runs using docker compose on sfu virtual machine for deployment.

if https://hhahaiti-dev.cmpt.sfu.ca/, it might be because the sfu vm not running and sfu it needs to be contacted for it to be rebooted. other instances of it not running are due to an error caused by server-side changes, the bug needs to be investigated, tracked, and fixed as soon as possible, but this has been a rare case in the past, though it will be much prone if real customers are using it in the future.

## 10. development tips and tricks
based on my experience working the hha-haiti repository and previous development suggestions to help build hha-haiti platform faster and higher in quality:

1. make sure prettier is always run on a git pre-commit. this ensures a similar styling structure across the repository. this should already be on by default.
2. utilize postman to test endpoints and test quickly if it's working.
3. when developing full-stack features, focus on developing how the high-level design for the request and response first. this means starting from the server changes and testing its behaviors using postman first rather than trying to make the client user interface and connecting it.
4. ensure some tests are added every time a new feature/mechanism. this can be a unit test for a small change or an added end-to-end test for cypress. currently, as cypress is not part of ci/cd pipeline, adding tests that are directly part of the pipeline is more important since it gives feedback automatically.
5. focus on typescript types to be strict so that future developments are better, easier to test, and catch bugs. while it does not affect customers directly, development velocity will be faster and less error-prone if the types are expected.
6. the most important thing is to communicate product requirements early and well to michael (representative from hha-haiti). this ensures all the changes that we are working on are integral for the customers and we are not doing wasted work.


## 11. closing remarks

working on the hha-haiti platform for 2 terms has been an enriching experience, there are many things to do and it may never realistically end. the big problem is the lack of direct knowledge transfer. normal development projects usually have some people staying to ensure that code changes are consistent throughout the timeline. thus, the art of self-learning and understanding the code of what it does becomes more precious. also, the judgment to know that an existing code has bad architectural decisions and fixing it is important.

the best resources to utilize here are fellow developers on the team who may have more knowledge, and past haiti developers if there are bigger issues to discuss. i am sure most developers will be willing to help here rather than spending hours trying to understand everything.

i hope this report guide helps understand the full-stack architecture of the hha-haiti platform.
