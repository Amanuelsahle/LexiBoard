const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const requireAuth = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/", dashboardController.getAllDashboards);
router.post("/", dashboardController.createDashboard);
router.patch("/:id/activate", dashboardController.setActiveDashboard);
router.put("/:id", dashboardController.updateDashboard);
router.delete("/:id", dashboardController.deleteDashboard);
router.get("/:boardId/board", dashboardController.getBoardDataByDashboard);

module.exports = router;
