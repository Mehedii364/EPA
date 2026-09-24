// Custom HTML5 Canvas Chart Renderer for EPA
const EPACharts = {
  // Draw Bar Chart
  renderBarChart(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 360;
    const height = canvas.parentElement.clientHeight || 220;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
      this.drawEmpty(ctx, width, height, options.emptyText || 'No Data Available');
      return;
    }

    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data, 5);
    const barWidth = Math.min(36, (chartW / data.length) * 0.6);
    const gap = chartW / data.length;

    // Grid lines
    ctx.strokeStyle = options.isDark ? '#334155' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis label
      const val = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillStyle = options.isDark ? '#94a3b8' : '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val, padding.left - 8, y + 4);
    }
    ctx.setLineDash([]);

    // Draw Bars
    data.forEach((val, idx) => {
      const barH = (val / maxVal) * chartH;
      const x = padding.left + idx * gap + (gap - barWidth) / 2;
      const y = padding.top + chartH - barH;

      // Gradient fill
      const grad = ctx.createLinearGradient(0, y, 0, padding.top + chartH);
      grad.addColorStop(0, options.color || '#2563eb');
      grad.addColorStop(1, options.colorSecondary || '#60a5fa');

      ctx.fillStyle = grad;
      this.roundRect(ctx, x, y, barWidth, barH, 6);
      ctx.fill();

      // Top count label
      ctx.fillStyle = options.isDark ? '#f8fafc' : '#1e293b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      if (val > 0) {
        ctx.fillText(val, x + barWidth / 2, y - 6);
      }

      // X-axis label
      ctx.fillStyle = options.isDark ? '#94a3b8' : '#64748b';
      ctx.font = '11px sans-serif';
      ctx.fillText(labels[idx], x + barWidth / 2, height - padding.bottom + 20);
    });
  },

  // Draw Donut/Pie Chart
  renderPieChart(canvasId, labels, data, colors, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 360;
    const height = canvas.parentElement.clientHeight || 220;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    const total = data.reduce((a, b) => a + b, 0);
    if (total === 0) {
      this.drawEmpty(ctx, width, height, options.emptyText || 'No Data Available');
      return;
    }

    const centerX = width * 0.38;
    const centerY = height / 2;
    const radius = Math.min(centerX - 20, centerY - 20);
    const innerRadius = radius * 0.55;

    let startAngle = -Math.PI / 2;

    data.forEach((val, idx) => {
      const sliceAngle = (val / total) * 2 * Math.PI;
      const color = colors[idx % colors.length];

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      startAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = options.isDark ? '#f8fafc' : '#1e293b';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(total, centerX, centerY + 2);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = options.isDark ? '#94a3b8' : '#64748b';
    ctx.fillText('Total', centerX, centerY + 16);

    // Legend on the right
    const legendX = width * 0.7;
    let legendY = 30;
    labels.forEach((label, idx) => {
      const val = data[idx];
      const pct = Math.round((val / total) * 100) || 0;
      const color = colors[idx % colors.length];

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = options.isDark ? '#f1f5f9' : '#1e293b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${label}: ${val} (${pct}%)`, legendX + 12, legendY + 4);

      legendY += 24;
    });
  },

  // Draw Horizontal Bar Chart
  renderHorizontalBarChart(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.clientWidth || 360;
    const height = canvas.parentElement.clientHeight || 240;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    if (!data || data.length === 0) {
      this.drawEmpty(ctx, width, height, options.emptyText || 'No Data Available');
      return;
    }

    const padding = { top: 20, right: 40, bottom: 20, left: 110 };
    const chartW = width - padding.left - padding.right;
    const rowH = Math.min(36, (height - padding.top - padding.bottom) / data.length);
    const maxVal = Math.max(...data, 5);

    data.forEach((val, idx) => {
      const y = padding.top + idx * rowH;
      const barW = (val / maxVal) * chartW;

      // Label
      ctx.fillStyle = options.isDark ? '#cbd5e1' : '#334155';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      let label = labels[idx];
      if (label.length > 14) label = label.slice(0, 13) + '…';
      ctx.fillText(label, padding.left - 10, y + rowH / 2 + 4);

      // Bar
      const grad = ctx.createLinearGradient(padding.left, 0, padding.left + barW, 0);
      grad.addColorStop(0, options.color || '#8b5cf6');
      grad.addColorStop(1, '#a78bfa');
      ctx.fillStyle = grad;
      this.roundRect(ctx, padding.left, y + 4, Math.max(barW, 4), rowH - 8, 4);
      ctx.fill();

      // Value
      ctx.fillStyle = options.isDark ? '#f1f5f9' : '#1e293b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(val, padding.left + barW + 8, y + rowH / 2 + 4);
    });
  },

  drawEmpty(ctx, width, height, text) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, width / 2, height / 2);
  },

  roundRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }
};
