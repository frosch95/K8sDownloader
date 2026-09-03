# K8sDownloader

A desktop app that lets non-Kubernetes-savvy users pick a kubeconfig context and download files out of a pod's filesystem through a file-explorer-like UI, using `kubectl` under the hood.

## Language

### Selecting a target

**Context**:
A kubeconfig entry combining a Cluster reference and a set of user credentials. It is the first thing a user selects — everything else (Namespace, Pod, Container) is reached through it. A single Context references exactly one Cluster, but the same Cluster may be referenced by several Contexts.
_Avoid_: Cluster (a Cluster is a property of a Context, not the thing the user selects)

**Cluster**:
The Kubernetes cluster a Context points to. Shown alongside the Context's name in the selector (e.g. "prod (cluster-a)") but never selected on its own — always reached via a Context.

**Namespace**:
A Kubernetes namespace within the selected Context, scoping which Pods are visible.

**Pod**:
A Kubernetes pod within the selected Namespace, whose filesystem is browsed and downloaded from.

**Container**:
One of a Pod's containers; selectable only when the Pod has more than one. Also used as a qualifier for "Container Path" (a path *inside* a container's filesystem) — a different sense of the word from selecting a Container itself.

### Browsing the pod filesystem

**Container Path**:
A location inside a Pod's container filesystem — either a directory being browsed or a specific file being downloaded from it. Always distinct from a Local Save Path.
_Avoid_: path, dirPath, sourcePath

**Local Save Path**:
The destination location on the user's own machine, chosen through the OS save dialog, that a downloaded file or pod log is written to.
_Avoid_: destPath, path

**File Entry**:
One row of a Container Path's directory listing — a file or a directory. Symlinks are not currently distinguished from regular files/directories: the app has no link-target tracking, so a symlink to a directory is not navigable and a symlink to a file downloads whatever it resolves to, with no indication in the UI that it was a link.
_Avoid_: File, Path entry

**Mount**:
A container's Kubernetes volume mount — the join of its `volumeMounts[]` entry (mount path, read-only flag, subpath) with the pod-level `volumes[]` entry it references (its source: ConfigMap, Secret, PersistentVolumeClaim, HostPath, NFS, CSI, EmptyDir, Projected, DownwardAPI, or Other/Unknown). Always a Kubernetes volume mount — never an OS-level bind or filesystem mount.
_Avoid_: volume, bind mount

### Container runtime states

**Distroless Container**:
A container with no shell or file tools at all (e.g. CoreDNS), discovered only after every fallback listing/download tool has been tried and failed. Cannot be browsed or downloaded from.
_Avoid_: scratch image, minimal container

**Minimal Container**:
A container that lacks the expected tooling (`ls`, `cat`) but has some other usable binary (e.g. `find`, `busybox`), so it remains browsable and downloadable via fallback tooling. Distinct from a Distroless Container, which has no usable binaries at all.
_Avoid_: distroless container
