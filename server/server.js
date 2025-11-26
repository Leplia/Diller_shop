import express from "express";
import pool from './db.js';
import { carsRouter } from "./src/cars/cars.controller.js";
import { usersRouter } from "./src/users/users.controller.js";
import { ordersRouter } from "./src/orders/orders.controller.js";
import { testDrivesRouter } from "./src/test-drives/test-drives.controller.js";
import { reviewsRouter } from "./src/reviews/reviews.controller.js";
import { faqRouter } from "./src/faq/faq.controller.js";
import cors from 'cors';

const app = express();


async function main() {
  app.use(express.json());
  const PORT = 4200;

  app.use(cors());

  app.use("/api/cars", carsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/test-drives", testDrivesRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/faq", faqRouter);
  
  app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

  app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
  });
}

main();
