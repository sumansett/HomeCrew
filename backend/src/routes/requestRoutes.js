const router = require("express").Router();
const c = require("../controllers/requestController");
const protect = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(protect("customer"));
router.post("/", upload.array("images", 4), c.createRequest);
router.get("/my", c.getMyRequests);
router.get("/:id", c.getRequest);
router.get("/:id/professional", c.getAssignedProfessional);
router.put("/:id/cancel", c.cancelRequest);
router.put("/:id/review", c.submitReview);


module.exports = router;
