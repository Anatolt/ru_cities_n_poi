// ...existing code...
/**
 * Простое SPA на чистом ES6 с hash-маршрутизацией.
 * Загружает ./poi.json и рендерит:
 *  - renderHome(data)
 *  - renderRegion(data, slug)
 *  - renderCity(data, regionSlug, citySlug)
 *  - renderAttraction(data, regionSlug, citySlug, attrSlug)
 *
 * Готово для GitHub Pages (все маршруты через хеш).
 */

(async () => {
  // Корневой элемент приложения
  const app = document.getElementById('app');

  // Кэш данных после загрузки
  let DATA = null;

  // Загружаем poi.json из корня (подходит для GitHub Pages)
  async function loadData() {
    if (DATA) return DATA;
    try {
      const res = await fetch('poi.json', {cache: "no-store"});
      if (!res.ok) throw new Error('Не удалось загрузить poi.json');
      DATA = await res.json();
      return DATA;
    } catch (err) {
      renderError('Ошибка загрузки данных: ' + (err.message || err));
      throw err;
    }
  }

  // Отображение ошибки в UI
  function renderError(msg) {
    app.innerHTML = `<div class="not-found"><h2>Ошибка</h2><p class="meta">${escapeHtml(msg)}</p></div>`;
  }

  // Помогает безопасно вставлять текст
  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Получить "slug" элемента: предпочитаем поле slug, иначе генерируем
  function getSlug(item) {
    if (!item) return '';
    if (item.slug) return String(item.slug);
    // Простейшая генерация: латинские символы не обязательны — используем encodeURIComponent по имени
    return encodeURIComponent(String(item.name || item.title || '').toLowerCase().replace(/\s+/g, '-'));
  }

  // Найти регион по слагу
  function findRegion(data, regionSlug) {
    if (!data || !Array.isArray(data.regions)) return null;
    return data.regions.find(r => getSlug(r) === regionSlug || String(r.slug) === regionSlug) || null;
  }

  // Найти город по слагу внутри региона
  function findCity(region, citySlug) {
    if (!region || !Array.isArray(region.cities)) return null;
    return region.cities.find(c => getSlug(c) === citySlug || String(c.slug) === citySlug) || null;
  }

  // Найти достопримечательность по слагу внутри города
  function findAttraction(city, attrSlug) {
    if (!city || !Array.isArray(city.attractions)) return null;
    return city.attractions.find(a => getSlug(a) === attrSlug || String(a.slug) === attrSlug) || null;
  }

  // Рендер главной страницы: список регионов
  function renderHome(data) {
    const regions = Array.isArray(data.regions) ? data.regions : [];
    const items = regions.map(r => {
      const slug = getSlug(r);
      const name = escapeHtml(r.name || r.title || 'Без названия');
      const desc = r.description ? `<p class="meta">${escapeHtml(r.description)}</p>` : '';
      return `
        <article class="card">
          <h3><a class="link" href="#/region/${slug}">${name}</a></h3>
          ${desc}
        </article>
      `;
    }).join('');

    app.innerHTML = `
      <h1 class="page-title">Регионы</h1>
      <div class="cards">${items || '<div class="not-found">Регионы не найдены</div>'}</div>
    `;
  }

  // Рендер страницы региона: список городов региона
  function renderRegion(data, regionSlug) {
    const region = findRegion(data, regionSlug);
    if (!region) {
      renderNotFound();
      return;
    }
    const cities = Array.isArray(region.cities) ? region.cities : [];

    const items = cities.map(c => {
      const cslug = getSlug(c);
      const name = escapeHtml(c.name || c.title || 'Без названия');
      const desc = c.description ? `<p class="meta">${escapeHtml(c.description)}</p>` : '';
      return `
        <article class="card">
          <h3><a class="link" href="#/region/${encodeURIComponent(regionSlug)}/${cslug}">${name}</a></h3>
          ${desc}
        </article>
      `;
    }).join('');

    app.innerHTML = `
      <div class="breadcrumbs">
        <a class="link" href="#/">Регионы</a> › <span>${escapeHtml(region.name || region.title || regionSlug)}</span>
      </div>
      <h1 class="page-title">Города — ${escapeHtml(region.name || region.title || '')}</h1>
      <div class="cards">${items || '<div class="not-found">Города не найдены</div>'}</div>
    `;
  }

  // Рендер страницы города: список достопримечательностей
  function renderCity(data, regionSlug, citySlug) {
    const region = findRegion(data, regionSlug);
    if (!region) { renderNotFound(); return; }
    const city = findCity(region, citySlug);
    if (!city) { renderNotFound(); return; }

    const attractions = Array.isArray(city.attractions) ? city.attractions : [];

    const items = attractions.map(a => {
      const aslug = getSlug(a);
      const name = escapeHtml(a.name || a.title || 'Без названия');
      const desc = a.description ? `<p class="meta">${escapeHtml(a.description)}</p>` : '';
      return `
        <article class="card">
          <h3><a class="link" href="#/region/${encodeURIComponent(regionSlug)}/${encodeURIComponent(citySlug)}/${aslug}">${name}</a></h3>
          ${desc}
        </article>
      `;
    }).join('');

    app.innerHTML = `
      <div class="breadcrumbs">
        <a class="link" href="#/">Регионы</a> › 
        <a class="link" href="#/region/${encodeURIComponent(regionSlug)}">${escapeHtml(region.name || region.title || regionSlug)}</a> › 
        <span>${escapeHtml(city.name || city.title || citySlug)}</span>
      </div>
      <h1 class="page-title">Достопримечательности — ${escapeHtml(city.name || city.title || '')}</h1>
      <div class="cards">${items || '<div class="not-found">Достопримечательности не найдены</div>'}</div>
    `;
  }

  // Рендер отдельной достопримечательности
  // Поддерживает вывод "Мерч" (одежда) если есть.
  function renderAttraction(data, regionSlug, citySlug, attrSlug) {
    const region = findRegion(data, regionSlug);
    if (!region) { renderNotFound(); return; }
    const city = findCity(region, citySlug);
    if (!city) { renderNotFound(); return; }
    const attraction = findAttraction(city, attrSlug);
    if (!attraction) { renderNotFound(); return; }

    const title = escapeHtml(attraction.name || attraction.title || attrSlug);
    const desc = attraction.description ? `<p>${escapeHtml(attraction.description)}</p>` : '<p class="meta">Описание отсутствует.</p>';

    // Ищем возможный список одежды / мерча в известных полях
    const merchArray =
      Array.isArray(attraction.merch) ? attraction.merch :
      Array.isArray(attraction.clothes) ? attraction.clothes :
      Array.isArray(attraction.одежда) ? attraction.одежда :
      null;

    let merchHtml = '';
    if (merchArray && merchArray.length) {
      // Преобразуем элементы — поддерживаем и строки, и объекты {name, note}
      const items = merchArray.map(item => {
        if (typeof item === 'string') {
          // Добавляем забавное короткое описание автоматически
          return `<li>${escapeHtml(item)} — отличный сувенир, который порадует дедушку и соседа</li>`;
        } else if (typeof item === 'object' && item !== null) {
          const n = escapeHtml(item.name || item.title || 'Предмет');
          const note = escapeHtml(item.note || item.description || 'Модный и практичный');
          return `<li>${n} — ${note}</li>`;
        } else {
          return `<li>${escapeHtml(String(item))}</li>`;
        }
      }).join('');
      merchHtml = `<h3>Мерч</h3><ul class="merch">${items}</ul>`;
    } else {
      // Если нет явного списка, ищем поле merchNote или clothingNote для показа
      const possibleNote = attraction.merchNote || attraction.clothesNote || attraction.мерч;
      if (possibleNote) {
        merchHtml = `<h3>Мерч</h3><p class="meta">${escapeHtml(possibleNote)}</p>`;
      }
    }

    app.innerHTML = `
      <div class="breadcrumbs">
        <a class="link" href="#/">Регионы</a> › 
        <a class="link" href="#/region/${encodeURIComponent(regionSlug)}">${escapeHtml(region.name || region.title || regionSlug)}</a> › 
        <a class="link" href="#/region/${encodeURIComponent(regionSlug)}/${encodeURIComponent(citySlug)}">${escapeHtml(city.name || city.title || citySlug)}</a> › 
        <span>${title}</span>
      </div>

      <article class="card">
        <h1 class="page-title">${title}</h1>
        ${desc}
        ${merchHtml}
      </article>
    `;
  }

  // Показывает универсальную страницу "не найдено"
  function renderNotFound() {
    app.innerHTML = `
      <div class="not-found">
        <h2>Страница не найдена</h2>
        <p class="meta">Маршрут не распознан или данные отсутствуют.</p>
        <p><a class="link" href="#/">Вернуться на главную</a></p>
      </div>
    `;
  }

  // Главный роутер: парсит location.hash и вызывает соответствующий рендер
  async function router() {
    const data = await loadData();
    const hash = (location.hash || '#/').replace(/^#/, ''); // убираем #
    const parts = hash.split('/').filter(Boolean); // убираем пустые

    // Маршруты:
    // [] => home
    // ['region', regionSlug] => region
    // ['region', regionSlug, citySlug] => city
    // ['region', regionSlug, citySlug, attrSlug] => attraction
    if (parts.length === 0) {
      renderHome(data);
      return;
    }

    if (parts[0] === 'region') {
      const regionSlug = parts[1] ? parts[1] : null;
      const citySlug = parts[2] ? parts[2] : null;
      const attrSlug = parts[3] ? parts[3] : null;

      if (!regionSlug) { renderNotFound(); return; }

      if (regionSlug && !citySlug) {
        renderRegion(data, regionSlug);
        return;
      }

      if (regionSlug && citySlug && !attrSlug) {
        renderCity(data, regionSlug, citySlug);
        return;
      }

      if (regionSlug && citySlug && attrSlug) {
        renderAttraction(data, regionSlug, citySlug, attrSlug);
        return;
      }
    }

    // Любой другой маршрут — страница не найдена
    renderNotFound();
  }

  // Обработчики событий: загрузка и смена хеша
  window.addEventListener('hashchange', () => {
    // Плавная обработка ошибок (не блочим UI)
    router().catch(err => console.error(err));
  });

  window.addEventListener('DOMContentLoaded', () => {
    // Стартовый роут
    router().catch(err => console.error(err));
  });

})();