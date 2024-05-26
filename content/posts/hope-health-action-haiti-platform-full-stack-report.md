---
title: "Hope Health Action Haiti Platform Full-Stack Architecture Overview"
date: 2024-05-08T07:50:00Z
draft: false
tags: ["guide"]
---

## Background
This report is written as part of my final report [(CMPT416 - Special Research Project) with Dr. Brian Fraser](https://opencoursehub.cs.sfu.ca/bfraser/grav-cms/cmpt415/home). I was able to get 99%, thus I hope this report can be quite helpful in general for those who are developing for this platform or just want to lurk the documents.


## 1. Introduction
Hope Health Action (HHA) - Haiti Hospital web application is a hospital web application designed to help hospital administrators in Haiti hospitals manage their tasks. Features include collecting department reports, case studies, broken equipment, employee of the month, and communicating via message boards. The app is also designed to work in English and French using its internalization feature through translated English and French JSON files.
This report is designed to be an in-depth walk-through of the repository, its full-stack architecture, development, testing, CI/CD pipeline, and tips and tricks on developing the project efficiently and effectively.

In this report, the sections are not structured sequentially in terms of knowledge prerequisite. Thus, it is still an effective way to follow the report non-sequentially prioritizing the weak topics first.

## 2. Project Overview

The project is a monolith that uses React and Typescript on the front end, Node.js, and Express on the back end, and MongoDB for the database. The stack is quite well-known as the MERN stack, which is a full JavaScript (Typescript) stack that enables developers to easily use common patterns, programming paradigms, and similar contexts across the client-server folder.

![[posts/attachments/hha-1-home-page.png]]

## 3. Client-side Development

The client development relates to every change under `client` folder. The client architecture uses React, Bootstrap for styling, Formik for form validations, Axios for dealing with network requests.

Due to the nature of React, the component is made as reusable as possible. Thus, react components under `components` folder are written to be reused by other react components. React components linked with the URL route are under the `pages` folder, which usually uses the underlying React component under `components` folder.

The react code is written with react function components for simplicity, readability, integration with Hooks API, and safer writing using the functional programming paradigm.

The entry point on this app is in `client/src/index.tsx`. It is developed in React strict mode, hence some requests can be fetched twice during the development phase to find common bugs. The `index.tsx` uses `App.tsx` for the true rendering logic.

`App.tsx` contains some wrapper for the authentication, context so that the lower-level component to be abstracted from the authentication and access details. It also handles the routing logic and maps all the paths from `routes.tsx` to the implemented `AppRoute.tsx`. This `AppRoute.tsx` is implemented mainly to handle the authentication and authorization details so that normal users are restricted from higher-level access.

### 3.1. Folder Structure

The client folder structure consists of:

- **api**: All API calls used from `pages` and `components` are stored here for organized and reusable access.
- **components**: React components that are not directly used for the route.
- **contexts**: React contexts are used to pass props from lower-level components without passing it every tree level. The example use case here is the toggle of the expanded sidebar.
- **constants**: Constants used for various use cases like endpoints, dates, and type interfaces.
- **hooks**: Custom React Hooks used for the development project.
- **locales**: English and French JSON translation files for language support.
- **pages**: React components linked to the `react-router-dom` route.
- **utils**: Helper functions for client development.

### 3.2. React Hooks

React Hooks allows using various React features in the React component. It allows accessing state, context, and handling the lifecycle of React components to make code more performant, flexible, and also enables code reusability and simpler component logic.

Other than the commonly used `useState` and `useEffect` hooks, many custom hooks are used to simplify handling logic.

First, `useAuthState` is used to fetch current user info in `User` datatype and is commonly used to check the user role. As 5 roles are found in the application, some user interfaces and capabilities are restricted to roles with higher access. It is more efficient than a regular API call as the data is cached and will not fetch another network request.

Second, `useDepartmentData` hook is used to easily get department data in a digestible format or access it as a key-value pair map for department ID to name or department name to the department object itself.

Third, `useTranslation` hook is used to translate strings. It returns a function `t` that will convert the translated key into its corresponding English or French translation according to the language setting. It also returns the `i18n` setting that can be used for various operations, including getting the current language. The `useTranslation` information is initialized in `i18n.tsx`, and the language setting can be changed from the sidebar.

### 3.3. Components
Components in this section are defined as any React components used for development. The discussion here is intended to give an example of the justification and thought process of some of the widely used components

#### 3.3.1. Layout.tsx
The underlying layout React component consisting of the sidebar and header is an example of allowing components to be reused every time. React component under `pages` folder does not need to care about calling the sidebar and header component anymore, it only needs to provide the layout title name and whether it needs a back button or not.

#### 3.3.2. Form component
Forms are used a lot in the application. From the login page, department reports, and employee of the month creation.

The project utilizes `formik` to handle the login form and `react-hook-form`. These 2 libraries have relatively similar use cases. The login page form only has 2 inputs but has extensive validation and error management due to the nature of the login page.

For a form implementation that uses `react-hook-form`, we can use an example of `EmployeeOfTheMonthForm` component designed to handle add and update inputs. This component was only originally intended to add employee of the month but was refactored to be more generic. Thus, the underlying `onSubmit` function is handled by the parent props of `EmployeeOfTheMonthAddForm` and `EmployeeOfTheMonthUpdateForm`. The generic form takes an optional `EmployeeOfTheMonth` data only if it's an update form to have its original data pre-filled.

![[posts/attachments/hha-3-form.png]]

#### 3.3.3. Filterable Table
Filterable Table is one of the core features as part of the HHA-Haiti Platform. It is used in department reports, case studies, biomechs, and employee of the month. It supports global search, column-based search, date-range filters, and sorting and is compatible with our internalization feature.

![[posts/attachments/hha-2-filterable-table.png]]

The entrance of this feature is in FilterableTable.tsx file. Sorts and filters are done client-side utilizing @tanstack/react-table.

For the internalization feature, when providing the columns data of type FilterableColumnDef[], we need to provide the cell as it overrides the accessorKey and accessorFn for displaying the content. filterFn may also need to be provided if the data type is string, and compilation and existing sorting and filtering mechanisms will work fine.

## 4. Server-side Development

The server development relates to every change under `server` folder. The server architecture uses Node.js, Express, and Passport for user authentication.

Just like the entry point of the client-side development starts in `client/src/index.tsx`, the entry point equivalent in server resides in `server/src/server.ts`.

In summary, it does 4 things here:

1. Creates the express instance server and configures the port for the server instance to listen to.
2. Sets up the middleware, which does many things here:
   - **Static file serving**: Middleware to serve static files from the public directory.
   - **Cross-Origin Resource Sharing (CORS)**: Middleware to configure CORS options to allow cross-origin requests from specified origins.
   - **Body parsing**: Middleware to parse JSON and URL-encoded request bodies.
   - **Prometheus middleware**: Middleware to collect metrics related to HTTP requests.
   - **Cookie parsing**: Middleware to utilize cookie-parser to parse cookies.
   - **Passport initialization**: Middleware to initialize Passport for authentication.
   - **CSRF protection**: Middleware to have CSRF protection to use the csurf middleware.
3. Connects the server to the MongoDB database instance.
4. Sets up the server with the configured port to listen to the routes from `routes.ts` file.

### 4.1. Folder Structure

The server source folder structure consists of:

- **exceptions**: Custom Exceptions used to handle different cases of responses and errors. There is not too much work here other than defining various HTTP response codes and errors.
- **logger**: Folder containing logger files to instantiate the logging operations.
- **middleware**: Middleware folders used variously in the entry point `server.ts` file.
- **models**: Model files to create the Mongoose schema and model. Most of the types come from the common folder as it is shared with the client files.
- **routes**: API routes files that are attached to the `server.ts` file. All the REST API endpoints and operation logic reside here.
- **sanitization**: Sanitizes the API endpoints if the input contains an invalid format or causes dangerous bugs. There has not been much work as we have not identified many possibilities that can come from a wrong format, but more work around this area is always appreciated.
- **seeders**: Seeds the database for development and production deployment to easily interact with the initial data and its expected format and to easily test server and end-to-end with Cypress.
- **services**: Mainly used to handle login schema and middleware authentication operations using JWT and Local Passport.
- **types**: Currently only used to override Express request so normal request can access user without explicitly providing the information.
- **utils**: Contains various utility functions used in server operations.


## 5. MongoDB Database

MongoDB is a NoSQL, document-oriented database program that utilizes JSON-like documents with optional schemas [2]. MongoDB integrates well in this project as its JSON-like structure allows easy conversion to Typescript interfaces, which are heavily used in client and server folders.

![[posts/attachments/hha-4-mongodb-er-diagram.png]]

The current database design is relatively simple. One weak thing to note here is that reportObject is still regarded as a generic Object even though it is of type QuestionGroup. Future work to make sure reportObject to be of type QuestionGroup is always welcomed for better type support and less prone to errors.

Almost every type has 2 versions here. The one stored in the MongoDB (also shown in this diagram) and the JSON equivalent type (ends in Json suffix) passed to the client. The JSON equivalent for client use is bigger as the connecting relationships are converted into the object. If it has relationships like how User has DepartmentId, it will represent the whole Department itself with all the fields rather than just the DepartmentId.

When fetching data in the server, the API will fetch the needed data and convert it into JSON counterparts using the implemented toJson function, which does another fetching for the missing data.

As of Spring 2024 changes, these 2 versions are stored in the common folder to allow reusability and tight integration between client and server.

## 6. Common Folder

An effort has been made to ensure the front end and back end are tightly coupled, including introducing common folders to allow the client and server to use the same shared types as a single source of truth.

This means all the 9 interfaces shown in the diagram have the types and interfaces stored in the common folder. This was not the norm before, and adding/removing a field is a more repetitive process.

Most of the interfaces have 2 versions as explained in the MongoDB section. The MongoDB version is for storing in the database, and the JSON version is for the client response. The interface will have 2 versions if it has any connection relations, as that means the key for the other interface will be converted into the whole interface.

## 7. Testing

Many tests have been written for the client and server folders. The testing files have not been tightly integrated with the GitHub Actions CI/CD Pipeline, which will be discussed more in the subsequent section.

In this app, there are 4 types of tests being used:

1. **Build Compilation Test** - Not a standard maintained test, but every CI/CD needs to compile the code first, and failing to compile will instantly fail it. This can be tested locally using `npm run build` on the root folder.
2. **Unit Test** - Tests a single isolated logic of the code. Still nonexistent in clients though there is a plan to start it using Jest. Tested using Mocha and Chai in the Server.
3. **Integration Test** - Tests the combination of modules/logics works well together. The next step is after unit testing. Same technologies for unit tests.
4. **End-to-end Test** - Tests the app using a browser operated with user-like behavior. Operated using Cypress though it is not part of the CI/CD pipeline.


### 7.1. Client Testing
Currently, testing for client code has mostly relied on end-to-end tests with Cypress. Although it is good to have this, the client code needs to introduce more unit testing as it is faster, more specific, and can be easily included as part of the GitHub CI/CD pipeline.

Running a Cypress test is slow and expensive as it runs a whole browser, thus more complicated to have it embedded in the regular CI/CD pipeline. To save cost, one way to make it viable is to run it in a Pull Request commit manually only after approval and it being the latest PR commit before merging. Another way, if we want it to be more automated, is to only run the Cypress test on the main branch on the latest commit after merging. Not passing means the Cypress test must be inspected and fixed or the PR be reverted.

Currently, adding a Jest unit test is in progress and is later to be integrated as part of the regular GitHub CI/CD pipeline for every commit. The main thing to focus unit tests is the validation logic on the report as it is the main feature. It is fine not to test too much on other types that are too simple like leaderboard, though testing the score calculation is always appreciated. We need to focus deeply on the logic that is much more prone to be regressed and broken.

### 7.2. Server folder testing
Unlike client testing, unit and integration testing in the server has been quite extensive using Mocha and Chai. However, we always need to keep improving this as some works of the recent terms have been a bit lacking in testing.

Focusing on testing, especially for server unit test logic is important to improve developer velocity on receiving feedback. Some logic, especially the report questions is crucial to be tested early on as bugs in production can be dangerous for the customers.

Future testing of the server files can focus on testing the behavior of the API endpoints by having a mock version of it, so it has a more realistic comparison rather than only checking what HTTP response code it is giving back.

### 7.3. Common folder testing
Common folder testing has quite the same logic as server folder testing. It focuses on testing the report questions and QuestionGroup class. More work here is important and can be helpful whenever there is a new question validation logic or a new type of question.

## 8. CI/CD Pipeline
Continuous integration and continuous deployment (CI/CD) pipeline is a group of steps dedicated to deploying a new software version. It is a practice focused on improving delivering software using automation. Continuous integration refers to integrating code changes into a shared repository verified with automated builds and tests to detect errors as soon as possible. Continuous delivery refers to automatically deploying the software after every successful build to staging and production environments.

HHA-Haiti platform uses GitHub Actions for its CI/CD pipeline. The CI part contains validating and testing such as validating the format of files using prettier, building the common-server-client folders, and exporting the docker image tag. The CD part builds the docker publish image tag, deploys it to the server, and uploads it to Docker Hub for online versioning management.

In HHA-Haiti platform, every code pushed to any pull request will automatically trigger the CI part. This runs the validations and testing to ensure the system is not buggy and can be deployed later. It also exports Docker image tags to manage artifacts and store software versions. This is useful in bigger projects to track regressions, but useful in case of fatal errors and needing to roll back to previous versions that do not have the bugs.

Only committed code to the main branch will run the CD part of the GitHub Actions, which builds the Docker image and deploys it to the production environment. This ensures resources are being used only for what is needed.

## 9. Deployment
The HHA Haiti platform is containerized for client and server repo and runs using Docker Compose on SFU Virtual Machine for deployment.

If https://hhahaiti-dev.cmpt.sfu.ca/, it might be because the SFU VM not running and SFU IT needs to be contacted for it to be rebooted. Other instances of it not running are due to an error caused by server-side changes, the bug needs to be investigated, tracked, and fixed as soon as possible, but this has been a rare case in the past, though it will be much prone if real customers are using it in the future.

## 10. Development tips and tricks
Based on my experience working the HHA-Haiti Repository and previous development suggestions to help build HHA-Haiti Platform faster and higher in quality:

1. Make sure Prettier is always run on a git pre-commit. This ensures a similar styling structure across the repository. This should already be on by default.
2. Utilize Postman to test endpoints and test quickly if it's working.
3. When developing full-stack features, focus on developing how the high-level design for the request and response first. This means starting from the server changes and testing its behaviors using Postman first rather than trying to make the client user interface and connecting it.
4. Ensure some tests are added every time a new feature/mechanism. This can be a unit test for a small change or an added end-to-end test for Cypress. Currently, as Cypress is not part of CI/CD pipeline, adding tests that are directly part of the pipeline is more important since it gives feedback automatically.
5. Focus on TypeScript types to be strict so that future developments are better, easier to test, and catch bugs. While it does not affect customers directly, development velocity will be faster and less error-prone if the types are expected.
6. The most important thing is to communicate product requirements early and well to Michael (Representative from HHA-Haiti). This ensures all the changes that we are working on are integral for the customers and we are not doing wasted work.


## 11. Closing Remarks

Working on the HHA-Haiti Platform for 2 terms has been an enriching experience, there are many things to do and it may never realistically end. The big problem is the lack of direct knowledge transfer. Normal development projects usually have some people staying to ensure that code changes are consistent throughout the timeline. Thus, the art of self-learning and understanding the code of what it does becomes more precious. Also, the judgment to know that an existing code has bad architectural decisions and fixing it is important.

The best resources to utilize here are fellow developers on the team who may have more knowledge, and past Haiti Developers if there are bigger issues to discuss. I am sure most developers will be willing to help here rather than spending hours trying to understand everything.

I hope this report guide helps understand the full-stack architecture of the HHA-Haiti Platform.
