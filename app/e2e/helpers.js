export function failOnConsoleErrors(page) {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return () => {
    if (errors.length) throw new Error(`Browser errors:\n${errors.join("\n")}`);
  };
}
