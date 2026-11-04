---
hide:
  - navigation
  - toc
---

# Welcome to GridFit

<div class="gf-hero" markdown>

![GridFit logo](assets/images/gridfit-mark.svg)

GridFit is a decision-support platform for mini-grid operators. It combines business information, observed electricity-use data and site operating limits to help operators assess whether a business load can be supported by an existing mini-grid.

[Get started](overview.md){ .md-button .md-button--primary }
[How it's built](architecture.md){ .md-button }

</div>

---

## Why GridFit?

<div class="grid cards" markdown>

-   **Use evidence, not guesswork**

    Business profiles can be derived from time-stamped meter readings rather than relying only on a business owner's estimate.

-   **Explain the assessment**

    The backend evaluates power, motor-starting, energy and battery constraints and returns check results and explanatory reasons.

-   **Compare existing sites**

    Operators can run scenarios against multiple site profiles and compare the resulting outcomes.

-   **Keep the operator in control**

    GridFit records assessments and decisions. It does not switch equipment, dispatch generation or control a mini-grid.

</div>

## Platform at a glance

| Component | Current implementation |
|---|---|
| Operator and field interface | Next.js application using React |
| API | FastAPI |
| Persistence | SQLAlchemy models with SQLite/PostgreSQL dialect support |
| Assessment | Python rules and simulation engine |
| Metering data model | Reading and meter-assignment tables |
| Informational website | Separate Vite/React application |
| Documentation | MkDocs Material, published through GitHub Pages |

The frontend repository README describes the UI as a mock-data prototype and says it is not yet fully connected to the backend. Treat screen flows as demonstrations unless a specific integration is verified.

## Documentation map

- [Overview](overview.md) — purpose, users, workflow and scope.
- [Architecture](architecture.md) — components and data movement.
- [Backend / API](backend-api.md) — API routes, data models and setup.
- [Rules Engine](rules-engine.md) — assessment inputs, checks and outcomes.
- [Frontend Web](frontend-web.md) — operator interface and development.
- [Field App](field-app.md) — field-agent workflows.
- [Metering Device](metering-device.md) — reading model, proposed hardware and implementation gaps.
- [Security](security.md) — authentication, authorisation and known gaps.
- [Deployment](deployment.md) — hosting and release considerations.
- [QA Process](qa-process.md) — automated and manual verification.
- [Developer Guide](developer-guide.md) — contribution workflow and conventions.
- [Brand Guideline](brand-guideline.md) — visual identity.
- [Glossary](glossary.md) — terminology.

---

Built by **TechAra**: Emma Mwelwa, Gift Mwansa, Gabrielle Mordaunt, Nikki Wanjiku and Sharon Njambi.
