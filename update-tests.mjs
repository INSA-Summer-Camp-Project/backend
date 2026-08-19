import fs from "node:fs";
import path from "node:path";

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith(".ts")) {
      let content = fs.readFileSync(fullPath, "utf8");

      // Update error imports
      content = content.replaceAll(
        /from\s+["']@\/middlewares\/error\.middleware["']/g,
        'from "@/errors"',
      );

      // Update ChapaClient instance
      content = content.replaceAll("ChapaClient", "chapaClient");

      // Fix handleSuccessfulPayment extraction
      content = content.replaceAll(
        /paymentService\.handleSuccessfulPayment/g,
        "paymentWebhookService.handleSuccessfulPayment",
      );

      // Import paymentWebhookService if not there and handleSuccessfulPayment is used
      if (
        content.includes("paymentWebhookService.handleSuccessfulPayment") &&
        !content.includes("payment-webhook.service")
      ) {
        content =
          'import * as paymentWebhookService from "@/services/payment-webhook.service";\n' +
          content;
      }

      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir("tests");
