const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');

const app = express();
app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { searchUrl } = req.body;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Aplica cookies de sessão do LinkedIn
    const cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
    await page.setCookie(...cookies);

    // Acessa a página de busca
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    await page.waitForSelector('.entity-result__content', { timeout: 30000 });

    const leads = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.entity-result__content'));
      return items.map(item => ({
        name: item.querySelector('.entity-result__title-text')?.innerText?.trim(),
        title: item.querySelector('.entity-result__primary-subtitle')?.innerText?.trim(),
        location: item.querySelector('.entity-result__secondary-subtitle')?.innerText?.trim(),
        profileUrl: item.querySelector('a')?.href,
      }));
    });

    res.json(leads);
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao carregar a página ou encontrar os perfis',
      details: error.message
    });
  } finally {
    await browser.close();
  }
});

app.listen(5000, '0.0.0.0', () => console.log('Scraper rodando na porta 5000'));
