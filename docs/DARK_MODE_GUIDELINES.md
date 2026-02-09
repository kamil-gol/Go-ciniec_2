# 🌙 Dark Mode Guidelines - Gościniec Rodzinny

**Dokumentacja zasad implementacji dark mode w systemie rezerwacji**

---

## 🎯 Cel Dokumentu

Ten dokument zawiera kompletne wytyczne dotyczące implementacji i utrzymania dark mode w całym projekcie. Zapewnia spójność wizualną oraz dobre UX dla użytkowników.

---

## 🎨 Filozofia Dark Mode

### Zasady Podstawowe
1. **Żaden hardcoded kolor** - Zawsze używaj semantic tokens z Tailwind
2. **Kontekstowa jasność** - Elementy powinny być widoczne w obu motywach
3. **Kontrast** - Zapewnij min. 4.5:1 dla tekstu, 3:1 dla UI
4. **Gradienty** - W dark mode używaj ciemniejszych wersji z `/10` lub `/20`
5. **Spójność** - Ten sam komponent wygląda podobnie w light/dark

---

## 📦 Semantic Tokens

### Tła (Backgrounds)

#### Podstawowe Tła
```tsx
// Główne tło aplikacji
className="bg-background"
// Light: białe, Dark: ciemnoszare (#0a0a0a)

// Tło kart i komponentów
className="bg-card"
// Light: białe, Dark: ciemnoszare z lekkim kontrastem

// Tło hover/focus
className="hover:bg-accent"
// Light: lekko szare, Dark: lekko jasniejsze od tła

// Tło wyciszone (muted)
className="bg-muted"
// Light: szare, Dark: ciemnoszare
```

#### Gradienty w Tłach
```tsx
// Light mode - pełne nasycenie
className="bg-gradient-to-br from-blue-50 to-cyan-50"

// Dark mode - wyciszone z przezroczystością
className="dark:from-blue-950/30 dark:to-cyan-950/30"

// Przykład kompletny
className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30"
```

**Zasada:** W dark mode używaj `/30` (30% opacity) dla tł z kolorami.

### Tekst (Text)

```tsx
// Główny tekst
className="text-foreground"
// Light: czarny, Dark: biały

// Tekst wyciszony (pomocniczy)
className="text-muted-foreground"
// Light: szary, Dark: jasnoszary

// Tekst na kolorowym tle
className="text-white"
// Zawsze biały (np. przyciski, gradienty hero)
```

### Ramki (Borders)

```tsx
// Standardowa ramka
className="border border-border"
// Light: lekko szara, Dark: ciemnoszara z kontrastem

// Ramka kolorowa
className="border-blue-200 dark:border-blue-800"
// Light: jasny kolor, Dark: ciemny kolor

// Przykład
className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30"
```

**Zasada:** Dla kolorów używaj `X-200` w light, `X-800` w dark.

### Przyciski (Buttons)

```tsx
// Przycisk outline z adaptacyjnym tłem
className="bg-card hover:bg-accent text-foreground border-border"

// Przycisk kolorowy z hover
className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"

// Toggle button (aktywny/nieaktywny)
// Aktywny:
className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600"
// Nieaktywny:
className="bg-card hover:bg-accent text-foreground border-border dark:hover:border-purple-700"
```

---

## ✅ Checklist dla Komponentów

### 📑 Przed Commitem - Sprawdź

```markdown
## Dark Mode Checklist

### Tła
- [ ] Brak hardcoded `bg-white` (użyj `bg-card` lub `bg-background`)
- [ ] Gradienty mają wersje dark: `dark:from-X-950/30`
- [ ] Hover states używają `hover:bg-accent`
- [ ] Muted backgrounds używają `bg-muted`

### Tekst
- [ ] Główny tekst używa `text-foreground`
- [ ] Pomocniczy tekst używa `text-muted-foreground`
- [ ] Brak hardcoded `text-black` lub `text-gray-900`
- [ ] Teksty na kolorach są `text-white` lub `text-X-50`

### Ramki
- [ ] Standardowe ramki: `border-border`
- [ ] Kolorowe ramki mają dark: `dark:border-X-800`
- [ ] Separatory używają `border-border`

### Ikony
- [ ] Ikony główne: `text-foreground` lub `text-muted-foreground`
- [ ] Ikony na kolorach: `text-white`
- [ ] Ikony kolorowe mają dark: `dark:text-X-400`

### Karty i Alerty
- [ ] Card backgrounds: `bg-card`
- [ ] Alert backgrounds mają dark: `dark:bg-X-950/30`
- [ ] Badge backgrounds mają dark: `dark:bg-X-950/30`

### Interaktywne Elementy
- [ ] Hover efekty działają w dark mode
- [ ] Focus states są widoczne w dark mode
- [ ] Active states mają dobry kontrast
- [ ] Disabled states są wyciszone odpowiednio

### Kolory Brandowe
- [ ] Hero sections mają gradienty bez zmian (white text OK)
- [ ] Dekoracyjne elementy są widoczne: `bg-white/5`
- [ ] Przyciski CTA są widoczne i kontrastowe
```

---

## 📚 Przykłady Popularne

### 1. Karta Statystyki

```tsx
<Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
  {/* Tło gradientowe z dark mode */}
  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
  
  <CardContent className="relative p-6">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        {/* Tekst wyciszony */}
        <p className="text-sm font-medium text-muted-foreground">Tytuł</p>
        {/* Główna wartość */}
        <p className="text-3xl font-bold">42</p>
        {/* Pomocniczy opis */}
        <p className="text-xs text-muted-foreground">Opis</p>
      </div>
      
      {/* Ikona w gradiencie */}
      <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </CardContent>
</Card>
```

### 2. Formularz w Karcie

```tsx
<Card className="border-0 shadow-xl overflow-hidden">
  {/* Header z gradientem */}
  <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-8">
    <div className="flex items-center gap-3 mb-6">
      {/* Ikona */}
      <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-lg">
        <Plus className="h-5 w-5 text-white" />
      </div>
      {/* Tytuł */}
      <h2 className="text-2xl font-bold">Dodaj Nowego</h2>
    </div>
    
    {/* Formularz component */}
    <Form />
  </div>
</Card>
```

### 3. Lista z Hover

```tsx
<Card className="group border bg-card hover:bg-accent/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
  <CardContent className="p-6">
    {/* Tekst z hover effect */}
    <h3 className="text-lg font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
      Element
    </h3>
    
    {/* Pomocniczy tekst */}
    <p className="text-sm text-muted-foreground">Opis elementu</p>
  </CardContent>
</Card>
```

### 4. Alert z Kolorowym Tłem

```tsx
<Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30">
  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
  <AlertDescription className="text-blue-800 dark:text-blue-300">
    Informacja dla użytkownika
  </AlertDescription>
</Alert>
```

### 5. Toggle Button

```tsx
<Button
  variant="outline"
  onClick={handleToggle}
  className={`${
    isActive
      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 hover:from-purple-700 hover:to-indigo-700'
      : 'bg-card hover:bg-accent text-foreground border-border hover:border-purple-300 dark:hover:border-purple-700'
  }`}
>
  {isActive ? 'Aktywny' : 'Nieaktywny'}
</Button>
```

### 6. Badge z Ikoną

```tsx
<div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
    5 rezerwacji
  </span>
</div>
```

---

## ⚠️ Częste Błędy

### ❌ BŁĘDY - Czego Unikać

```tsx
// ❌ ZŁE - Hardcoded white
className="bg-white text-black"

// ❌ ZŁE - Brak dark mode dla gradientu
className="bg-gradient-to-r from-blue-50 to-cyan-50"

// ❌ ZŁE - Hardcoded gray
className="text-gray-500"

// ❌ ZŁE - Zła przezroczystość w dark
className="bg-blue-950/90" // Za ciemne!

// ❌ ZŁE - Brak kontrastu
className="text-gray-600 dark:text-gray-500" // Za mały kontrast
```

### ✅ POPRAWNE - Dobre Praktyki

```tsx
// ✅ DOBRZE - Semantic tokens
className="bg-card text-foreground"

// ✅ DOBRZE - Gradient z dark mode
className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"

// ✅ DOBRZE - Muted foreground
className="text-muted-foreground"

// ✅ DOBRZE - Odpowiednia przezroczystość
className="bg-blue-950/30" // Widać kolor, nie przytłacza

// ✅ DOBRZE - Dobry kontrast
className="text-blue-700 dark:text-blue-300"
```

---

## 🛠️ Narzędzia Debug

### Testowanie Dark Mode

```tsx
// W przeglądarce - toggle dark mode
// Chrome DevTools > Rendering > Emulate CSS media feature prefers-color-scheme

// Lub przycisk w UI (jeśli zaimplementowany)
// Sprawdź każdą stronę w obu motywach
```

### Sprawdzanie Kontrastu

**Narzędzia online:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors Contrast Checker](https://coolors.co/contrast-checker)

**Minimalne wartości WCAG:**
- Tekst normalny: **4.5:1**
- Tekst duży (18px+): **3:1**
- Elementy UI: **3:1**

---

## 📝 Workflow Implementacji

### 1. Projektowanie Komponentu
```
1. Zacznij od semantic tokens
2. Dodaj kolory brandowe (gradienty)
3. Przetestuj w light mode
4. Dodaj dark: variants
5. Przetestuj w dark mode
6. Sprawdź kontrast
7. Commit
```

### 2. Refactoring Istniejącego Komponentu
```
1. Znajdź hardcoded kolory (bg-white, text-black, etc.)
2. Zamień na semantic tokens
3. Znajdź gradienty bez dark mode
4. Dodaj dark: variants z /30 opacity
5. Sprawdź ramki (border-X-200 -> dark:border-X-800)
6. Test w obu motywach
7. Commit z opisem zmian
```

### 3. Code Review Checklist
```markdown
- [ ] Brak hardcoded bg-white
- [ ] Brak hardcoded text-black/text-gray-X00
- [ ] Wszystkie gradienty mają dark variants
- [ ] Hover states widoczne w dark mode
- [ ] Ikony mają odpowiednie kolory
- [ ] Alerty i badges mają dark backgrounds
- [ ] Toggle buttons mają adaptacyjne kolory
```

---

## 📊 Metryki Jakości

### Target Metrics
- **100%** komponentów z dark mode support
- **Min 4.5:1** contrast ratio dla tekstu
- **Zero** hardcoded white/black backgrounds
- **Spójność** - ten sam pattern we wszystkich komponentach

### Progress Tracking

```markdown
## Dark Mode Support Status

### ✅ Completed (100%)
- [x] Login Page
- [x] Sidebar
- [x] Dashboard
- [x] Clients Module (page + components)
- [x] Halls Module (page + components)
- [x] Queue Module (page + components)
- [x] Reservations Module (page + components)

### 🔄 In Progress (0%)
- [ ] -

### ⏳ Planned (0%)
- [ ] -
```

---

## 📚 Zasoby

### Dokumentacja
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

### Kolory Tailwind
- [Tailwind Color Palette](https://tailwindcss.com/docs/customizing-colors)
- Wzorzec: Light `X-50` do `X-200`, Dark `X-800` do `X-950`

### Inspiracje
- [Linear App](https://linear.app) - Excellent dark mode
- [GitHub](https://github.com) - Subtle contrasts
- [Vercel](https://vercel.com) - Premium gradients

---

## 🔄 Historia Zmian

| Data | Wersja | Zmiany |
|------|--------|--------|
| 09.02.2026 | 1.0.0 | Initial documentation - Complete dark mode guidelines |

---

## 👥 Kontakt

Pytania lub sugestie dotyczące dark mode:
- 📧 Email: kamil@gosciniecrodzinny.pl
- 🐛 GitHub Issues: [Go-ciniec_2/issues](https://github.com/kamil-gol/Go-ciniec_2/issues)

---

**Built with ❤️ for Gościniec Rodzinny**
