const router = require("express").Router();
const c = require("../controllers/serviceController");
const protect = require("../middleware/auth");

router.get("/", c.getServices);
router.get("/:id", c.getService);
router.post("/", protect("admin"), c.createService);
router.put("/:id", protect("admin"), c.updateService);
router.delete("/:id", protect("admin"), c.deleteService);

module.exports = router;
