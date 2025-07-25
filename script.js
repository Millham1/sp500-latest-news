document.addEventListener("DOMContentLoaded", function () {
  // Market snapshot bar chart
  const snapshotCtx = document.getElementById("snapshotChart").getContext("2d");
  new Chart(snapshotCtx, {
    type: "bar",
    data: {
      labels: ["S&P 500", "Nasdaq", "Dow"],
      datasets: [{
        label: "Daily Change (%)",
        data: [0.1, 0.2, -0.7],
        backgroundColor: ["#7FB77E", "#7FB77E", "#7FB77E"],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: "Index", color: "#030a18", font: { size: 12, weight: "bold" } },
          ticks: { color: "#030a18", font: { size: 12 } },
        },
        y: {
          min: -1.0, max: 0.3,
          ticks: {
            color: "#030a18",
            font: { size: 12 },
            stepSize: 0.2,
            callback: val => `${val}%`,
          },
          title: {
            display: true, text: "Daily Change (%)",
            color: "#030a18", font: { size: 12, weight: "bold" },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.parsed.y;
              return `${val > 0 ? "+" : ""}${val.toFixed(1)}%`;
            },
          },
        },
      },
    },
  });

  // S&P 500 stocks monitored for the ticker
  const tickerSymbols = ["AAPL","MSFT","GOOGL","AMZN","NVDA","TSLA","BRK-B","META","JPM","JNJ"];
  const stocksData = [
    // Fallback data to ensure the ticker and movers display something immediately
    { symbol: "NVDA", name: "NVIDIA Corp.", prevClose: 600, lastClose: 606, volume: 51000000 },
    { symbol: "AAPL", name: "Apple Inc.", prevClose: 190, lastClose: 193, volume: 54000000 },
    { symbol: "MSFT", name: "Microsoft Corp.", prevClose: 360, lastClose: 359, volume: 32000000 },
    { symbol: "GOOGL", name: "Alphabet Inc.", prevClose: 180, lastClose: 183, volume: 28000000 },
    { symbol: "AMZN", name: "Amazon.com Inc.", prevClose: 160, lastClose: 162.5, volume: 33000000 },
    { symbol: "TSLA", name: "Tesla Inc.", prevClose: 250, lastClose: 231, volume: 60000000 },
    { symbol: "META", name: "Meta Platforms", prevClose: 320, lastClose: 326, volume: 24000000 },
    { symbol: "JPM", name: "JPMorgan Chase", prevClose: 190, lastClose: 188, volume: 18000000 },
    { symbol: "JNJ", name: "Johnson & Johnson", prevClose: 155, lastClose: 156.2, volume: 15000000 },
    { symbol: "BRK-B", name: "Berkshire Hathaway", prevClose: 420, lastClose: 423.5, volume: 9000000 },
  ];
  // Render fallback immediately
  updateTicker();

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
      const item = document.createElement("div");
      item.className = "ticker-item " + (change >= 0 ? "positive" : "negative");
      item.dataset.symbol = stock.symbol;
      const shortName = stock.name.split(" ")[0];
      item.innerHTML = `<span class="symbol">${stock.symbol}</span><span class="name">${shortName}</span><span class="change">${change >= 0 ? "+" : ""}${change.toFixed(2)}%</span>`;
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
          volume: item.regularMarketVolume,
        });
      });
      updateTicker();
    } catch (error) {
      console.error("Error fetching stock data:", error);
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
      const li = document.createElement("li");
      const pct = computePercentChange(stock);
      li.innerHTML = `<strong>${stock.name} (${stock.symbol}):</strong> +${pct.toFixed(2)}%`;
      advancersEl.appendChild(li);
    });
    topDecliners.forEach(stock => {
      const li = document.createElement("li");
      const pct = computePercentChange(stock);
      li.innerHTML = `<strong>${stock.name} (${stock.symbol}):</strong> ${pct.toFixed(2)}%`;
      declinersEl.appendChild(li);
    });
  }

  fetchStockData();
  setInterval(fetchStockData, 5000); // refresh every 5 seconds

  document.getElementById("ticker-list").addEventListener("click", e => {
    const item = e.target.closest(".ticker-item");
    if (!item) return;
    const symbol = item.dataset.symbol;
    const stock = stocksData.find(s => s.symbol === symbol);
    if (stock) {
      const detailSection = document.getElementById("stock-detail");
      document.getElementById("detail-symbol").textContent = stock.symbol;
      document.getElementById("detail-name").textContent = stock.name;
      const pct = computePercentChange(stock);
      document.getElementById("detail-change").textContent = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
      document.getElementById("detail-prev").textContent = stock.prevClose.toFixed(2);
      document.getElementById("detail-last").textContent = stock.lastClose.toFixed(2);
      document.getElementById("detail-vol").textContent = Math.round(stock.volume).toLocaleString();
      detailSection.classList.remove("hidden");
    }
  });
  document.getElementById("close-detail").addEventListener("click", () => {
    document.getElementById("stock-detail").classList.add("hidden");
  });

  /* --- News feed setup --- */
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

  function renderStockNewsItem(article) {
    const list = document.getElementById("stock-news-list");
    const li = document.createElement("li");
    li.innerHTML = `<a href="${article.link}" target="_blank">${article.title}</a>`;
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
          const item = { title: article.title, link: article.link };
          stockNewsItems.push(item);
          renderStockNewsItem(item);
          added = true;
        }
      });
    }
    if (!added && stockNewsItems.length === 0) {
      const fallback = [
        { title: "Alphabet earnings propel S&P 500 tech giants to record highs", link: "https://example.com/alphabet-earnings-sp500" },
        { title: "Tesla slump drags S&P 500 industrials after earnings miss", link: "https://example.com/tesla-slump-sp500" },
        { title: "Trade deals boost sentiment for S&P 500 companies ahead of tariff deadline", link: "https://example.com/trade-deals-sp500" },
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
          const item = { title: article.title, link: article.link };
          govNewsItems.push(item);
          renderGovNewsItem(item);
          added = true;
        }
      });
    }
    if (!added && govNewsItems.length === 0) {
      const fallback = [
        { title: "Markets await Q2 GDP release as economic momentum assessed", link: "https://example.com/gdp-q2-preview" },
        { title: "Nonfarm Payrolls on deck: investors eye hiring and wages", link: "https://example.com/nonfarm-payrolls-preview" },
        { title: "Fed rate decision approaches amid mixed inflation data", link: "https://example.com/fomc-preview" },
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


