# Structured Use Case Editor

A lightweight reference implementation for creating structured use case
diagrams and specifications.

The Structured Use Case Editor is an open-source reference
implementation for exploring and validating the Structured Use Cases
approach. It provides a browser-based environment for creating use case
diagrams, editing structured use case specifications, working with
basic, alternate, and exception scenarios, and examining the resulting
model in both JSON and UCML textual forms.

The editor is intentionally deployment-neutral. The user interface is
implemented with static HTML, JavaScript, and CSS. A small
cPanel/Passenger Python deployment example is included, but it is not
required to run or host the editor.

![Structured Use Case Editor](images/structured-use-case-editor.png)

## Companion Project

The **Structured Use Case Editor** provides an open-source reference
editor for creating and editing structured use case diagrams and
specifications. The companion **Structured Use Cases** project defines
the SysML v2 semantics for structured use case specifications and
contains the current proposal, library, examples, and diagrams.

Structured Use Cases: https://github.com/Open-MBEE/structured-use-cases

## Source Architecture

The editor now runs from the modular `src/` tree. `standalone.html`
loads `src/main.js`, which starts the application through
`src/app/appController.js`.

The previous one-file implementation is preserved under
`legacy/standalone-app.js` as the behavior baseline for one release.

See `docs/architecture.md` for a UML-style architecture view of the
source structure.

## Why This Editor Exists

Structured use cases are intended to make behavioral modeling more
explicit and useful by describing not only the normal flow of behavior,
but also valid alternatives and exception conditions.

The editor provides a practical environment for experimenting with that
model and its editing workflow before integration with SysML v2 modeling
tools.

It is intended to help validate:

-   The Structured Use Cases model
-   Use case diagram editing
-   Structured scenario editing
-   Alternate and exception behavior
-   Branch and rejoin references
-   JSON model interchange
-   UCML textual notation
-   Document-oriented views of structured use case specifications

The editor should be viewed as a reference implementation and
experimentation environment, not as a replacement for a full SysML v2
modeling tool.

## Features

The current implementation includes:

-   Use case diagram editing
-   Actor and use case nodes
-   Association relationships
-   Include relationships
-   Extend relationships
-   Invoke relationships
-   Precedes relationships
-   Use case specification editing
-   Basic/nominal scenarios
-   Alternate scenarios
-   Exception scenarios
-   Branch and rejoin step references
-   Generated document preview
-   JSON model view
-   UCML textual notation view

## Structured Use Case Concepts

A structured use case describes system behavior as scenarios composed of
ordered steps.

A use case can contain:

-   A Basic Scenario describing the normal behavior
-   Alternate Scenarios describing valid variations
-   Exception Scenarios describing error conditions or other off-nominal
    behavior

Making these paths explicit can help engineers discover requirements
that may be missed when only the nominal behavior is modeled. The
Structured Use Case Editor provides an interactive environment for
creating and examining these structures.

## JSON and UCML

The editor supports two complementary representations of its model.

### JSON

The JSON view represents the full editor interchange format, including
information used by the editor such as diagram layout.

### UCML

UCML provides a human-readable textual notation for the semantic use
case model.

The editor can therefore be used to explore the relationship between an
interactive graphical editing experience, structured use case semantics,
and textual model representations.

## Running Locally

The application is self-contained and does not require npm or
third-party Python packages.

From the repository root, run:

    python3 app.py

Then open:

    http://127.0.0.1:8080/

You can also serve the repository root with any static web server.

## Repository Contents

The current application consists of:

``` text
structured-use-case-editor/
├── README.md
├── LICENSE
├── .gitignore
├── app.py
├── standalone.html
├── legacy/
│   └── standalone-app.js
├── docs/
│   ├── architecture.md
│   └── architecture.svg
├── images/
│   └── structured-use-case-editor.png
├── src/
│   ├── README.md
│   ├── main.js
│   ├── diagram/
│   ├── model/
│   ├── serializers/
│   ├── specification/
│   ├── storage/
│   ├── textual/
│   ├── ui/
│   └── styles.css
└── deployment/
    └── cpanel/
        ├── README.md
        ├── app.py
        ├── passenger_wsgi.py
        └── replacement_passenger_wsgi.py
```

Key files:

-   `standalone.html` - editor HTML shell
-   `src/main.js` - active ES module entry point
-   `src/app/appController.js` - active browser-based editor controller
-   `legacy/standalone-app.js` - preserved copy of the previous one-file
    implementation
-   `src/` - modular source tree
-   `src/styles.css` - editor styling
-   `docs/architecture.md` - architecture notes and UML-style diagram
-   `app.py` - small deployment-neutral local static-file server
-   `images/structured-use-case-editor.png` - README screenshot
-   `deployment/cpanel/app.py` - lightweight Python WSGI/static-file
    server for cPanel-style hosting
-   `deployment/cpanel/passenger_wsgi.py` - cPanel/Passenger startup
    file
-   `deployment/cpanel/replacement_passenger_wsgi.py` - replacement
    startup file if cPanel overwrites the Passenger entry point
-   `deployment/cpanel/README.md` - optional cPanel deployment notes

## Deployment

The editor is deployment-neutral and can be hosted as static files.

The cPanel/Passenger files in `deployment/cpanel/` are provided only as
one example Python deployment for hosts that require a WSGI application.

## Project Status

The Structured Use Case Editor is a reference implementation under
active development and evaluation.

Its purpose is to support experimentation with structured use case
modeling, editing workflows, model interchange, and textual notation.

Interfaces, file formats, and modeling details may evolve as the
Structured Use Cases approach is refined.

## Contributing

Feedback, testing, and experimentation are welcome.

Useful contributions include:

-   Reporting editor defects
-   Testing different structured use case examples
-   Suggesting usability improvements
-   Testing JSON interchange
-   Experimenting with UCML
-   Improving documentation
-   Contributing test cases
-   Exploring interoperability with SysML v2 tools

## License

This project is licensed under the Apache License 2.0. See the `LICENSE`
file for details.

## About Structured Use Cases

Structured Use Cases is an effort to make use case modeling simpler,
more rigorous, and more useful throughout systems and software
engineering.

The central idea is straightforward:

Describe what normally happens. Describe what else can happen. Describe
what can go wrong. Then test all of it.
