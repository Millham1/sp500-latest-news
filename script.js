// Run after the page loads
document.addEventListener("DOMContentLoaded", function () {
  // Bar chart for daily index moves
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

  // Doughnut chart for earnings season
  const earningsCtx = document.getElementById("earningsChart").getContext("2d");
  new Chart(earningsCtx, {
    type: "doughnut",
    data: {
      labels: ["Beat", "Meet", "Miss"],
      datasets: [{
        label: "Earnings Outcome",
        data: [80, 15, 5],
        backgroundColor: ["#7FB77E", "#F9C851", "#E26A6A"],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "50%",
      plugins: {
        legend: { position: "right", labels: { boxWidth: 12, padding: 10 } },
      },
    },
  });

  // Live ticker setup
  const tickerSymbols = ["AAPL","MSFT","GOOGL","AMZN","NVDA","TSLA","BRK-B","META","JPM","JNJ"];
  const stocksData = [];
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
      if (stocksData.length === 0) {
        const fallback = [
          { symbol: "NVDA", name: "NVIDIA Corp.", prevClose: 600.0, lastClose: 606.0, volume: 51000000 },
          { symbol: "AAPL", name: "Apple Inc.", prevClose: 190.0, lastClose: 193.0, volume: 54000000 },
          { symbol: "MSFT", name: "Microsoft Corp.", prevClose: 360.0, lastClose: 359.0, volume: 32000000 },
          { symbol: "GOOGL", name: "Alphabet Inc.", prevClose: 180.0, lastClose: 183.0, volume: 28000000 },
          { symbol: "AMZN", name: "Amazon.com Inc.", prevClose: 160.0, lastClose: 162.5, volume: 33000000 },
          { symbol: "TSLA", name: "Tesla Inc.", prevClose: 250.0, lastClose: 231.0, volume: 60000000 },
          { symbol: "META", name: "Meta Platforms", prevClose: 320.0, lastClose: 326.0, volume: 24000000 },
          { symbol: "JPM", name: "JPMorgan Chase", prevClose: 190.0, lastClose: 188.0, volume: 18000000 },
          { symbol: "JNJ", name: "Johnson & Johnson", prevClose: 155.0, lastClose: 156.2, volume: 15000000 },
          { symbol: "BRK-B", name: "Berkshire Hathaway", prevClose: 420.0, lastClose: 423.5, volume: 9000000 },
        ];
        fallback.forEach(item => stocksData.push({ ...item }));
        updateTicker();
      }
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
  setInterval(fetchStockData, 5000); // update every 5 seconds

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

  // Live news feed for S&P 500 stocks
  const NEWS_API_KEY = "pub_9dc518a86a1147c48b4b072671ce3ca8";
  let newsItems = [];
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
  function renderNewsItem(article) {
    const list = document.getElementById("news-list");
    const li = document.createElement("li");
    li.innerHTML = `<a href="${article.link}" target="_blank">${article.title}</a>`;
    list.appendChild(li);
  }
  async function refreshNews() {
    const data = await fetchNewsBatch("sp500 stocks");
    if (data && data.status === "success" && Array.isArray(data.results)) {
      data.results.forEach(article => {
        if (!newsItems.some(it => it.link === article.link)) {
          const item = { title: article.title, link: article.link };
          newsItems.push(item);
          renderNewsItem(item);
        }
      });
    }
  }
  refreshNews();
  setInterval(refreshNews, 600000); // fetch news every 10 minutes
});

  }
  refreshNews();
  setInterval(refreshNews, 600000);
});
