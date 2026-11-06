---
title: GridFit Technical Documentation
template: home.html
description: Technical documentation for GridFit, a rules-based fit check that matches SME electricity demand to spare mini-grid capacity in Zambia.
---

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
