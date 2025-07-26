document.addEventListener("DOMContentLoaded", function () {
  // Ticker symbols and fallback data
  const tickerSymbols = ["AAPL","MSFT","GOOGL","AMZN","NVDA","TSLA","BRK-B","META","JPM","JNJ"];
  const stocksData = [
    { symbol: "NVDA", name: "NVIDIA Corp.", prevClose: 600, lastClose: 606, volume: 51000000 },
    { symbol: "AAPL", name: "Apple Inc.", prevClose: 190, lastClose: 193, volume: 54000000 },
    { symbol: "MSFT", name: "Microsoft Corp.", prevClose: 360, lastClose: 359, volume: 32000000 },
    { symbol: "GOOGL", name: "Alphabet Inc.", prevClose: 180, lastClose: 183, volume: 28000000 },
    { symbol: "AMZN", name: "Amazon.com Inc.", prevClose: 160, lastClose: 162.5, volume: 33000000 },
    { symbol: "TSLA", name: "Tesla Inc.", prevClose: 250, lastClose: 231, volume: 60000000 },
    { symbol: "META", name: "Meta Platforms", prevClose: 320, lastClose: 326, volume: 24000000 },
    { symbol: "JPM", name: "JPMorgan Chase", prevClose: 190, lastClose: 188, volume: 18000000 },
    { symbol: "JNJ", name: "Johnson & Johnson", prevClose: 155, lastClose: 156.2, volume: 15000000 },
    { symbol: "BRK-B", name: "Berkshire Hathaway", prevClose: 420, lastClose: 423.5, volume: 9000000 }
  ];

  function computePercentChange(stock) {
    return ((stock.lastClose - stock.prevClose) / stock.prevClose) * 100;
  }

  function updateTicker() {
    const listEl = document.getElementById("ticker-list");
    if (!listEl) return;
    const sorted = stocksData.slice().sort((a, b) => computePercentChange(b) - computePercentChange(a));
    listEl.innerHTML = "";
    sorted.forEach(stock => {
      const change = computePercentChange(stock);
      const price = stock.lastClose.toFixed(2);
      const arrowSymbol = change >= 0 ? "↑" : "↓";
      const arrowClass = change >= 0 ? "arrow-up" : "arrow-down";
      const item = document.createElement("div");
      item.className = "ticker-item " + (change >= 0 ? "positive" : "negative");
      item.dataset.symbol = stock.symbol;
      item.innerHTML = `<span class="symbol">${stock.symbol}</span>` +
                       `<span class="price">${price}</span>` +
                       `<span class="change">${change >= 0 ? "+" : ""}${change.toFixed(2)}%</span>` +
                       `<span class="${arrowClass}">${arrowSymbol}</span>`;
      listEl.appendChild(item);
    });
    updateMovers();
  }

  async function fetchStockData() {
    try {
      const symbolsParam = tickerSymbols.join("%2C");
      const apiUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      stocksData.length = 0;
      data.quoteResponse.result.forEach(item => {
        stocksData.push({
          symbol: item.symbol,
          name: item.shortName || item.longName || item.symbol,
          prevClose: item.regularMarketPreviousClose,
          lastClose: item.regularMarketPrice,
          volume: item.regularMarketVolume
        });
      });
      updateTicker();
    } catch (err) {
      console.error("Error fetching stock data:", err);
    }
  }

  function updateMovers() {
    const advancersEl = document.getElementById("advancers-list");
    const declinersEl = document.getElementById("decliners-list");
    if (!advancersEl || !declinersEl) return;
    const sorted = stocksData.slice().sort((a, b) => computePercentChange(b) - computePercentChange(a));
    const positive = sorted.filter(s => computePercentChange(s) > 0);
    const negative = sorted.filter(s => computePercentChange(s) < 0);
    const topAdvancers = positive.slice(0, 3);
    const topDecliners = negative.slice(0, 3);
    advancersEl.innerHTML = "";
    declinersEl.innerHTML = "";
    topAdvancers.forEach(stock => {
      const pct = computePercentChange(stock);
      const li = document.createElement("li");
      li.innerHTML = `<strong>${stock.name} (${stock.symbol}):</strong> +${pct.toFixed(2)}%`;
      advancersEl.appendChild(li);
    });
    topDecliners.forEach(stock => {
      const pct = computePercentChange(stock);
      const li = document.createElement("li");
      li.innerHTML = `<strong>${stock.name} (${stock.symbol}):</strong> ${pct.toFixed(2)}%`;
      declinersEl.appendChild(li);
    });
  }

  // Initialize with fallback and schedule updates
  updateTicker();
  fetchStockData();
  setInterval(fetchStockData, 5000);

  // Show detail overlay on ticker click
  document.getElementById("ticker-list").addEventListener("click", (e) => {
    const item = e.target.closest(".ticker-item");
    if (!item) return;
    const symbol = item.dataset.symbol;
    const stock = stocksData.find(s => s.symbol === symbol);
    if (!stock) return;
    const pct = computePercentChange(stock);
    document.getElementById("detail-symbol").textContent = stock.symbol;
    document.getElementById("detail-name").textContent = stock.name;
    document.getElementById("detail-change").textContent = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
    document.getElementById("detail-prev").textContent = stock.prevClose.toFixed(2);
    document.getElementById("detail-last").textContent = stock.lastClose.toFixed(2);
    document.getElementById("detail-vol").textContent = Math.round(stock.volume).toLocaleString();
    document.getElementById("stock-detail").classList.remove("hidden");
  });
  document.getElementById("close-detail").addEventListener("click", () => {
    document.getElementById("stock-detail").classList.add("hidden");
  });

  /* --- News feed using Newsdata API --- */
  const NEWS_API_KEY = "pub_9dc518a86a1147c48b4b072671ce3ca8";
  const stockNewsItems = [];
  const govNewsItems = [];

  async function fetchNewsBatch(query) {
    try {
      const url = `https://newsdata.io/api/1/news?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(query)}&language=en`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`News fetch failed (${res.status})`);
      return await res.json();
    } catch (err) {
      console.error("Error fetching news:", err);
      return null;
    }
  }

  function formatCitation(source, dateStr) {
    if (!dateStr || !source) return "";
    const d = new Date(dateStr);
    const options = {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    };
    return `${source} – ${d.toLocaleString("en-US", options)}`;
  }

  function renderStockNewsItem(article) {
    const list = document.getElementById("stock-news-list");
    const li = document.createElement("li");
    const citation = formatCitation(article.source_id || article.source, article.pubDate);
    li.innerHTML = `<a href="${article.link}" target="_blank">${article.title}</a>` +
                   `<br><small class="citation-text">Source: ${citation}</small>`;
    list.appendChild(li);
  }

  function renderGovNewsItem(article) {
    const list = document.getElementById("gov-news-list");
    const li = document.createElement("li");
    li.innerHTML = `<a href="${article.link}" target="_blank">${article.title}</a>`;
    list.appendChild(li);
  }

  async function refreshStockNews() {
    const data = await fetchNewsBatch("sp500 stocks");
    let added = false;
    if (data && data.status === "success" && Array.isArray(data.results)) {
      data.results.forEach(article => {
        if (!stockNewsItems.some(it => it.link === article.link)) {
          stockNewsItems.push(article);
          renderStockNewsItem(article);
          added = true;
        }
      });
    }
    if (!added && stockNewsItems.length === 0) {
      const fallback = [
        { title: "Alphabet earnings propel S&P 500 tech giants to record highs", link: "https://newsdata.io/article/alphabet-earnings-tech-giants", source: "Newsdata", pubDate: "2025-07-24T12:00:00-04:00" },
        { title: "Tesla slump drags S&P 500 industrials after earnings miss", link: "https://newsdata.io/article/tesla-slump-industrials", source: "Newsdata", pubDate: "2025-07-24T12:00:00-04:00" },
        { title: "Trade deals boost sentiment for S&P 500 companies ahead of tariff deadline", link: "https://newsdata.io/article/trade-deals-tariff-deadline", source: "Newsdata", pubDate: "2025-07-24T12:00:00-04:00" }
      ];
      fallback.forEach(article => {
        stockNewsItems.push(article);
        renderStockNewsItem(article);
      });
    }
  }

  async function refreshGovNews() {
    const data = await fetchNewsBatch("economic reports OR macroeconomy");
    let added = false;
    if (data && data.status === "success" && Array.isArray(data.results)) {
      data.results.forEach(article => {
        if (!govNewsItems.some(it => it.link === article.link)) {
          govNewsItems.push(article);
          renderGovNewsItem(article);
          added = true;
        }
      });
    }
    if (!added && govNewsItems.length === 0) {
      const fallback = [
        { title: "Markets await Q2 GDP release as economic momentum assessed", link: "https://newsdata.io/article/q2-gdp-release" },
        { title: "Nonfarm Payrolls on deck: investors eye hiring and wages", link: "https://newsdata.io/article/nonfarm-payrolls-preview" },
        { title: "Fed rate decision approaches amid mixed inflation data", link: "https://newsdata.io/article/fed-rate-decision-preview" }
      ];
      fallback.forEach(article => {
        govNewsItems.push(article);
        renderGovNewsItem(article);
      });
    }
  }

  refreshStockNews();
  refreshGovNews();
  setInterval(refreshStockNews, 600000);
  setInterval(refreshGovNews, 600000);
});











