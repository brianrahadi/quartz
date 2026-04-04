---
title: Build Systems
date: 2025-09-01
---

## background

building software how?
``` zsh
gcc source1.c source2.c -o myprogram
```
more like:
- build eng
- release eng
- build config
- build automate
- dependency management
- CI/CD
- etc

## what building truly means
what truly means to build software:
- version control
- dependency
- build command in diff modes and env
- writing instruction to config and build
- test config and execution
- automated code quality check
- scalable compilation
- deployment

at least ask:
- tools
- workflow
- painful points
- risks
- benefits
- how to make less painful

## modeling a build
first consider:
- components and objectives
- dependencies
	- good dependency graph - DAG
	- modern build management uses DAG to drive build process

![[Pasted image 20241207182835.png | 300]]

-> means depends on

for each component, build management requires:
- direct build req
- transitive usage req
- goal: separate interface from impl

dependency graph - infer to build component correctly based on deps
	- change only if deps change

## cmake
cross-platform build management tool
used by large projects

what does:
- input: spec and config of project
- output: build command for you
- like autoconf but easier

why not manual?
- need diff makefiles for different OS, compilers, libs
- spec can capture almost everything and its semantics

benefits:
- scalability
- easier tool integration

make sure it's out-of-source builds
 
 in source bad because
 - need multiple build anyways
 - pollutes vcs
 - make clean build harder

### using cmake
`CMakeLists.txt` - script in every dir to control how to build things

simple syntax and case insensitive

#### targets and commands
- `add_executable(helloworld)`
- `add_library(hellohelper STATIC)`
- can add custom command to build

#### specifying requirements

target_* commands
``` cmake
target_sources(hellohelper
	PRIVATE helloworld.cpp)

target_include_directories(hellohelper
	INTERFACE ${dir}/include/)

target_link_libraries(helloworld
	PRIVATE hellohelper)
```

using libraries
- transitive interface dependencies - linked as required
- affects program structure and design

#### general project management
- specifying project properties
	- `project(name)`
- print info during build process
	- `message("Built with flags: ${flag}")`
- control where things build
	- `set(CMAKE_DIR ${PROJECT_DIR}/bin)`

#### more commands
- find resource to be used
	- `find_package(external_proj)
	- `find_library(library)`
- installation
	- `install(TARGETS target1 target2 DESTINATION /tmp/)`
- control structure - if, loop

#### pulling remote dependencies
``` cmake
include(cmake/CPM.cmake)

CPMAddPackage(
	NAME something
	GIT_REPO link
	GIT_TAG v0.0.1
)

target_link_libraries(demo
	PRIVATE something)
```

#### analyzing project structure
cmake can dump out dep graph in graphviz format
``` zsh
cmake -graphviz=deps.gv <path-to-proj>
dot -Tpng deps.gv -o deps.svg
```

## advanced build issues
build systems - foundation of workflow and devops
- choke point for controlling dev
- can be expensive and has bottleneck

adding control
- automated testing
- code analysis and metrics

improve performance
- parallel and distributed
- caching
- unification


## summary
modern build system leverage dependency graph of project

dependency graph allows
- **inference** of build and usage
- **compositional** reasoning about modules and build management