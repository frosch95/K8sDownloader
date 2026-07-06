# Tasks

## Backlog

## In Progress

## Done
* [x] The deployment build should generate an additional license file that contains all the liceneses of the dependencies. The file should always be up to date to the dependencies when the deployment is build.
* [x] Make a more modern looking UI. Use subtle gradients.
* [x] **Improvements:** show application version in the ui next to license information
* [x] **Security:** Harden kubectl input validation to block malformed context, namespace, pod, and container identifiers.
* [x] **Security:** Sanitize container paths before executing kubectl list/download commands to prevent traversal-style access.
* [x] **Security:** Enable Electron sandboxing for the main browser window to reduce renderer-process attack surface.
* [x] **Robustness:** Add a safe renderer-side fallback for the Electron bridge so the app no longer crashes when the preload API is unavailable outside a native Electron runtime.
* [x] **Tests:** Add regression tests for Kubernetes identifier validation, container path sanitization, and the Electron fallback behavior.
* [x] **Quality:** Verify linting, tests, and the production build after the latest hardening changes.
* [x] **Documentation:** Document the new security hardening measures in the README, architecture notes, and requirements.
* [x] **Feature:** remember the last selections in cluster and namespace and make it persistent over restarts
* [x] **Feature:** Add a 'Select Cluster' and 'Select Namespace' item in the list and this should be selected first, to avoid connecting to a non existing cluster or namespace
* [x] **Improvement:** the height of the pod list should use the complete space to support long list of pods
* [x] **Improvement:** Write the log output on every start into an empty file output.log.
* [x] **BugFix:** Update GitHub Actions to use latest versions to avoid Node.js 20 deprecation warnings
* [x] **Improvements:** replace ☸️ with icon.svg
* [x] **Improvement:** Add MIT license to the project
* [x] **Improvement:** Use the icon.svg as icon in the application and as app icon in the OS
* [x] **BugFix:** The error dialogs content section must be scrollable as the text might be too long and the buttons are not visible any more if the screen is too small
* [x] **Bugfix:** The Drop Down looks a bit odd as the left side of thd Drop Down List has a thicker border than the right side
* [x] **Feature 12:** Theme should be selectable via Drop Down
* [x] **Feature 11:** Add a darcula like theme
* [x] **Improvement:** Wrap top-level components with ErrorBoundary to catch render errors gracefully.
* [x] **Tests:** Add component tests (FileExplorer, ContextSelector, NamespaceSelector, PodSelector, ErrorDialog, ThemeToggle, ErrorBoundary) – 10 test files, 104 tests.
* [x] **Feature 10:** Toggle between dark mode and light mode.
* [x] **Feature 9:** Make the sidebar resizable.
* [x] **Feature 8:** Support downloading files from both Linux and Windows pods.
* [x] **Bugfix:** `kubectl cp` "one of src or dest must be a local file specification" error.
* [x] **Improvement:** Add log outputs to all kubernetes functions for debugging.
* [x] **Feature 7:** As a user I want to have an error dialog if some error happens.
* [x] **Feature 6:** As a user I want to download a file from the pod.
* [x] **Feature 5:** As a user I want to navigate through the filesystem like in a file explorer.
* [x] **Feature 4:** As a user I want to see the filesystem of the pod like a file explorer.
* [x] **Feature 3:** As a user I want to select a pod from the available pods in the namespace.
* [x] **Feature 2:** As a user I want to select a namespace from the available namespaces in the context.
* [x] **Feature 1:** As a user that has a kubernetes config on my computer, i want to select a context from the config.
* [x] **Init:** Create an Electron project with git support and a typical .gitignore file.
