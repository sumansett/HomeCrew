const router = require("express").Router();
const c = require("../controllers/adminController");
const protect = require("../middleware/auth");

router.post("/login", c.login);
router.post("/forgot-password", c.forgotPassword);
router.post("/reset-password", c.resetPassword);

// everything below needs an admin token
router.use(protect("admin"));
router.get("/stats", c.getStats);

router.get("/users", c.getUsers);
router.get("/users/:id", c.getUser);
router.delete("/users/:id", c.deleteUser);

router.get("/professionals", c.getProfessionals);
router.put("/professionals/:id/verify", c.verifyProfessional);
router.delete("/professionals/:id", c.deleteProfessional);

router.get("/requests", c.getRequests);
router.get("/requests/:id/professionals", c.getAssignable);
router.put("/requests/:id/assign", c.assignProfessional);
router.put("/requests/:id/status", c.updateRequestStatus);

router.get("/reviews", c.getReviews);
router.get("/financials", c.getFinancials);
router.put("/requests/:id/payment", c.updateRequestPayment);
router.post("/payouts/:id/settle", c.settlePayout);
router.post("/financials/clear-cash-commission", c.clearCashCommission);
router.post("/financials/settle-pro-payout", c.settleProfessionalPayouts);

module.exports = router;
