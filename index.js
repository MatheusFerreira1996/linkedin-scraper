const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { searchUrl } = req.body;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(searchUrl, { waitUntil: 'networkidle2' });

  await page.waitForSelector('.entity-result__content');

  const leads = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.entity-result__content'));
    return items.map(item => ({
      name: item.querySelector('.entity-result__title-text')?.innerText?.trim(),
      title: item.querySelector('.entity-result__primary-subtitle')?.innerText?.trim(),
      location: item.querySelector('.entity-result__secondary-subtitle')?.innerText?.trim(),
      profileUrl: item.querySelector('a')?.href,
    }));
  });

  await browser.close();
  res.json(leads);
});

app.listen(5000, '0.0.0.0', () => console.log('Scraper rodando na porta 5000'));
//app.listen(3000, () => console.log('Scraper rodando na porta 3000'));
