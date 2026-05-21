const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const requireAuth = require("../middleware/authMiddleware");

// Force authorization layer on every board transaction
router.use(requireAuth);

router.get("/board", taskController.getBoardData);
router.patch("/:id/reorder", taskController.reorderTask);
router.post("/", taskController.createTask);
router.delete("/:id", taskController.deleteTask);
router.put("/:id", taskController.updateTaskDetails);

module.exports = router;
