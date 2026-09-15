import { test, expect } from '@playwright/test';
import { UI_TEST_SITES } from '../../helpers/sites';

// Увеличиваем общий таймаут для тестов (особенно полезно для Firefox)
test.setTimeout(120000);

/** Sites come from helpers/sites.ts (shared with portal). */
const sites = UI_TEST_SITES;

for (const site of sites) {
  // 1) Десктопный тест
  test(`Visual check [Desktop] for ${site.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(site.url, { waitUntil: 'domcontentloaded' });

    // Отключаем анимации, переходы и ПОЛНОСТЬЮ убираем картинки/видео/фоны
    await page.addStyleTag({
      content: `
        *, *::before, *::after { 
          animation: none !important; 
          transition: none !important; 
          opacity: 1 !important; 
          transform: none !important; 
        }
        img, video, canvas {
          visibility: hidden !important; /* скрываем все картинки и видео, оставляя под них пустые места */
        }
        [style*="background-image"] {
          background-image: none !important; /* убираем рандомные фоновые картинки */
        }
      `
    });

    // Скроллим до низа, чтобы сработали все ленивые загрузки
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 30);
      });
    });

    // Возвращаем скролл наверх и ждем стабилизации
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const screenshotOptions = { 
      fullPage: true, 
      timeout: 80000,
      maxDiffPixelRatio: 0.01,
    };

    await expect(page).toHaveScreenshot(`${site.name}-desktop.png`, screenshotOptions);
  });

  // 2) Мобильный тест
  test(`Visual check [Mobile] for ${site.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(site.url, { waitUntil: 'domcontentloaded' });

    // Тотальное отключение анимаций и медиа для мобилки
    await page.addStyleTag({
      content: `
        *, *::before, *::after { 
          animation: none !important; 
          transition: none !important; 
          opacity: 1 !important; 
          transform: none !important; 
        }
        img, video, canvas {
          visibility: hidden !important;
        }
        [style*="background-image"] {
          background-image: none !important;
        }
      `
    });

    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 30);
      });
    });

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const screenshotOptions = { 
      fullPage: true, 
      timeout: 80000,
      maxDiffPixelRatio: 0.01,
    };

    await expect(page).toHaveScreenshot(`${site.name}-mobile.png`, screenshotOptions);
  });
}