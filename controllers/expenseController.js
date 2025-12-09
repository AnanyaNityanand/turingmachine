const Expense = require("../models/Expense");

// Category buckets for TM
const SAFE = ["food", "rent", "savings", "groceries", "medicine", "fees"];
const MODERATE = ["snacks", "travel", "coffee", "entertainment"];
const RISK = ["shopping", "binge", "gaming", "topup", "impulse", "luxury"];

function evaluateTuringState(expenses) {
  let finalState = "START";

  for (let exp of expenses) {
    const cat = exp.category.toLowerCase();
    if (SAFE.includes(cat)) finalState = "SAFE";
    else if (MODERATE.includes(cat)) finalState = "MODERATE";
    else if (RISK.includes(cat)) finalState = "RISK";
    else finalState = "MODERATE";
  }

  let riskScore = 1;
  if (finalState === "MODERATE") riskScore = 2;
  if (finalState === "RISK") riskScore = 3;

  return { finalState, riskScore };
}

exports.addExpense = async (req, res) => {
  try {
    const { category, amount, date } = req.body;

    if (!category || !amount) {
      return res.status(400).json({ message: "Category and amount required" });
    }

    const expense = new Expense({
      category,
      amount,
      date: date || Date.now()
    });

    await expense.save();
    res.json({ message: "Expense added!", expense });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, date } = req.body;

    const updated = await Expense.findByIdAndUpdate(
      id,
      { category, amount, date },
      { new: true }
    );

    res.json({ message: "Expense updated", expense: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getSummaryStats = async (req, res) => {
  try {
    const expenses = await Expense.find();

    let totalSpent = 0;
    let byCategory = {};

    expenses.forEach((exp) => {
      totalSpent += exp.amount;
      const cat = exp.category.toLowerCase();
      if (!byCategory[cat]) byCategory[cat] = 0;
      byCategory[cat] += exp.amount;
    });

    const { finalState, riskScore } = evaluateTuringState(expenses);

    // Find highest spending category
    let highestCategory = null;
    let highestAmount = 0;
    for (let [cat, amt] of Object.entries(byCategory)) {
      if (amt > highestAmount) {
        highestAmount = amt;
        highestCategory = cat;
      }
    }

    res.json({
      totalSpent,
      totalCount: expenses.length,
      byCategory,
      highestCategory,
      highestAmount,
      finalState,
      riskScore
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getRecentStats = async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // 7 days including today

    const expenses = await Expense.find({
      date: { $gte: sevenDaysAgo }
    });

    // Group by date (YYYY-MM-DD)
    const map = {};
    expenses.forEach((exp) => {
      const d = new Date(exp.date);
      const key = d.toISOString().split("T")[0];
      if (!map[key]) map[key] = 0;
      map[key] += exp.amount;
    });

    // Build array sorted by date
    const labels = [];
    const values = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split("T")[0];
      labels.push(key);
      values.push(map[key] || 0);
    }

    res.json({ labels, values });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
