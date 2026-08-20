/* eslint-disable */
const fs = require("fs");
const files = [
  "src/services/worker.service.ts",
  "src/services/profile.service.ts",
  "src/services/job.service.ts",
  "src/services/auth.service.ts",
  "src/middlewares/authorization.middleware.ts",
  "src/middlewares/auth.middleware.ts",
  "src/middlewares/active-role.middleware.ts",
  "src/lib/auth/verify-token.ts",
  "src/controllers/telegram.controller.ts",
];

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(
    /from\s+["']@\/middlewares\/error\.middleware["']/g,
    'from "@/errors"',
  );
  fs.writeFileSync(file, content);
  console.log("Updated " + file);
}
