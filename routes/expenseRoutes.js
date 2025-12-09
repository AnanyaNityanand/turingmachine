const express = require("express");
const router = express.Router();
const {
  addExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
  getSummaryStats,
  getRecentStats
} = require("../controllers/expenseController");

// CRUD
router.post("/add", addExpense);
router.get("/all", getExpenses);
router.delete("/:id", deleteExpense);
router.put("/:id", updateExpense);

// Stats
router.get("/stats/summary", getSummaryStats);
router.get("/stats/recent", getRecentStats);

module.exports = router;
