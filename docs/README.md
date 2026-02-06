# 📚 Dokumentacja Projektu - Rezerwacje Sal

## Index Dokumentacji

Witaj w dokumentacji systemu rezerwacji sal restauracji Gościniec Rodzinny! Ta sekcja zawiera pełną dokumentację architekturalnej i technicznej projektu.

---

## 📋 Spis Treści

### 1. **[SPRINTS.md](./SPRINTS.md)** - Plan Sprintów

**Zawiera**:
- 🏗️ 5 sprintów (10 tygodni)
- 🎯 User stories z punktami
- ✅ Acceptance criteria
- 📊 Summary dla każdego sprintu

**Użateczne dla**:
- Planowania pracy
- Śledzenia postępu
- Zrozumienia zakresu projektu
- Estymacji pracy

---

### 2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architektura Systemu

**Zawiera**:
- 🏗️ Diagramy architektury
- 💋 Warstwy systemu (Presentation, API, Data)
- 💫 Design patterns
- 🔐 Security architecture
- 🚀 Deployment architecture
- 🏁 Scalability considerations

**Użateczne dla**:
- Deweloperów
- Architektów
- Tech leads
- Code reviews

---

### 3. **[DATABASE.md](./DATABASE.md)** - Schemat Bazy Danych

**Zawiera**:
- 📊 ERD diagram
- 📋 Definicje tabel
- 🔇 Constraints i validacje
- 🔍 Indexes
- 🔄 Migration strategy
- 🏓 Backup strategy

**Użateczne dla**:
- Database engineers
- Backend developers
- DBA
- Data analysts

---

### 4. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment Guide

**Zawiera**:
- 🚀 Deployment na wszystkie environmentöw (local, staging, production)
- 📊 Instrukcje setup
- 🔗 SSL/HTTPS configuration
- 📋 Nginx reverse proxy setup
- 📚 Monitoring & logging
- 🔨 Troubleshooting guide
- 🔘 Backup & recovery procedures

**Użateczne dla**:
- DevOps engineers
- SysAdmins
- Release managers
- Production support

---

## 🧪 Testing

**Dla informacji o testowaniu, zob**: [../README.md](../README.md#-testing)

- Unit testy: Jest + Vitest
- Integration testy: Jest + Supertest
- E2E testy: Playwright
- Target coverage: 80% backend, 75% frontend

---

## 🔐 Key Concepts

### Stack Technologiczny

| Layer | Technology | Purpose |
|-------|-----------|----------|
| **Frontend** | Next.js 14 + React 18 + TypeScript | Modern UI/UX |
| **Backend** | Express.js + TypeScript | HTTP API |
| **Database** | PostgreSQL 14+ | Data persistence |
| **Cache** | Redis 7+ | Session & caching |
| **DevOps** | Docker & Docker Compose | Containerization |
| **Tests** | Jest, Vitest, Playwright | Quality assurance |
| **Email** | Nodemailer + Bull/BullMQ | Async communication |

### Architektura Biznesowa

```
📋 Moduły Systemu:

1. 🗣️ REZERWACJE - Pełny lifecycle rezerwacji
   - Nowa rezerwacja
   - Edycja i anulowanie
   - Historia zmian
   - Generowanie PDF
   - Wysyłka maili

2. 👤 KLIENTCiE - Zarządzanie klientami
   - Rejestr klientów
   - Historia rezerwacji
   - Notatki

3. 👨‍💼 ADMIN - Panel administratora
   - Zarządzanie użytkownikami
   - Konfiguracja sal
   - Ustawienia systemu

4. 📊 STATYSTYKI - Analityka i raporty
   - Przychody
   - Popularność sal
   - Trendy

5. 💾 BACKUPY - Bezpieczeństwo danych
   - Automtyczne backupy
   - Restore

6. 📋 HISTORIA - Audyt trail
   - Historia wszystkich zmian
   - Tracking osób
```

### Ważne Funkcjonalności

- 📋 **Kalkulator Ceny** - Realtime price calculation
- 🔐 **Walidacje** - Kompleksowe sprawdzenia danych
- 📧 **Maile** - Automtyczne powiadomienia
- 📝 **Historia** - Pełny audit trail
- 💵 **Zaliczki** - System pre-payment
- 💪 **Animacje** - Framer Motion
- 📏 **PDF** - Generowanie dokumentów

---

## 📑 Reading Order

**Dla nowych developerów**:
1. Zacznij od [SPRINTS.md](./SPRINTS.md) - zrozumienie zakresu
2. Przeczytaj [ARCHITECTURE.md](./ARCHITECTURE.md) - architektura
3. Zapoznaj się z [DATABASE.md](./DATABASE.md) - struktura danych
4. Setup lokalny według [DEPLOYMENT.md](./DEPLOYMENT.md)

**Dla DevOps/SysAdmins**:
1. Przeczytaj [DEPLOYMENT.md](./DEPLOYMENT.md)
2. Zajrzyj w [ARCHITECTURE.md](./ARCHITECTURE.md) - scaling
3. Zrozum [DATABASE.md](./DATABASE.md) - backup strategy

**Dla Product Managers**:
1. Przeczytaj [SPRINTS.md](./SPRINTS.md) - timeline i features
2. Zajrzyj [ARCHITECTURE.md](./ARCHITECTURE.md) - high-level overview

---

## 🔠 Key Metrics

| Metric | Target | Current |
|--------|--------|----------|
| **Code Coverage** | 80% backend, 75% frontend | 🔧 WIP |
| **Performance** | Lighthouse 90+ | 🔧 WIP |
| **API Response Time** | <200ms | 🔧 WIP |
| **Uptime** | 99.9% | 🔧 WIP |
| **Page Load Time** | <2s | 🔧 WIP |

---

## 📄 Document Versions

| Document | Version | Last Updated | Author |
|----------|---------|--------------|--------|
| SPRINTS.md | 1.0 | 06.02.2026 | Kamil Gołębiowski |
| ARCHITECTURE.md | 1.0 | 06.02.2026 | Kamil Gołębiowski |
| DATABASE.md | 1.0 | 06.02.2026 | Kamil Gołębiowski |
| DEPLOYMENT.md | 1.0 | 06.02.2026 | Kamil Gołębiowski |

---

## 🔗 External Resources

### Official Docs
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Prisma ORM](https://www.prisma.io/docs/)

### Tutorials & Guides
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Best Practices](https://react.dev/)
- [Database Design](https://en.wikipedia.org/wiki/Database_design)
- [System Design Interview](https://github.com/donnemartin/system-design-primer)

---

## 📞 Support & Contact

**Pytania do dokumentacji**:
- Otwórz issue na GitHubie
- Email: dev@gosciniecrodzinny.pl
- Slack: #rezerwacje-dev

**Problemy z deploymentem**:
- Sprawdź [DEPLOYMENT.md Troubleshooting](./DEPLOYMENT.md#troubleshooting)
- Kontaktuj DevOps team

**Feature requests**:
- Dodaj do GitHub Issues
- Poinformuj Product team

---

## ✅ Contributing to Docs

Naściąg do aktualizacji dokumentacji:

1. Edytuj odpowiedni .md plik
2. Utrzymuj Markdown formatting
3. Aktualizuj version number
4. Dodaj update timestamp
5. Otwórz PR do review
6. Merge po approval

---

## 📁 File Structure

```
docs/
├── README.md              ← You are here
├── SPRINTS.md             ← Sprint planning & user stories
├── ARCHITECTURE.md        ← System architecture & design
├── DATABASE.md            ← Database schema & design
└── DEPLOYMENT.md          ← Deployment guide for all envs
```

---

## 💁 License

Dokumentacja jest częścią projektu Gościniec Rodzinny.
Copyright © 2026 Gościniec Rodzinny. Wszystkie prawa zastrzeżone.

---

**Last Updated**: 06.02.2026
**Status**: 🔧 In Progress