// script.js
const tickerList = document.getElementById('ticker-list');
const stockNewsList = document.getElementById('stock-news-list');
const govUpcomingList = document.getElementById('gov-upcoming-list');
const govNewsList = document.getElementById('gov-news-list');

const detailPanel = document.getElementById('stock-detail');
const detailSymbol = document.getElementById('detail-symbol');
const detailName = document.getElementById('detail-name');
const detailChange = document.getElementById('detail-change');
const detailClose = document.getElementById('detail-close');
const detailVolume = document.getElementById('detail-volume');

const FINNHUB_URL = 'https://finnhub.io/api/v1/screener?token=c1vbm1iad3ie9m3id6gg&market=US&exchange=US';
const GNEWS_URL = 'https://gnews.io/api/v4/search?q=sp500&lang=en&apikey=2ca29948797355a9512aebd0be958da9';

async function fetchTopMovers() {
  try {
    const res = await fetch(FINNHUB_URL);
    const data = await res.json();
    const movers = data?.stocks?.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 10);
    tickerList.innerHTML = '';
    movers.forEach(stock => {
      const el = document.createElement('div');
      el.className = 'ticker-item';
      el.innerHTML = `
        <strong>${stock.symbol}</strong>
        <span>${stock.description}</span>
        <span>${stock.last} USD</span>
        <span class="${stock.changePercent >= 0 ? 'trend-up' : 'trend-down'}">
          ${stock.changePercent >= 0 ? '▲' : '▼'} ${stock.changePercent.toFixed(2)}%
        </span>
      `;
      el.addEventListener('click', () => showStockDetail(stock));
      tickerList.appendChild(el);
    });
  } catch (err) {
    console.error('Error loading top movers:', err);
  }
}

function showStockDetail(stock) {
  detailSymbol.textContent = stock.symbol;
  detailName.textContent = stock.description;
  detailChange.textContent = `Change: ${stock.changePercent.toFixed(2)}%`;
  detailClose.textContent = `Last Close: ${stock.last} USD`;
  detailVolume.textContent = `Volume: ${stock.volume}`;
  detailPanel.classList.remove('hidden');
}

async function fetchGNewsArticles() {
  try {
    const res = await fetch(GNEWS_URL);
    const data = await res.json();
    const articles = data.articles || [];
    stockNewsList.innerHTML = '';
    govNewsList.innerHTML = '';

    articles.forEach(article => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a href="${article.url}" target="_blank">${article.title}</a>
        <br><small>Source: ${article.source.name}, ${new Date(article.publishedAt).toLocaleString()}</small>
      `;
      if (article.title.toLowerCase().includes('report') || article.title.toLowerCase().includes('economic')) {
        govNewsList.appendChild(li);
      } else {
        stockNewsList.appendChild(li);
      }
    });
  } catch (err) {
    console.error('Error loading news articles:', err);
  }
}

function simulateUpcomingGovReports() {
  govUpcomingList.innerHTML = `
    <li>CPI Report – Aug 1, 8:30 AM ET</li>
    <li>Non-Farm Payrolls – Aug 2, 8:30 AM ET</li>
    <li>Fed Meeting Minutes – Aug 7, 2:00 PM ET</li>
  `;
}

fetchTopMovers();
fetchGNewsArticles();
simulateUpcomingGovReports();
setInterval(fetchTopMovers, 5000);  // every 5 sec
setInterval(fetchGNewsArticles, 600000); // every 10 min









