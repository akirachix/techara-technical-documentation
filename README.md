# GridFit Technical Documentation

<p align="center">
  <strong>Technical documentation for the TechAra GridFit platform</strong>
</p>

GridFit is a rules-based fit-check solution that matches small and medium-sized enterprise (SME) electricity demand to available spare mini-grid capacity in Zambia.

This repository contains the technical documentation describing the platform's architecture, functionality, implementation, security, deployment, and quality assurance processes.

**Project:** TechAra
**Documentation:** GridFit Technical Documentation
**Repository:** [akirachix/techara-technical-documentation](https://github.com/akirachix/techara-technical-documentation)

[View the Documentation Website](https://akirachix.github.io/techara-technical-documentation/)

---

## Table of Contents

- [About the Project](#about-the-project)
- [Documentation Guide](#documentation-guide)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Running the Documentation Locally](#running-the-documentation-locally)
- [Building the Documentation](#building-the-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Technology Stack](#technology-stack)

## About the Project

GridFit addresses the challenge of matching productive-use businesses with available electricity capacity in mini-grid environments.

The platform provides a structured approach to assessing SME electricity requirements against available mini-grid capacity.

This documentation serves as a technical reference for developers, testers, project contributors, and other stakeholders involved in understanding, developing, maintaining, and operating GridFit.

## Documentation Guide

The documentation is organized into the following sections:

| Section | Description |
|---|---|
| [Overview](docs/overview.md) | Project background, objectives, and system overview. |
| [Architecture](docs/architecture.md) | System architecture, components, and interactions. |
| [Backend / API](docs/backend-api.md) | Backend implementation and API reference. |
| [Rules Engine](docs/rules-engine.md) | Rules-based assessment and fit-check logic. |
| [Frontend Web](docs/frontend-web.md) | Frontend application structure and functionality. |
| [Field App](docs/field-app.md) | Field application workflows and functionality. |
| [Metering Device](docs/metering-device.md) | Metering device functionality and integration. |
| [Security](docs/security.md) | Security considerations and implementation. |
| [Deployment](docs/deployment.md) | Deployment architecture and procedures. |
| [QA Process](docs/qa-process.md) | Testing strategy and quality assurance processes. |
| [Developer Guide](docs/developer-guide.md) | Development environment and contributor guidance. |
| [Brand Guideline](docs/brand-guideline.md) | Project branding and visual identity. |
| [Glossary](docs/glossary.md) | Definitions of project terminology and technical concepts. |

## Repository Structure

```text
techara-technical-documentation/
│
├── .github/
│   └── workflows/          # GitHub Actions workflows
│
├── docs/
│   ├── assets/
│   │   ├── images/
│   │   └── stylesheets/
│   │
│   ├── index.md            # Documentation landing page
│   ├── overview.md
│   ├── architecture.md
│   ├── backend-api.md
│   ├── rules-engine.md
│   ├── frontend-web.md
│   ├── field-app.md
│   ├── metering-device.md
│   ├── security.md
│   ├── deployment.md
│   ├── qa-process.md
│   ├── developer-guide.md
│   ├── brand-guideline.md
│   └── glossary.md
│
├── .gitignore
├── mkdocs.yml              # MkDocs configuration and navigation
├── requirements.txt        # Documentation dependencies
└── README.md
```

## Getting Started

### Prerequisites

To work with this documentation locally, you need:

- Python installed on your machine.
- pip, the Python package installer.
- Git.
- A terminal or command-line interface.

### 1. Clone the repository

```bash
git clone https://github.com/akirachix/techara-technical-documentation.git

cd techara-technical-documentation
```

### 2. Create a virtual environment

```bash
python3 -m venv .venv
```

Activate the environment.

**Linux / macOS:**

```bash
source .venv/bin/activate
```

**Windows:**

```powershell
.venv\Scripts\activate
```

### 3. Install dependencies

```bash
python -m pip install --upgrade pip

pip install -r requirements.txt
```

The dependencies are defined in `requirements.txt`.

## Running the Documentation Locally

Start the local MkDocs development server:

```bash
mkdocs serve
```

Open the address displayed in your terminal. The default address is:

```text
http://127.0.0.1:8000/
```

The development server automatically refreshes the documentation when Markdown files are updated.

## Building the Documentation

Generate the static documentation website:

```bash
mkdocs build
```

Run a strict build to identify documentation warnings and errors:

```bash
mkdocs build --strict
```

The generated website is saved in the `site/` directory.

Before submitting documentation changes, ensure that the strict build completes successfully.

## Deployment

The project is configured to publish its documentation through GitHub Pages.

The published documentation is available at:

https://akirachix.github.io/techara-technical-documentation/

The repository also contains a `.github/workflows/` directory for GitHub Actions automation.

For deployment configuration and instructions, refer to the [Deployment Guide](docs/deployment.md).

## Contributing

Contributions that improve the accuracy, clarity, and completeness of the documentation are welcome.

When contributing:

1. Review the existing documentation before making changes.
2. Follow the established Markdown structure and formatting conventions.
3. Keep technical terminology consistent across documentation sections.
4. Update relevant pages when implementation details change.
5. Verify internal links and navigation.
6. Preview changes using `mkdocs serve`.
7. Run `mkdocs build --strict` before submitting changes.
8. Submit changes through a pull request for review.

Documentation should accurately reflect the implemented system and verified project decisions.

## Technology Stack

| Technology | Purpose |
|---|---|
| Python | Documentation development environment |
| MkDocs | Static documentation generation |
| MkDocs Material | Documentation theme and interface |
| Markdown | Documentation content |
| Git | Version control |
| GitHub | Source code hosting and collaboration |
| GitHub Actions | Workflow automation |
| GitHub Pages | Documentation publishing |

---

**Maintained by TechAra**

*GridFit Technical Documentation*
