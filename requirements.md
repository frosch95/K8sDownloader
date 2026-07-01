# project: K8sDownloader

## 1. Overview & Objectives
* **Problem Statement:** Sometimes pods contain files that a user wants to download. The users are not familiar with kubernetes and kubectl and should have a simple ui like a file browser to navigate throught the file system in a pod and download files.
* **Target Audience:** Users that are not familiar with kubernetes and cloud but are used to desktop tools like ftp clients or windows file explorer. 
* **Success Criteria:** Easy to use desktop app that helps a user to select a cluster from the kubernetes config, shows the available namespaces and pods and shows the filesystem of the pod. And also the user should be able to download the files from the pod.

## 2. Technical Stack & Architecture
* **Frontend:** React 19, TypeScript, Tailwind CSS, Electron, Node.js, PNPM
* **APIs / Integrations:** Kubernetes API

## 3. Non-Functional Requirements
* **Security:** The user should not be able to do anything else than browsing and downloading
* **Styling/UI:** Dark mode support, responsive design

## 4. Development Rules & Constraints
* Write self-documenting code with clean naming conventions.
* Implement unit tests for all functions and classes.
* Do not use deprecated libraries or features.
* Use vertical slices
* Use clean code patterns
* Use best practices for electron apps
* Use linting for the project
* Do documentation of architecture and features in README.md and describe how to build, run and release the app on windows, linux and macos. Update the README.md if anything changes depending to the achitecture or features to have up-to-date documentation.

## Definition of Done
* Project must build without errors
* Tests must complete without errors
* No linting errors
