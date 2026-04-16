import app, { initializeStorage } from "./app";

const PORT = Number(process.env.PORT || 3000);

async function startServer(): Promise<void> {
  try {
    await initializeStorage();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void startServer();
