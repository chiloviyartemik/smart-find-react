# React + TypeScript: большая теоретическая база для переноса Smart Find

> Цель: перенести существующий сайт на Vanilla JavaScript с базой данных в React + TypeScript так, чтобы не просто «переписать», а понять архитектуру, состояние интерфейса, типы и работу с API.

---

## 1. Картина целиком

### Что меняется при переходе

В Vanilla JS обычно приложение работает так:

1. Находим DOM-элемент через `querySelector`.
2. Получаем данные через `fetch`.
3. Вручную создаём HTML-строки или элементы.
4. Вставляем их в DOM с `innerHTML`, `append` и т. п.
5. На события `click`, `input`, `change` вручную меняем классы, текст и разметку.

В React логика меняется на декларативную:

> **Интерфейс — это функция от данных и состояния.**

Условная формула:

```text
UI = f(state, props, data)
```

Ты не говоришь браузеру: «найди эту кнопку и покрась её». Вместо этого ты меняешь состояние, а React заново рассчитывает, каким должен быть интерфейс.

```tsx
const [theme, setTheme] = useState<'light' | 'dark'>('light');

return (
  <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
    {theme === 'light' ? '🌙' : '☀️'}
  </button>
);
```

После `setTheme(...)` React сам обновит только то, что зависит от темы.

### Что не нужно выбрасывать

Переход на React не означает, что надо забыть HTML, CSS и JavaScript:

- HTML превращается в JSX/TSX;
- CSS остаётся CSS: переменные, media queries, Grid, Flexbox и стили компонентов всё так же важны;
- JavaScript-логика сохраняется, но становится частью компонентов и функций;
- `fetch` продолжает использоваться для API;
- база данных остаётся на сервере: React не подключается к БД напрямую.

React отвечает за клиентский UI. Сервер/API отвечает за авторизацию, бизнес-логику и доступ к базе данных.

---

## 2. React: фундаментальные понятия

### Компонент

**Компонент** — функция, которая возвращает часть интерфейса. Компоненты пишутся с заглавной буквы.

```tsx
function Header() {
  return <header>Smart Find</header>;
}

export default Header;
```

Компонент можно использовать как собственный HTML-тег:

```tsx
function App() {
  return (
    <>
      <Header />
      <main>Содержимое страницы</main>
    </>
  );
}
```

Для проекта Smart Find логичное начальное деление:

```text
App
├── Header
│   ├── BurgerButton
│   └── ThemeToggle
├── SearchPage
│   ├── FilterPanel
│   │   ├── PriceRange
│   │   ├── FilterGroup
│   │   └── FilterOption
│   ├── ProductList
│   │   └── ProductCard
│   └── EmptyState
└── Footer
```

Не нужно дробить всё на компоненты с первого дня. Выноси часть интерфейса тогда, когда она:

- переиспользуется;
- имеет отдельную логику;
- становится большой и ухудшает читаемость родительского компонента.

### JSX и TSX

JSX — синтаксис, похожий на HTML, внутри JavaScript. Когда к JSX добавляется TypeScript, файл имеет расширение `.tsx`.

```tsx
const title = 'Подбор смартфонов';

function Hero() {
  return <h1>{title}</h1>;
}
```

Выражения JavaScript вставляются в фигурных скобках `{}`.

В JSX есть важные отличия от HTML:

| HTML | JSX/TSX | Причина |
|---|---|---|
| `class` | `className` | `class` — ключевое слово JavaScript |
| `for` у `<label>` | `htmlFor` | `for` используется в JS |
| `onclick` | `onClick` | События пишутся camelCase |
| `style="..."` | `style={{ color: 'red' }}` | `style` получает объект |

Пример:

```tsx
<button
  className="filter-button"
  onClick={handleReset}
  disabled={isLoading}
>
  Сбросить фильтры
</button>
```

### Один корневой элемент

Компонент должен вернуть один корневой элемент. Если лишний DOM-контейнер не нужен, применяют Fragment:

```tsx
function PageTitle() {
  return (
    <>
      <h1>Подбор</h1>
      <p>Настройте фильтры и найдите подходящую модель.</p>
    </>
  );
}
```

---

## 3. Props: входные данные компонента

**Props** — параметры, которые родительский компонент передаёт дочернему. Они однонаправленны: сверху вниз.

```tsx
type ProductCardProps = {
  name: string;
  price: number;
  imageUrl: string;
  onSelect: () => void;
};

function ProductCard({ name, price, imageUrl, onSelect }: ProductCardProps) {
  return (
    <article className="product-card">
      <img src={imageUrl} alt={name} />
      <h2>{name}</h2>
      <p>{price.toLocaleString('ru-RU')} ₽</p>
      <button onClick={onSelect}>Подробнее</button>
    </article>
  );
}
```

Использование:

```tsx
<ProductCard
  name="Samsung Galaxy S24"
  price={64990}
  imageUrl="/images/s24.webp"
  onSelect={() => console.log('Выбрана модель')}
/>
```

### Props нельзя менять напрямую

Плохой подход:

```tsx
function Counter({ count }: { count: number }) {
  count += 1; // Нельзя: props принадлежат родителю
  return <p>{count}</p>;
}
```

Если дочерний компонент должен инициировать изменение, он получает callback:

```tsx
type CounterProps = {
  count: number;
  onIncrement: () => void;
};

function Counter({ count, onIncrement }: CounterProps) {
  return <button onClick={onIncrement}>Количество: {count}</button>;
}
```

Это ключевой принцип: **данные идут вниз через props, события поднимаются вверх через функции**.

---

## 4. State: память интерфейса

**State** — данные, которые могут меняться во время работы компонента и должны влиять на отображение.

Для Smart Find это, например:

- открыта ли панель фильтров;
- активна ли тёмная тема;
- значения диапазона цены;
- выбранные характеристики;
- загружены ли товары;
- ошибка запроса;
- строка поиска.

```tsx
import { useState } from 'react';

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  function toggleTheme() {
    setTheme(currentTheme =>
      currentTheme === 'light' ? 'dark' : 'light'
    );
  }

  return (
    <button onClick={toggleTheme} aria-label="Переключить тему">
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Почему нельзя менять state напрямую

Неправильно:

```tsx
filters.minPrice = 20000;
```

React не узнает надёжно, что интерфейс должен обновиться. Используй setter:

```tsx
setFilters(current => ({
  ...current,
  minPrice: 20000,
}));
```

### Неизменяемость (immutability)

Объекты и массивы в состоянии не мутируют. Вместо изменения создаётся новая версия.

```tsx
type Filters = {
  minPrice: number;
  maxPrice: number;
  hasNfc: boolean;
};

const [filters, setFilters] = useState<Filters>({
  minPrice: 10000,
  maxPrice: 100000,
  hasNfc: false,
});

function toggleNfc() {
  setFilters(current => ({
    ...current,
    hasNfc: !current.hasNfc,
  }));
}
```

Для массива выбранных параметров:

```tsx
const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

function toggleBrand(brand: string) {
  setSelectedBrands(current =>
    current.includes(brand)
      ? current.filter(item => item !== brand)
      : [...current, brand]
  );
}
```

### Асинхронность и функциональное обновление

Новая версия state не обязана быть доступна в той же строке кода. Если новое значение зависит от предыдущего, передавай функцию:

```tsx
setCount(current => current + 1);
```

Это безопаснее, чем:

```tsx
setCount(count + 1);
```

особенно при нескольких обновлениях подряд.

---

## 5. Рендеринг списков и условий

### Списки и `key`

Товары из API обычно являются массивом. В React их отображают через `.map()`.

```tsx
type Product = {
  id: string;
  name: string;
  price: number;
};

function ProductList({ products }: { products: Product[] }) {
  return (
    <section className="product-list">
      {products.map(product => (
        <ProductCard
          key={product.id}
          name={product.name}
          price={product.price}
          imageUrl="/images/placeholder.webp"
          onSelect={() => console.log(product.id)}
        />
      ))}
    </section>
  );
}
```

`key` — стабильный уникальный идентификатор элемента. Он помогает React правильно сопоставлять элементы при добавлении, удалении и сортировке.

Не используй индекс массива как `key`, если список может фильтроваться, сортироваться или изменяться:

```tsx
// Нежелательно для динамического списка
products.map((product, index) => <ProductCard key={index} ... />)
```

### Условный рендеринг

В React блоки можно показывать по условию:

```tsx
{isLoading && <p>Загрузка смартфонов…</p>}

{error && <p role="alert">Не удалось загрузить данные: {error}</p>}

{!isLoading && !error && products.length === 0 && (
  <p>По этим параметрам ничего не найдено.</p>
)}
```

Или через тернарный оператор:

```tsx
<button>
  {theme === 'light' ? 'Включить тёмную тему' : 'Включить светлую тему'}
</button>
```

---

## 6. События и формы

В Vanilla JS:

```js
button.addEventListener('click', handler);
```

В React:

```tsx
<button onClick={handler}>Нажми</button>
```

Передавай функцию, а не результат её выполнения:

```tsx
// Правильно
<button onClick={handleSave}>Сохранить</button>

// Неправильно: функция вызовется прямо во время рендера
<button onClick={handleSave()}>Сохранить</button>
```

### Контролируемые поля

React обычно хранит значение input в state. Это называется контролируемым компонентом.

```tsx
import type { ChangeEvent } from 'react';
import { useState } from 'react';

function SearchInput() {
  const [query, setQuery] = useState('');

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
  }

  return (
    <input
      value={query}
      onChange={handleChange}
      placeholder="Например, Samsung с NFC"
    />
  );
}
```

В таком подходе state — единый источник истины. Интерфейс показывает `query`, а каждое изменение поля обновляет `query`.

### Пример фильтра

```tsx
type PriceFilterProps = {
  min: number;
  max: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
};

function PriceFilter({ min, max, onMinChange, onMaxChange }: PriceFilterProps) {
  return (
    <fieldset>
      <legend>Цена</legend>

      <label>
        От
        <input
          type="number"
          value={min}
          min={0}
          onChange={event => onMinChange(Number(event.target.value))}
        />
      </label>

      <label>
        До
        <input
          type="number"
          value={max}
          min={0}
          onChange={event => onMaxChange(Number(event.target.value))}
        />
      </label>
    </fieldset>
  );
}
```

---

## 7. Effects и работа с браузером/API

### Что такое side effect

Рендер компонента должен быть «чистым»: из одинаковых данных он должен возвращать одинаковый JSX и не выполнять побочные действия.

**Side effects** — действия вне расчёта JSX:

- HTTP-запросы (`fetch`);
- чтение/запись `localStorage`;
- изменение `document.title`;
- установка таймеров;
- подписки на события браузера;
- работа с внешними библиотеками.

Для этого используют `useEffect`.

```tsx
import { useEffect, useState } from 'react';

function PageTitle() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Найдено товаров: ${count}`;
  }, [count]);

  return <button onClick={() => setCount(c => c + 1)}>Добавить</button>;
}
```

### Массив зависимостей

```tsx
useEffect(() => {
  // код эффекта
}, [dependency]);
```

- Без массива: эффект после каждого рендера.
- `[]`: эффект при монтировании компонента.
- `[query, page]`: эффект при изменении `query` или `page`.

Не подставляй `[]` механически. Зависимости определяются значениями, которые эффект читает из области компонента.

### Загрузка товаров из API

```tsx
import { useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
};

type ApiState = 'idle' | 'loading' | 'success' | 'error';

function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<ApiState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setStatus('loading');
        setError(null);

        const response = await fetch('/api/products', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data: Product[] = await response.json();
        setProducts(data);
        setStatus('success');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;

        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        setStatus('error');
      }
    }

    loadProducts();

    return () => controller.abort();
  }, []);

  return { products, status, error };
}
```

Здесь `useProducts` — **кастомный хук**: функция, которая содержит повторно используемую логику и начинается с `use`.

### Очистка эффекта

Если эффект создаёт подписку, таймер или запрос, он должен уметь очистить себя:

```tsx
useEffect(() => {
  const timerId = window.setInterval(() => {
    console.log('Проверка обновлений');
  }, 5000);

  return () => window.clearInterval(timerId);
}, []);
```

Это предотвращает утечки и попытки обновления уже удалённого компонента.

### Когда эффект не нужен

Не используй `useEffect` для значений, которые можно вычислить при рендере.

Плохо:

```tsx
const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

useEffect(() => {
  setFilteredProducts(products.filter(product => product.price <= maxPrice));
}, [products, maxPrice]);
```

Лучше:

```tsx
const filteredProducts = products.filter(product => product.price <= maxPrice);
```

Так меньше состояния, меньше ошибок и нет лишнего рендера.

---

## 8. TypeScript: зачем он нужен

TypeScript — это JavaScript с системой типов. Он проверяет код до запуска и помогает редактору подсказать допустимые свойства и значения. В браузер TypeScript не отправляется: сборщик преобразует его в JavaScript.

### Что TypeScript реально даёт в твоём проекте

- ловит опечатки в названиях полей API;
- не даёт передать строку там, где должна быть цена-число;
- подсказывает свойства товара в редакторе;
- делает безопаснее рефакторинг компонентов;
- фиксирует контракт между компонентом, API и базой данных;
- облегчает работу с возможными `null`, ошибками и статусами загрузки.

### Базовые типы

```ts
const name: string = 'Smart Find';
const price: number = 49990;
const hasNfc: boolean = true;
const tags: string[] = ['5G', 'NFC'];
const emptyValue: null = null;
```

Чаще всего TypeScript сам выводит простой тип, и указывать его не надо:

```ts
const title = 'Подбор';       // string
const pageSize = 20;          // number
const isOpen = false;         // boolean
```

Явные типы особенно полезны для входных данных, сложного state и функций.

### `type` и `interface`

Для объектов используются оба варианта:

```ts
type Product = {
  id: string;
  name: string;
  price: number;
  brand: string;
  hasNfc: boolean;
};

interface FilterState {
  minPrice: number;
  maxPrice: number;
  brands: string[];
  hasNfc: boolean;
}
```

В обычном React-проекте можно выбрать один стиль и быть последовательным. Для начала удобно использовать `type`.

### Optional-поля

`?` означает, что поле может отсутствовать:

```ts
type Product = {
  id: string;
  name: string;
  oldPrice?: number;
};
```

Использование:

```tsx
{product.oldPrice !== undefined && <del>{product.oldPrice} ₽</del>}
```

### Union types

Union задаёт набор допустимых вариантов:

```ts
type Theme = 'light' | 'dark';
type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

const [theme, setTheme] = useState<Theme>('light');
```

Это лучше, чем просто `string`: невозможно случайно установить тему `'orange-dark-2'`, если такого варианта не существует.

### `null` и `undefined`

В строгом TypeScript переменная с `null` должна явно это разрешать:

```ts
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
```

Перед обращением к полям нужна проверка:

```tsx
{selectedProduct ? (
  <h2>{selectedProduct.name}</h2>
) : (
  <p>Товар не выбран.</p>
)}
```

### Типизация функций

```ts
function formatPrice(price: number): string {
  return `${price.toLocaleString('ru-RU')} ₽`;
}
```

Если функция ничего не возвращает:

```ts
function resetFilters(): void {
  console.log('Фильтры сброшены');
}
```

### Generics

Generics позволяют описать повторно используемые типы. На старте React тебе чаще всего встретятся в `useState`:

```tsx
const [products, setProducts] = useState<Product[]>([]);
const [error, setError] = useState<string | null>(null);
```

---

## 9. TypeScript в React

### Типы props

```tsx
type ThemeToggleProps = {
  theme: 'light' | 'dark';
  onToggle: () => void;
};

function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const label = theme === 'light'
    ? 'Включить тёмную тему'
    : 'Включить светлую тему';

  return (
    <button type="button" onClick={onToggle} aria-label={label}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Типы событий

В большинстве случаев TypeScript выведет тип события автоматически, если обработчик написан прямо в JSX:

```tsx
<input onChange={event => setQuery(event.target.value)} />
```

Если выносишь обработчик в функцию:

```tsx
import type { ChangeEvent, FormEvent, MouseEvent } from 'react';

function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
  console.log(event.target.value);
}

function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
}

function handleButtonClick(event: MouseEvent<HTMLButtonElement>) {
  console.log(event.currentTarget.name);
}
```

### `children`

Для компонента-обёртки:

```tsx
import type { ReactNode } from 'react';

type PanelProps = {
  title: string;
  children: ReactNode;
};

function Panel({ title, children }: PanelProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
```

---

## 10. Данные, API и база данных

### React не должен иметь прямой доступ к БД

Безопасная схема выглядит так:

```text
React-клиент → HTTP API → серверная логика → база данных
```

Например:

```text
Browser (React)
  GET /api/products?minPrice=20000&hasNfc=true
        ↓
Backend (Node.js / Express / NestJS / serverless function)
        ↓
Database (PostgreSQL / MySQL / MongoDB / Supabase и т. д.)
```

Причины:

- нельзя отправлять логин, пароль или ключ БД в браузер;
- сервер должен проверять права пользователя;
- сервер валидирует параметры фильтров;
- сервер скрывает внутреннюю структуру БД;
- бизнес-правила должны быть централизованы.

### DTO: форма данных от API

API возвращает JSON. Опиши ожидаемую форму:

```ts
type ProductDto = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  brand: string;
  has_nfc: boolean;
};
```

Часто удобно преобразовать DTO в тип интерфейса приложения:

```ts
type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  brand: string;
  hasNfc: boolean;
};

function mapProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.title,
    price: dto.price,
    imageUrl: dto.image_url,
    brand: dto.brand,
    hasNfc: dto.has_nfc,
  };
}
```

Так компоненты не зависят от стиля именования полей на бэкенде.

### Важное ограничение TypeScript

`const data: Product[] = await response.json()` говорит TypeScript, что ты **ожидаешь** такую структуру. Но сервер может вернуть ошибочные данные в реальности. TypeScript не проверяет JSON во время выполнения.

Для серьёзного проекта данные API валидируют runtime-схемой (например, Zod) или проверяют вручную на сервере и клиенте.

### Фильтры и query-параметры

```ts
type ProductFilters = {
  minPrice?: number;
  maxPrice?: number;
  brands: string[];
  hasNfc?: boolean;
};

function buildProductsUrl(filters: ProductFilters): string {
  const params = new URLSearchParams();

  if (filters.minPrice !== undefined) {
    params.set('minPrice', String(filters.minPrice));
  }

  if (filters.maxPrice !== undefined) {
    params.set('maxPrice', String(filters.maxPrice));
  }

  if (filters.hasNfc !== undefined) {
    params.set('hasNfc', String(filters.hasNfc));
  }

  filters.brands.forEach(brand => params.append('brand', brand));

  return `/api/products?${params.toString()}`;
}
```

Не собирай URL строковой конкатенацией из непроверенных полей: `URLSearchParams` корректно кодирует значения.

---

## 11. Состояние: локальное, общее и серверное

### Локальное состояние

Принадлежит одному компоненту:

```tsx
const [isOpen, setIsOpen] = useState(false);
```

Пример: открыта ли конкретная секция фильтров.

### Поднятие состояния (lifting state up)

Если два компонента должны использовать общие данные, состояние поднимают в ближайшего общего родителя.

```text
SearchPage
├── FilterPanel      ← меняет filters через callback
└── ProductList      ← получает отфильтрованные товары
```

```tsx
function SearchPage() {
  const [filters, setFilters] = useState<ProductFilters>({ brands: [] });

  return (
    <>
      <FilterPanel filters={filters} onChange={setFilters} />
      <ProductList filters={filters} />
    </>
  );
}
```

### Глобальное состояние

Нужно, когда данные требуются многим удалённым компонентам: тема, текущий пользователь, язык.

Для темы можно начать с Context:

```tsx
import { createContext, useContext, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  function toggleTheme() {
    setTheme(current => (current === 'light' ? 'dark' : 'light'));
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme должен использоваться внутри ThemeProvider');
  return context;
}
```

Не помещай в Context всё подряд. Часто лучше держать state рядом с компонентом, которому он нужен.

### Серверное состояние

Товары, пользователь, заказы и результаты поиска — это состояние, источником которого является сервер. У него есть отдельные сложности: загрузка, кеширование, повторный запрос, ошибка, устаревание данных.

На первом переносе можно начать с `fetch` + `useEffect`. Позже изучи TanStack Query: библиотека специально предназначена для управления серверным состоянием.

---

## 12. Роутинг

В приложении с несколькими страницами нужен роутер. Для SPA стандартный вариант — React Router.

Пример структуры маршрутов:

```text
/                 Главная
/search           Подбор смартфонов
/product/:id      Карточка товара
/favorites        Избранное
/login            Вход
```

Концептуально маршруты сопоставляют URL и компонент:

```tsx
<Route path="/" element={<HomePage />} />
<Route path="/search" element={<SearchPage />} />
<Route path="/product/:id" element={<ProductPage />} />
```

Не пытайся переносить навигацию через ручное `window.location` везде. Роутер помогает сохранять SPA-навигацию, параметры URL и историю браузера.

### Фильтры в URL

Для проекта-поисковика полезно хранить часть фильтров в URL:

```text
/search?minPrice=20000&maxPrice=70000&brand=Samsung&brand=Xiaomi
```

Преимущества:

- результат можно отправить ссылкой;
- после обновления страницы фильтры сохраняются;
- кнопки «Назад/Вперёд» работают ожидаемо.

Не обязательно делать это в первый день, но это хороший этап после базового переноса.

---

## 13. Стили, CSS и темы

Твой опыт CSS переносится почти напрямую. В React можно начать с одного `index.css` / `App.css`, а затем раскладывать стили по компонентам.

### CSS-переменные для тем

Лучше иметь одинаковые имена переменных, но разные значения темы:

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #212529;
  --text-secondary: #495057;
  --border-color: #d7dee4;
  --accent-primary: #d97706;
  --accent-hover: #b45309;
}

:root[data-theme="dark"] {
  --bg-primary: #0f171f;
  --bg-secondary: #1a242f;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --border-color: #334155;
  --accent-primary: #f59e0b;
  --accent-hover: #fbbf24;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
}
```

В React значение темы удобно ставить на `<html>`:

```tsx
useEffect(() => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}, [theme]);
```

Начальное значение можно получить из `localStorage`, но нужно предусмотреть, что там может быть неверная строка:

```ts
function getInitialTheme(): Theme {
  const savedTheme = localStorage.getItem('theme');
  return savedTheme === 'dark' ? 'dark' : 'light';
}
```

---

## 14. Архитектура папок

Для начала не усложняй архитектуру. Практичный вариант:

```text
src/
├── app/
│   ├── App.tsx
│   └── routes.tsx
├── components/
│   ├── Header/
│   │   ├── Header.tsx
│   │   └── Header.css
│   ├── ThemeToggle/
│   │   └── ThemeToggle.tsx
│   └── ProductCard/
│       ├── ProductCard.tsx
│       └── ProductCard.css
├── features/
│   └── product-search/
│       ├── FilterPanel.tsx
│       ├── ProductList.tsx
│       ├── product.types.ts
│       └── product.api.ts
├── hooks/
│   ├── useProducts.ts
│   └── useTheme.ts
├── lib/
│   ├── formatPrice.ts
│   └── buildProductsUrl.ts
├── types/
│   └── api.ts
├── styles/
│   ├── variables.css
│   └── global.css
└── main.tsx
```

Правило: держи файлы, которые меняются вместе, рядом. Не нужно создавать отдельные папки для каждого маленького типа или утилиты, пока проект не стал достаточно большим.

---

## 15. Пошаговый перенос Smart Find

### Этап 0. Не переписывай всё сразу

Создай новую ветку:

```bash
git checkout -b react-migration
```

Старый Vanilla JS-проект остаётся рабочей точкой сравнения. Перенос делай небольшими этапами, после каждого проверяя, что приложение запускается.

### Этап 1. Создать React + TypeScript приложение

Для клиентского SPA-проекта используй Vite:

```bash
npm create vite@latest smart-find-react -- --template react-ts
cd smart-find-react
npm install
npm run dev
```

Vite даёт быстрый dev-сервер и шаблон React + TypeScript. Файлы с JSX будут `.tsx`, обычная логика без JSX — `.ts`. [web:46][web:49]

### Этап 2. Перенести статичный UI

Сначала перенеси HTML без фильтрации и API:

- `Header`;
- навигацию;
- блок фильтров;
- один статичный `ProductCard`;
- footer.

На этом этапе учись переводить HTML в JSX: `class` → `className`, inline-события → `onClick`.

### Этап 3. Разбить на компоненты

Убери копирование разметки. Если карточки одинаковы по структуре — сделай `ProductCard` и передавай props.

### Этап 4. Описать модели TypeScript

До подключения API создай `Product`, `ProductFilters`, `Theme`, `RequestStatus`. Это станет договором для компонентов.

### Этап 5. Перенести интерактивность

Последовательность:

1. Переключатель темы.
2. Открытие/закрытие панели фильтров.
3. Контролируемые поля цены.
4. Чекбоксы характеристик.
5. Фильтрация локального тестового массива.
6. Сброс фильтров.

### Этап 6. Подключить API

Вынеси запросы в `product.api.ts` или `useProducts.ts`. Обязательно отобрази состояния:

- `loading`;
- `error`;
- `empty`;
- `success`.

### Этап 7. Подключить реальную БД через backend

Если у тебя уже есть рабочий API, не переписывай сервер одновременно с клиентом. Сначала подключи новый React-интерфейс к старым endpoints. Это резко снижает количество неизвестных проблем.

### Этап 8. Улучшения после MVP

- маршрутизация;
- сохранение фильтров в URL;
- избранное;
- пагинация или бесконечная прокрутка;
- debounce поиска;
- кеширование запросов;
- валидация форм;
- тесты;
- доступность.

---

## 16. Частые ошибки новичка

### 1. Управлять DOM вручную

Не делай в компонентах без необходимости:

```ts
document.querySelector('.menu')?.classList.add('active');
```

Вместо этого:

```tsx
const [isMenuOpen, setIsMenuOpen] = useState(false);

<nav className={isMenuOpen ? 'menu menu--open' : 'menu'}>
  ...
</nav>
```

### 2. Хранить вычисляемое значение в state

Если данные можно вычислить из `products` и `filters`, не создавай третий state `filteredProducts` без причины.

### 3. Один гигантский `App.tsx`

Компонент на 500–1000 строк трудно читать и тестировать. Выноси самостоятельные блоки.

### 4. Ставить `any`

`any` отключает смысл TypeScript. Лучше описать минимальный тип, использовать `unknown` и проверку или временно сузить задачу.

### 5. Использовать `useEffect` для всего

Effects — для синхронизации с внешней системой. Не для вычисления простых значений и не для обработки каждого клика.

### 6. Делать состояние глобальным слишком рано

Контекст, Redux и другие хранилища не обязательны для обычных фильтров. Сначала `useState` и props, затем — только при реальной необходимости — Context или библиотека.

### 7. Передавать секреты в Vite-клиент

Переменные окружения с префиксом `VITE_` попадают в клиентский бандл. Нельзя хранить там пароль БД, секрет API или сервисный ключ.

---

## 17. Что учить по порядку

### База React

1. JSX и компоненты.
2. Props и однонаправленный поток данных.
3. `useState`, события, controlled inputs.
4. Списки, `key`, условный рендеринг.
5. Поднятие состояния.
6. `useEffect` и cleanup.
7. Кастомные хуки.
8. Context для темы/пользователя.
9. Роутинг.

### База TypeScript

1. Примитивы, массивы, объекты.
2. `type`, `interface`.
3. Optional fields, `null`, `undefined`.
4. Union types и literal types.
5. Типизация props, state и событий.
6. Generics: `useState<T>`, типы API.
7. Narrowing: проверки `typeof`, `instanceof`, `if (value)`.
8. Избегание `any`.

### После основ

- React Router;
- TanStack Query для серверного состояния;
- Zod для валидации данных;
- React Hook Form для больших форм;
- тестирование: Vitest + React Testing Library;
- производительность: `useMemo`, `useCallback`, `React.memo` — только после понимания реальной проблемы;
- Next.js, если позже понадобится SEO, серверный рендеринг или full-stack React.

---

## 18. Мини-шпаргалка

```tsx
// Props
function Card({ title }: { title: string }) {
  return <h2>{title}</h2>;
}

// State
const [isOpen, setIsOpen] = useState(false);
setIsOpen(current => !current);

// Список
items.map(item => <li key={item.id}>{item.name}</li>);

// Условие
{isLoading ? <Loader /> : <ProductList />}

// Контролируемый input
<input value={query} onChange={e => setQuery(e.target.value)} />

// Эффект
useEffect(() => {
  // запрос / localStorage / подписка
  return () => {
    // очистка при необходимости
  };
}, [dependency]);

// Безопасный объект в state
setFilters(current => ({ ...current, hasNfc: true }));

// CSS-класс по условию
<div className={isOpen ? 'panel panel--open' : 'panel'} />
```

---

## 19. Практическое задание для Smart Find

Сделай первую React-версию без базы данных, используя массив `mockProducts`:

1. Создай тип `Product`.
2. Создай `ProductCard` с props: `product`, `onSelect`.
3. Создай `ProductList`, который выводит карточки через `.map()`.
4. В `SearchPage` заведи `filters` с `minPrice`, `maxPrice`, `brands`, `hasNfc`.
5. Отфильтруй `mockProducts` без `useEffect` — обычным вычислением во время рендера.
6. Добавь `ThemeProvider` или state темы в `App`.
7. Перенеси текущие CSS-переменные в `variables.css`.
8. Только после этого замени `mockProducts` на запрос к существующему API.

Этот порядок даст тебе практику сразу в компонентах, props, state, TypeScript, фильтрации, темах и работе с данными — без одновременной борьбы с React и сервером.

---

## 20. Главная мысль

React не отменяет обычный JavaScript. Он задаёт удобную модель, где интерфейс описан как результат состояния. TypeScript добавляет договорённости: какие данные существуют, какие свойства у них есть и какие значения допустимы.

Для твоего проекта хороший путь — не «переписать сайт одним рывком», а переносить его по слоям: **статичная вёрстка → компоненты → state → фильтры → API → улучшения**. Так каждая часть переноса становится отдельной учебной задачей.

---

## Полезные официальные материалы

- [React Learn](https://react.dev/learn) — основной курс документации React: компоненты, state, props, эффекты и архитектура. [web:44]
- [React + TypeScript](https://react.dev/learn/typescript) — особенности TypeScript в React, `.tsx`, props и state. [web:46]
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — официальная документация языка TypeScript. [web:45]
- [React на MDN](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/React_getting_started) — вводный материал с объяснением компонентов и props. [web:48]
