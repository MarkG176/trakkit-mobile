import { format } from "date-fns";
import { formatCurrencySimple } from "@/utils/currency";

export interface ProjectExportData {
  project: {
    name: string;
    client: string;
    status: string;
    productFocus: string;
    salesTarget: number;
    durationMonths: number;
    createdAt: string;
    description: string | null;
  };
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalGiveaways: number;
    totalSurveys: number;
    activeAgents: number;
    completionRate: number;
  };
  dailyBreakdown: Array<{
    date: string;
    sales: number;
    revenue: number;
    giveaways: number;
    surveys: number;
    activeAgents: number;
  }>;
  agentPerformance: Array<{
    agentName: string;
    totalSales: number;
    totalRevenue: number;
    giveaways: number;
    surveys: number;
    checkIns: number;
  }>;
  productBreakdown: Array<{
    productName: string;
    unitsSold: number;
    revenue: number;
    percentOfTotal: number;
  }>;
}

export function generateCSV(data: ProjectExportData, currencyCode = "KES"): string {
  const lines: string[] = [];
  const separator = ",";
  
  // Header Section
  lines.push("PROJECT EXPORT REPORT");
  lines.push(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`);
  lines.push("");
  
  // Project Info Section
  lines.push("=== PROJECT INFORMATION ===");
  lines.push(`Project Name${separator}${escapeCSV(data.project.name)}`);
  lines.push(`Client${separator}${escapeCSV(data.project.client)}`);
  lines.push(`Status${separator}${escapeCSV(data.project.status)}`);
  lines.push(`Product Focus${separator}${escapeCSV(data.project.productFocus)}`);
  lines.push(`Sales Target${separator}${data.project.salesTarget}`);
  lines.push(`Duration (Months)${separator}${data.project.durationMonths}`);
  lines.push(`Created${separator}${data.project.createdAt}`);
  if (data.project.description) {
    lines.push(`Description${separator}${escapeCSV(data.project.description)}`);
  }
  lines.push("");
  
  // Summary Section
  lines.push("=== SUMMARY METRICS ===");
  lines.push(`Metric${separator}Value`);
  lines.push(`Total Sales (Units)${separator}${data.summary.totalSales}`);
  lines.push(`Total Revenue (${currencyCode})${separator}${data.summary.totalRevenue}`);
  lines.push(`Total Giveaways${separator}${data.summary.totalGiveaways}`);
  lines.push(`Total Surveys${separator}${data.summary.totalSurveys}`);
  lines.push(`Active Agents${separator}${data.summary.activeAgents}`);
  lines.push(`Target Completion (%)${separator}${data.summary.completionRate.toFixed(1)}`);
  lines.push("");
  
  // Daily Breakdown Section
  if (data.dailyBreakdown.length > 0) {
    lines.push("=== DAILY BREAKDOWN ===");
    lines.push(`Date${separator}Sales${separator}Revenue (${currencyCode})${separator}Giveaways${separator}Surveys${separator}Active Agents`);
    data.dailyBreakdown.forEach(day => {
      lines.push(`${day.date}${separator}${day.sales}${separator}${day.revenue}${separator}${day.giveaways}${separator}${day.surveys}${separator}${day.activeAgents}`);
    });
    lines.push("");
  }
  
  // Agent Performance Section
  if (data.agentPerformance.length > 0) {
    lines.push("=== AGENT PERFORMANCE ===");
    lines.push(`Agent Name${separator}Sales${separator}Revenue (${currencyCode})${separator}Giveaways${separator}Surveys${separator}Check-ins`);
    data.agentPerformance.forEach(agent => {
      lines.push(`${escapeCSV(agent.agentName)}${separator}${agent.totalSales}${separator}${agent.totalRevenue}${separator}${agent.giveaways}${separator}${agent.surveys}${separator}${agent.checkIns}`);
    });
    lines.push("");
  }
  
  // Product Breakdown Section
  if (data.productBreakdown.length > 0) {
    lines.push("=== PRODUCT BREAKDOWN ===");
    lines.push(`Product${separator}Units Sold${separator}Revenue (${currencyCode})${separator}% of Total`);
    data.productBreakdown.forEach(product => {
      lines.push(`${escapeCSV(product.productName)}${separator}${product.unitsSold}${separator}${product.revenue}${separator}${product.percentOfTotal.toFixed(1)}%`);
    });
  }
  
  return lines.join("\n");
}

export function generateTXT(data: ProjectExportData, currencyCode = "KES"): string {
  const lines: string[] = [];
  const divider = "─".repeat(60);
  
  // Header
  lines.push("╔" + "═".repeat(58) + "╗");
  lines.push("║" + centerText("PROJECT EXPORT REPORT", 58) + "║");
  lines.push("╚" + "═".repeat(58) + "╝");
  lines.push("");
  lines.push(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`);
  lines.push("");
  
  // Project Info
  lines.push(divider);
  lines.push("PROJECT INFORMATION");
  lines.push(divider);
  lines.push(formatRow("Project Name", data.project.name));
  lines.push(formatRow("Client", data.project.client));
  lines.push(formatRow("Status", data.project.status));
  lines.push(formatRow("Product Focus", data.project.productFocus));
  lines.push(formatRow("Sales Target", data.project.salesTarget.toLocaleString()));
  lines.push(formatRow("Duration", `${data.project.durationMonths} months`));
  lines.push(formatRow("Created", data.project.createdAt));
  if (data.project.description) {
    lines.push("");
    lines.push("Description:");
    lines.push(wrapText(data.project.description, 60));
  }
  lines.push("");
  
  // Summary Metrics
  lines.push(divider);
  lines.push("SUMMARY METRICS");
  lines.push(divider);
  lines.push(formatRow("Total Sales", `${data.summary.totalSales.toLocaleString()} units`));
  lines.push(formatRow("Total Revenue", formatCurrencySimple(data.summary.totalRevenue, currencyCode)));
  lines.push(formatRow("Total Giveaways", data.summary.totalGiveaways.toLocaleString()));
  lines.push(formatRow("Total Surveys", data.summary.totalSurveys.toLocaleString()));
  lines.push(formatRow("Active Agents", data.summary.activeAgents.toString()));
  lines.push(formatRow("Target Completion", `${data.summary.completionRate.toFixed(1)}%`));
  lines.push("");
  
  // Daily Breakdown
  if (data.dailyBreakdown.length > 0) {
    lines.push(divider);
    lines.push("DAILY BREAKDOWN");
    lines.push(divider);
    lines.push("");
    
    // Table header
    const headers = ["Date", "Sales", "Revenue", "Giveaways", "Surveys", "Agents"];
    const colWidths = [12, 8, 12, 10, 8, 8];
    lines.push(formatTableRow(headers, colWidths));
    lines.push("─".repeat(colWidths.reduce((a, b) => a + b, 0) + colWidths.length - 1));
    
    data.dailyBreakdown.forEach(day => {
      lines.push(formatTableRow([
        day.date,
        day.sales.toString(),
        day.revenue.toLocaleString(),
        day.giveaways.toString(),
        day.surveys.toString(),
        day.activeAgents.toString()
      ], colWidths));
    });
    lines.push("");
  }
  
  // Agent Performance
  if (data.agentPerformance.length > 0) {
    lines.push(divider);
    lines.push("AGENT PERFORMANCE");
    lines.push(divider);
    lines.push("");
    
    const headers = ["Agent", "Sales", "Revenue", "Giveaways", "Surveys"];
    const colWidths = [20, 8, 12, 10, 8];
    lines.push(formatTableRow(headers, colWidths));
    lines.push("─".repeat(colWidths.reduce((a, b) => a + b, 0) + colWidths.length - 1));
    
    data.agentPerformance.forEach(agent => {
      lines.push(formatTableRow([
        truncate(agent.agentName, 18),
        agent.totalSales.toString(),
        agent.totalRevenue.toLocaleString(),
        agent.giveaways.toString(),
        agent.surveys.toString()
      ], colWidths));
    });
    lines.push("");
  }
  
  // Product Breakdown
  if (data.productBreakdown.length > 0) {
    lines.push(divider);
    lines.push("PRODUCT BREAKDOWN");
    lines.push(divider);
    lines.push("");
    
    const headers = ["Product", "Units", "Revenue", "% Total"];
    const colWidths = [25, 8, 14, 10];
    lines.push(formatTableRow(headers, colWidths));
    lines.push("─".repeat(colWidths.reduce((a, b) => a + b, 0) + colWidths.length - 1));
    
    data.productBreakdown.forEach(product => {
      lines.push(formatTableRow([
        truncate(product.productName, 23),
        product.unitsSold.toString(),
        formatCurrencySimple(product.revenue, currencyCode),
        `${product.percentOfTotal.toFixed(1)}%`
      ], colWidths));
    });
    lines.push("");
  }
  
  lines.push(divider);
  lines.push("END OF REPORT");
  lines.push(divider);
  
  return lines.join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return " ".repeat(leftPad) + text + " ".repeat(rightPad);
}

function formatRow(label: string, value: string): string {
  const labelWidth = 20;
  return `${label.padEnd(labelWidth)}: ${value}`;
}

function formatTableRow(values: string[], widths: number[]): string {
  return values.map((val, i) => val.padEnd(widths[i])).join(" ");
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 2) + "..";
}

function wrapText(text: string, maxWidth: number): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  
  words.forEach(word => {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push("  " + currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push("  " + currentLine);
  
  return lines.join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
